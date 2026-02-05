import { chromium, Browser, Page } from 'playwright';

export interface YoutubeVideoInfo {
  videoId: string;
  title: string;
  description: string;
  captions: string;
}

export interface ProductInfo {
  name: string;
  price: number;
  url: string;
  platform: string;
  calories?: number;
  imageUrl?: string;
  weight?: number;
  weightUnit?: string;
}

export function extractWeightFromName(name: string): { weight: number; unit: string } | null {
  // 1. 수량 및 곱셈 처리 (예: 100g x 3, 200g*5, 100g 10개, 100g(10개입))
  const multiplierPatterns = [
    /(\d+(?:\.\d+)?)\s*(kg|g|ml|l|L|개|팩|봉|포|입|구)\s*[xX*×]\s*(\d+)/i, // 100g x 10
    /(\d+(?:\.\d+)?)\s*(kg|g|ml|l|L|개|팩|봉|포|입|구)\s*\(?(\d+)(?:개|팩|봉|포|입|입|구성|구)/i, // 100g (10개입) 또는 100g 10개
  ];

  for (const pattern of multiplierPatterns) {
    const multiMatch = name.match(pattern);
    if (multiMatch) {
      let baseWeight = parseFloat(multiMatch[1]);
      const unit = multiMatch[2].toLowerCase();
      const count = parseInt(multiMatch[3]);

      if (unit === 'kg' || unit === '킬로그램' || unit === 'l' || unit === '리터') {
        baseWeight *= 1000;
      }
      return {
        weight: baseWeight * count,
        unit: (unit.includes('g') || unit.includes('kg')) ? 'g' : (unit.includes('l') ? 'ml' : 'ea')
      };
    }
  }

  // 2. 단일 용량 처리
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(kg|g|ml|l|L|개|팩|봉|box|BOX|포|입|구)/i,
    /(\d+(?:\.\d+)?)\s*(킬로그램|그램|밀리리터|리터|개)/i,
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      let weight = parseFloat(match[1]);
      let unit = match[2].toLowerCase();

      if (unit === 'kg' || unit === '킬로그램') {
        weight = weight * 1000;
        unit = 'g';
      } else if (unit === 'l' || unit === '리터') {
        weight = weight * 1000;
        unit = 'ml';
      } else if (unit === '개' || unit === '팩' || unit === '봉' || unit === 'box' || unit === '포' || unit === '입') {
        unit = 'ea';
      }

      return { weight, unit };
    }
  }

  return null;
}

export function extractCaloriesFromName(name: string): number | null {
  // 예: "100kcal", "50칼로리", "0칼로리", "Low calorie"
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:kcal|칼로리|키로칼로리)/i,
    /(\d+(?:\.\d+)?)\s*k/i, // 가끔 100k 로 표시되는 경우
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) return parseFloat(match[1]);
  }

  // 저칼로리 키워드 발견 시 낮은 점수(우선순위) 부여를 위해 0kcal로 가상 설정
  const lowerName = name.toLowerCase();
  if (
    lowerName.includes('저칼로리') ||
    lowerName.includes('라이트') ||
    lowerName.includes('제로') ||
    lowerName.includes('곤약') ||
    lowerName.includes('슬림') ||
    lowerName.includes('무설탕') ||
    lowerName.includes('다이어트') ||
    lowerName.includes('low calorie') ||
    lowerName.includes('light') ||
    lowerName.includes('sugar free') ||
    lowerName.includes('diet')
  ) {
    return 0;
  }

  return null;
}

