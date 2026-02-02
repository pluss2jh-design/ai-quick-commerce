import { chromium, Browser, Page } from 'playwright';

export interface ProductInfo {
  name: string;
  price: number;
  url: string;
  platform: string;
  calories?: number;
  imageUrl?: string;
}

export async function searchBaemin(ingredientName: string): Promise<ProductInfo[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(`https://baemin.com/search?q=${encodeURIComponent(ingredientName)}`);
    await page.waitForTimeout(2000);
    
    const products: ProductInfo[] = [];
    
    return products;
  } finally {
    await browser.close();
  }
}

export async function searchCoupang(ingredientName: string): Promise<ProductInfo[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(`https://www.coupang.com/np/search?q=${encodeURIComponent(ingredientName)}`);
    await page.waitForTimeout(2000);
    
    const products: ProductInfo[] = [];
    
    return products;
  } finally {
    await browser.close();
  }
}

export async function searchKurly(ingredientName: string): Promise<ProductInfo[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(`https://www.kurly.com/search?sword=${encodeURIComponent(ingredientName)}`);
    await page.waitForTimeout(2000);
    
    const products: ProductInfo[] = [];
    
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
