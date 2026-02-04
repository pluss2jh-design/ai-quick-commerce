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

export function findBestMatchByWeight(
  products: ProductInfo[],
  targetWeight: number,
  targetUnit: string,
  filter: 'price' | 'calorie'
): ProductInfo | null {
  const unitNormalizedTarget = targetUnit === 'kg' || targetUnit === 'L' || targetUnit === 'l'
    ? targetWeight * 1000
    : targetWeight;

  const productsWithWeight = products.map(p => {
    const weightInfo = extractWeightFromName(p.name);
    return {
      ...p,
      parsedWeight: weightInfo?.weight || 0,
      parsedUnit: weightInfo?.unit || 'ea',
    };
  });

  // 1. 유효한 무게 정보가 있는 상품만 필터링
  const validProducts = productsWithWeight.filter(p => p.parsedWeight > 0);
  if (validProducts.length === 0) return products[0] || null;

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
      // 1순위: 가격 (오름차순)
      if (a.price !== b.price) return a.price - b.price;
      // 2순위: 무게 차이 (오름차순) - 가격이 같다면 용량이 더 적절한 것 선택
      return Math.abs(a.parsedWeight - unitNormalizedTarget) - Math.abs(b.parsedWeight - unitNormalizedTarget);
    });
  } else if (filter === 'calorie') {
    candidates.sort((a, b) => {
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

export async function searchKurly(ingredientName: string): Promise<ProductInfo[]> {
  const sanitizedQuery = ingredientName.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
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
          products.push({
            name: name,
            price,
            url: link && link.startsWith('http') ? link : `https://www.kurly.com${link}`,
            platform: 'kurly',
            imageUrl,
          });
        }
      }
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