export function findBestMatchByWeight(
  products: ProductInfo[],
  targetWeight: number,
  targetUnit: string,
  filter: 'price' | 'calorie',
  ingredientName?: string
): ProductInfo | null {
  const unitNormalizedTarget = targetUnit === 'kg' || targetUnit === 'L' || targetUnit === 'l'
    ? targetWeight * 1000
    : targetWeight;

  const productsWithWeight = products.map(p => {
    const weightInfo = extractWeightFromName(p.name);
    const calories = p.calories ?? extractCaloriesFromName(p.name);
    const matchScore = ingredientName ? calculateMatchScore(ingredientName, p.name) : 100;

    return {
      ...p,
      parsedWeight: weightInfo?.weight || 0,
      parsedUnit: weightInfo?.unit || 'ea',
      calories: calories !== null ? calories : undefined,
      matchScore
    };
  });

  // 0. 매칭 점수가 너무 낮은 상품 제외 (소금빵, 소금과자 등)
  // 매칭 점수가 0 이상인 상품만 선택 (음수는 제외)
  const goodMatches = ingredientName
    ? productsWithWeight.filter(p => (p as any).matchScore > 0)
    : productsWithWeight;

  if (goodMatches.length === 0) {
    console.log('[Match Filter] All products filtered out due to low match score');
    return null;
  }

  // 1. 유효한 무게 정보가 있는 상품만 필터링
  const validProducts = goodMatches.filter(p => p.parsedWeight > 0);
  if (validProducts.length === 0) return goodMatches[0] || null;

  // 2. 티어 기반 매칭 (용량 적합도 우선)

  // 티어 1: 아주 근접 (0.8배 ~ 1.5배) - 가장 권장되는 패키지 사이즈
  const tier1 = validProducts.filter(p => {
    const ratio = p.parsedWeight / unitNormalizedTarget;
    return ratio >= 0.8 && ratio <= 1.5;
  });

  // 티어 2: 허용 범위 (0.5배 ~ 3.0배) - 다른 대안이 없을 때
  const tier2 = validProducts.filter(p => {
    const ratio = p.parsedWeight / unitNormalizedTarget;
    return ratio >= 0.5 && ratio <= 3.0;
  });

  // 3. 후보군 결정
  let candidates: typeof validProducts = [];
  if (tier1.length > 0) {
    candidates = tier1;
  } else if (tier2.length > 0) {
    candidates = tier2;
  } else {
    // 적절한 용량이 전혀 없다면, 전체 중 무게 차이가 가장 적은 순으로 정렬
    validProducts.sort((a, b) =>
      Math.abs(a.parsedWeight - unitNormalizedTarget) - Math.abs(b.parsedWeight - unitNormalizedTarget)
    );
    // 가장 무게가 비슷한 상위 3개 중에서 필터 적용
    candidates = validProducts.slice(0, 3);
  }

  // 4. 결정된 후보군 내에서 필터(최저가/저칼로리) 적용하여 정렬
  if (filter === 'price') {
    candidates.sort((a, b) => {
      // 0순위: 매칭 점수 (내림차순) - 더 정확한 매칭 우선
      const aScore = (a as any).matchScore || 0;
      const bScore = (b as any).matchScore || 0;
      if (aScore !== bScore) return bScore - aScore;

      // 1순위: 가격 (오름차순)
      if (a.price !== b.price) return a.price - b.price;
      // 2순위: 무게 차이 (오름차순) - 가격이 같다면 용량이 더 적절한 것 선택
      return Math.abs(a.parsedWeight - unitNormalizedTarget) - Math.abs(b.parsedWeight - unitNormalizedTarget);
    });
  } else if (filter === 'calorie') {
    candidates.sort((a, b) => {
      // 0순위: 매칭 점수 (내림차순) - 더 정확한 매칭 우선
      const aScore = (a as any).matchScore || 0;
      const bScore = (b as any).matchScore || 0;
      if (aScore !== bScore) return bScore - aScore;

      const aCal = a.calories || 9999;
      const bCal = b.calories || 9999;
      // 1순위: 칼로리 (오름차순)
      if (aCal !== bCal) return aCal - bCal;
      // 2순위: 가격 (오름차순) - 칼로리 정보가 없거나 같다면 더 싼 것 선택
      if (a.price !== b.price) return a.price - b.price;
      // 3순위: 무게 차이 (오름차순)
      return Math.abs(a.parsedWeight - unitNormalizedTarget) - Math.abs(b.parsedWeight - unitNormalizedTarget);
    });
  }

  return candidates[0];
}

const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'sec-ch-ua': '"Not A(Bread;Authority";v="99", "Google Chrome";v="121", "Chromium";v="121"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
};

export async function searchBaemin(ingredientName: string): Promise<ProductInfo[]> {
  const sanitizedQuery = ingredientName.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    extraHTTPHeaders: {
      ...COMMON_HEADERS,
      'Referer': 'https://mart.baemin.com/',
    }
  });
  const page = await context.newPage();

  try {
    console.log(`[Baemin] Searching for "${sanitizedQuery}"`);
    // B마트 검색 페이지로 이동
    await page.goto(`https://mart.baemin.com/search?q=${encodeURIComponent(sanitizedQuery)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    const products: ProductInfo[] = [];

    try {
      // 1. 상품 리스트 대기
      await page.waitForSelector('[class*="ProductItem"], [data-testid="product-item"], .item-card', { timeout: 10000 }).catch(() => {
        console.warn('[Baemin] Product selector timeout');
      });

      const productElements = page.locator('li:has([class*="Product"]), [data-testid="product-item"], .item-card, [class*="ProductItem"]');
      const count = await productElements.count();
      console.log(`[Baemin] Found ${count} raw product elements`);

      for (let i = 0; i < Math.min(count, 30); i++) {
        const element = productElements.nth(i);

        // 텍스트 내용 전체를 가져와서 분석
        const allText = await element.innerText().catch(() => '');
        const lines = allText.split('\n').map(s => s.trim()).filter(s => s.length > 0);

        // 이름 및 가격 추출 시도
        const name = (lines.find(l => l.length > 3 && !l.includes('원') && !l.includes('배달')) || '').trim();
        const priceLine = lines.find(l => l.includes('원') && /\d/.test(l));

        let price = 0;
        if (priceLine) {
          const priceMatches = priceLine.match(/\d[0-9,.]*/g);
          if (priceMatches && priceMatches.length > 0) {
            price = parseInt(priceMatches[0].replace(/[^0-9]/g, '')) || 0;
          }
        }

        const link = (await element.locator('a').first().getAttribute('href').catch(() => '')) || '';
        const imgElement = element.locator('img').first();
        const imageUrl = (await imgElement.getAttribute('src').catch(() => undefined)) || undefined;

        if (name && price > 0) {
          products.push({
            name: name,
            price,
            url: link && link.startsWith('http') ? link : `https://mart.baemin.com${link}`,
            platform: 'baemin',
            imageUrl,
          });
        }
      }
    } catch (e) {
      console.error('[Baemin] Extraction error:', e);
    }

    return products;
  } finally {
    await browser.close();
  }
}

export async function searchCoupang(ingredientName: string): Promise<ProductInfo[]> {
  // 검색어 정제: 괄호를 제거하되 내부 텍스트는 유지 (예: 돼지고기(다짐육) -> 돼지고기 다짐육)
  const sanitizedQuery = ingredientName.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();

  const browser = await chromium.launch({
    headless: true, // 헤드레스에서도 모바일 UA면 잘 되는 경우가 많음
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'ko-KR,ko;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
  });

  const page = await context.newPage();

  try {
    const searchUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(sanitizedQuery)}&sorter=priceAsc`;
    console.log(`[Coupang] Searching for "${sanitizedQuery}"`);

    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    // 봇 방지 감지 레이아웃이 있는지 확인 (Access Denied 등)
    const content = await page.content();
    if (content.includes('Access Denied') || content.includes('봇 확인') || content.includes('자동 접속')) {
      console.error('[Coupang] Blocked by WAF/Bot detection');
      return [];
    }

    // 상품 리스트 레이아웃이 나타날 때까지 대기
    await page.waitForSelector('.search-product, .baby-product, #productList', { timeout: 10000 }).catch(() => {
      console.warn('[Coupang] Product selector timeout');
    });

    const products: ProductInfo[] = [];

    try {
      const productElements = page.locator('.search-product, .baby-product, li[class*="search-product"], [data-product-id]');
      const count = await productElements.count();
      console.log(`[Coupang] Found ${count} potential product elements`);

      for (let i = 0; i < Math.min(count, 30); i++) {
        const element = productElements.nth(i);

        // 텍스트 내용 전체를 가져와서 분석
        const allText = await element.innerText().catch(() => '');
        const lines = allText.split('\n').map(s => s.trim()).filter(s => s.length > 0);

        // 쿠팡 특성상 이름이 상단에 있고 가격에 ',000원' 형식이 있음
        const name = lines.find(l => l.length > 5 && !l.includes('원') && !l.includes('무료배송')) || '';
        const priceLine = lines.find(l => l.includes('원') && /\d+/.test(l));

        let price = 0;
        if (priceLine) {
          const priceMatches = priceLine.match(/\d[0-9,.]*/g);
          if (priceMatches && priceMatches.length > 0) {
            price = parseInt(priceMatches[0].replace(/[^0-9]/g, '')) || 0;
          }
        }

        const link = (await element.locator('a').first().getAttribute('href').catch(() => '')) || '';
        const imgElement = element.locator('img').first();
        const imageUrl = (await imgElement.getAttribute('src').catch(() => '')) || '';

        if (name && price > 1000) {
          products.push({
            name: name,
            price,
            url: link && link.startsWith('http') ? link : `https://www.coupang.com${link}`,
            platform: 'coupang',
            imageUrl: imageUrl?.startsWith('//') ? `https:${imageUrl}` : imageUrl || undefined,
          });
        }
      }
    } catch (e) {
      console.error('[Coupang] Extraction error:', e);
    }

    return products;
  } catch (err) {
    console.error('[Coupang] Navigation error:', err);
    return [];
  } finally {
    await browser.close();
  }
}

/**
 * 재료명 정제 함수 - 검색 정확도를 위해 괄호만 공백으로 변환
 * 예: "돼지고기(다짐육)" -> "돼지고기 다짐육"
 * 예: "[KF365] 1+등급 무항생제 특란 10구" -> "[KF365] 1+등급 무항생제 특란 10구" (그대로 유지)
 * 
 * 주의: 대괄호[]는 유지하여 브랜드명 등 중요 정보를 보존
 */
function extractCoreIngredient(ingredientName: string): string {
  // 소괄호()만 제거하고 대괄호[]는 유지 (예: 돼지고기(다짐육) -> 돼지고기 다짐육)
  let cleaned = ingredientName.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * 상품명에서 검색에 사용할 핵심 키워드를 추출하는 함수
 * 대괄호로 묶인 접두사([선물세트], [특가] 등)를 제거하고 실제 상품명만 추출
 */
function extractProductSearchKeyword(productName: string): string {
  // 대괄호로 시작하는 접두사 제거 (예: [선물세트] 서리재 방앗간 참기름 -> 서리재 방앗간 참기름)
  let cleaned = productName.replace(/^\[.*?\]\s*/g, '');

  // 괄호 제거
  cleaned = cleaned.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * 재료명과 상품명의 매칭 점수를 계산하는 함수
 * 점수가 높을수록 더 정확한 매칭
 */
function calculateMatchScore(ingredientName: string, productName: string): number {
  const ingredient = ingredientName.toLowerCase().trim();
  const product = productName.toLowerCase().trim();

  let score = 0;

  // 1. 정확한 단어 매칭 (가장 높은 점수)
  if (product === ingredient) {
    score += 100;
  }

  // 2. 재료명이 상품명의 시작 부분에 정확히 포함 (높은 점수)
  if (product.startsWith(ingredient + ' ') || product.startsWith(ingredient)) {
    score += 80;
  }

  // 3. 재료명이 상품명에 단어 경계로 포함 (중간 점수)
  const ingredientWords = ingredient.split(' ');
  const productWords = product.split(' ');

  for (const ingWord of ingredientWords) {
    if (productWords.includes(ingWord)) {
      score += 30;
    }
  }

  // 4. 재료명이 상품명에 부분 문자열로 포함 (낮은 점수)
  if (product.includes(ingredient)) {
    score += 20;
  }

  // 5. 정확하지 않은 매칭 패널티
  // 예: "소금"을 검색했는데 "소금빵", "소금과자" 등이 나오면 감점
  if (ingredient.length >= 2) {
    const unwantedSuffixes = ['빵', '과자', '쿠키', '케이크', '사탕', '젤리', '음료', '주스'];
    for (const suffix of unwantedSuffixes) {
      if (product.includes(ingredient + suffix)) {
        score -= 50;
      }
    }
  }

  return score;
}

export async function searchKurly(ingredientName: string): Promise<ProductInfo[]> {
  const sanitizedQuery = extractCoreIngredient(ingredientName);
  const browser = await chromium.launch({ headless: true });

  // 컬리는 쿠키나 특정 헤더가 필요할 수 있음
  const context = await browser.newContext({
    extraHTTPHeaders: {
      ...COMMON_HEADERS,
      'Referer': 'https://www.kurly.com/',
    }
  });
  const page = await context.newPage();

  try {
    console.log(`[Kurly] Searching for "${sanitizedQuery}"`);
    await page.goto(`https://www.kurly.com/search?sword=${encodeURIComponent(sanitizedQuery)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    const products: ProductInfo[] = [];

    try {
      // 1. 상품 컨테이너 대기
      await page.waitForSelector('[data-testid="product-item"], [class*="ProductItem"]', { timeout: 10000 }).catch(() => {
        console.warn('[Kurly] Product selector timeout');
      });

      // 2. 모든 상품 리스트 아이템 추출
      const productElements = page.locator('a:has(img), [data-testid="product-item"], [class*="ProductItem"]');
      const count = await productElements.count();
      console.log(`[Kurly] Found ${count} potential product elements`);

      for (let i = 0; i < Math.min(count, 30); i++) {
        const element = productElements.nth(i);

        // 텍스트 내용 전체를 가져와서 분석
        const allText = await element.innerText().catch(() => '');
        const lines = allText.split('\n').map(s => s.trim()).filter(s => s.length > 0);

        // 컬리 특성상 이름이 보통 상단이나 이미지 근처에 있음
        const name = lines.find(l => l.length > 5 && !l.includes('%') && !l.includes('원') && !l.includes('배송')) || '';
        const priceLine = lines.find(l => l.includes('원') && /\d/.test(l));

        // 가격 추출 고도화: '8,100원 9,000원' 처럼 여러 가격이 있을 경우 첫 번째(할인가)를 취함
        let price = 0;
        if (priceLine) {
          const priceMatches = priceLine.match(/\d[0-9,.]*/g);
          if (priceMatches && priceMatches.length > 0) {
            price = parseInt(priceMatches[0].replace(/[^0-9]/g, '')) || 0;
          }
        }

        const link = (await element.getAttribute('href').catch(() => '')) || '';
        const imgElement = element.locator('img').first();
        const imageUrl = (await imgElement.getAttribute('src').catch(() => undefined)) || undefined;

        if (name && price > 500) { // 너무 저렴한건 배송비나 다른 정보일 수 있음
          // 매칭 점수 계산
          const matchScore = calculateMatchScore(sanitizedQuery, name);

          products.push({
            name: name,
            price,
            url: link && link.startsWith('http') ? link : `https://www.kurly.com${link}`,
            platform: 'kurly',
            imageUrl,
            matchScore, // 매칭 점수 추가
          } as any);
        }
      }

      // 매칭 점수가 높은 순으로 정렬
      products.sort((a: any, b: any) => (b.matchScore || 0) - (a.matchScore || 0));
    } catch (e) {
      console.error('[Kurly] Extraction error:', e);
    }

    return products;
  } finally {
    await browser.close();
  }
}

export async function searchAllPlatforms(ingredientName: string): Promise<ProductInfo[]> {
  const [baeminProducts, coupangProducts, kurlyProducts] = await Promise.all([
    searchBaemin(ingredientName),
    searchCoupang(ingredientName),
    searchKurly(ingredientName),
  ]);

  return [...baeminProducts, ...coupangProducts, ...kurlyProducts];
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * 컬리에 로그인하고 재료들을 장바구니에 담는 함수
 * 브라우저를 닫지 않고 열어둡니다.
 * @param ingredients 장바구니에 담을 재료 이름 배열
 */
export async function addToKurlyCartWithLogin(ingredients: string[]): Promise<{
  success: boolean;
  message: string;
  addedItems: string[];
}> {
  console.log('[Kurly Cart] Starting browser...');
  const browser = await chromium.launch({
    headless: false,  // 브라우저를 보이게 함
    slowMo: 100  // 동작을 조금 느리게 하여 관찰 가능하게 함
  });

  const context = await browser.newContext({
    extraHTTPHeaders: {
      ...COMMON_HEADERS,
      'Referer': 'https://www.kurly.com/',
    }
  });

  const page = await context.newPage();
  const addedItems: string[] = [];

  try {
    // 1. 컬리 로그인 페이지로 이동
    console.log('[Kurly Cart] Navigating to login page...');
    await page.goto('https://www.kurly.com/member/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('[Kurly Cart] Please login manually. Waiting for login completion...');

    // 2. 로그인 완료 대기 (메인 페이지로 리다이렉트되거나 특정 요소가 나타날 때까지)
    // 컬리는 로그인 후 보통 메인 페이지나 이전 페이지로 이동합니다.
    // URL이 변경되거나, 로그인 후에만 보이는 요소(예: 마이페이지 버튼)가 나타나는지 확인
    try {
      await page.waitForFunction(
        () => {
          // 로그인 페이지가 아닌 경우 (로그인 성공)
          const isNotLoginPage = !window.location.href.includes('/member/login');
          // 또는 로그인 후 나타나는 요소 확인
          const hasUserMenu = document.querySelector('[class*="user"], [data-testid="user-menu"], .my-page') !== null;
          return isNotLoginPage || hasUserMenu;
        },
        { timeout: 300000 } // 5분 대기 (사용자가 로그인할 시간)
      );
      console.log('[Kurly Cart] Login detected! Proceeding...');
    } catch (e) {
      console.error('[Kurly Cart] Login timeout or failed');
      return {
        success: false,
        message: '로그인 시간 초과 또는 실패',
        addedItems: []
      };
    }

    // 3. 각 재료를 검색하고 장바구니에 담기
    for (const ingredient of ingredients) {
      try {
        console.log(`[Kurly Cart] Searching for: ${ingredient}`);
        const sanitizedQuery = extractCoreIngredient(ingredient);

        // 검색 페이지로 이동
        await page.goto(`https://www.kurly.com/search?sword=${encodeURIComponent(sanitizedQuery)}`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });

        // 상품 목록 대기
        await page.waitForSelector('[data-testid="product-item"], [class*="ProductItem"], a:has(img)', { timeout: 10000 });

        // 모든 상품 정보를 가져와서 매칭 점수 계산
        const productElements = page.locator('[data-testid="product-item"], [class*="ProductItem"], a:has(img)');
        const count = await productElements.count();

        let bestProduct = null;
        let bestScore = -1;
        let bestIndex = -1;

        console.log(`[Kurly Cart] Found ${count} products, calculating best match...`);

        for (let i = 0; i < Math.min(count, 10); i++) {
          const element = productElements.nth(i);
          const productText = await element.innerText().catch(() => '');
          const productName = productText.split('\n')[0] || '';

          if (productName) {
            const score = calculateMatchScore(sanitizedQuery, productName);
            console.log(`[Kurly Cart] Product ${i}: "${productName}" - Score: ${score}`);

            if (score > bestScore) {
              bestScore = score;
              bestProduct = productName;
              bestIndex = i;
            }
          }
        }

        if (bestIndex >= 0 && bestScore > 0) {
          console.log(`[Kurly Cart] Best match: "${bestProduct}" (index: ${bestIndex}, score: ${bestScore})`);

          // 가장 잘 매칭되는 상품 클릭
          const bestProductElement = productElements.nth(bestIndex);
          await bestProductElement.click();
        } else {
          console.log(`[Kurly Cart] No good match found, using first product`);
          await productElements.first().click();
        }

        // 상품 상세 페이지 로딩 대기
        await page.waitForTimeout(2000);

        // 장바구니 담기 버튼 찾기 및 클릭
        const addToCartButton = page.locator('button:has-text("장바구니"), button:has-text("담기"), [class*="cart"], [data-testid="cart-button"]').first();

        if (await addToCartButton.isVisible({ timeout: 5000 })) {
          await addToCartButton.click();
          console.log(`[Kurly Cart] Added to cart: ${ingredient}`);
          addedItems.push(ingredient);

          // 장바구니 담기 완료 대기
          await page.waitForTimeout(1500);

          // 팝업이 나타나면 닫기 (선택사항 계속 쇼핑 등)
          const continueButton = page.locator('button:has-text("계속 쇼핑"), button:has-text("닫기"), button:has-text("확인")').first();
          if (await continueButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await continueButton.click();
            await page.waitForTimeout(500);
          }
        } else {
          console.log(`[Kurly Cart] Cart button not found for: ${ingredient}`);
        }
      } catch (e) {
        console.error(`[Kurly Cart] Error adding ${ingredient}:`, e);
      }
    }

    // 4. 장바구니 페이지로 이동하여 확인
    console.log('[Kurly Cart] Navigating to cart page...');
    await page.goto('https://www.kurly.com/cart', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    console.log('[Kurly Cart] Browser will remain open. Please check your cart!');
    console.log('[Kurly Cart] Added items:', addedItems);

    // 브라우저를 닫지 않음!
    // await browser.close(); // 이 줄을 제거하여 브라우저가 열려있도록 함

    return {
      success: true,
      message: `${addedItems.length}개의 재료를 장바구니에 담았습니다. 브라우저는 계속 열려있습니다.`,
      addedItems
    };

  } catch (error) {
    console.error('[Kurly Cart] Error:', error);
    // 에러 발생 시에도 브라우저를 닫지 않음
    return {
      success: false,
      message: `에러 발생: ${error}`,
      addedItems
    };
  }
}

export async function getYoutubeVideoInfo(url: string): Promise<YoutubeVideoInfo | null> {
  const videoId = extractVideoId(url);
  if (!videoId) return null;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`https://www.youtube.com/watch?v=${videoId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const title = await page.locator('h1.ytd-video-primary-info-renderer yt-formatted-string, h1.title ytd-video-primary-info-renderer yt-formatted-string, h1.title yt-formatted-string, h1.ytd-watch-metadata yt-formatted-string')
      .first()
      .textContent()
      .catch(() => '');

    const description = await page.locator('#description-inline-expander yt-formatted-string, #description yt-formatted-string, ytd-video-secondary-info-renderer yt-formatted-string#description-text, #description-text yt-formatted-string')
      .first()
      .textContent()
      .catch(() => '');

    let captions = '';
    try {
      // 자막 버튼 클릭 시도 (설정에 따라 이미 켜져 있을 수도 있음)
      const subtitleButton = page.locator('button[title*="Captions"], button[aria-label*="subtitle" i], button[aria-label*="자막" i], .ytp-subtitles-button').first();
      if (await subtitleButton.isVisible().catch(() => false)) {
        const isPressed = await subtitleButton.getAttribute('aria-pressed');
        if (isPressed !== 'true') {
          await subtitleButton.click();
          await page.waitForTimeout(1000);
        }
      }

      // 스크립트 더보기 버튼이 있다면 자막 텍스트를 더 많이 가져오기 위해 시도
      captions = await page.evaluate(() => {
        const segments = document.querySelectorAll('.ytp-caption-segment, #shorts-container .ytp-caption-segment');
        return Array.from(segments).map(el => el.textContent).join(' ');
      });

      // 만약 Playwright로 자막 추출이 잘 안된다면 설명(description)이라도 최대한 활용하도록 fallback
      if (!captions && description) {
        captions = description.substring(0, 1000); // 간단한 대체
      }
    } catch (e) {
      console.log('Captions extraction failed:', e);
    }

    return {
      videoId,
      title: title || '',
      description: description || '',
      captions: captions || '',
    };
  } catch (error) {
    console.error('Error fetching YouTube video:', error);
    return null;
  } finally {
    await browser.close();
  }
}
