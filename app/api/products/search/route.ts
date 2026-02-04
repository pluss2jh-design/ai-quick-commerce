import { NextRequest, NextResponse } from 'next/server';
import { searchAllPlatforms, ProductInfo } from '@/packages/scraper/src/index';

export async function POST(request: NextRequest) {
  try {
    const { ingredient } = await request.json();

    if (!ingredient || typeof ingredient !== 'string') {
      return NextResponse.json(
        { error: 'ingredient is required and must be a string' },
        { status: 400 }
      );
    }

    console.log(`Searching products for: ${ingredient}`);
    
    const products = await searchAllPlatforms(ingredient);
    
    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No products found' },
        { status: 404 }
      );
    }

    const sortedProducts = products.sort((a, b) => a.price - b.price);

    const groupedByPlatform = {
      baemin: sortedProducts.filter(p => p.platform === 'baemin'),
      coupang: sortedProducts.filter(p => p.platform === 'coupang'),
      kurly: sortedProducts.filter(p => p.platform === 'kurly'),
    };

    return NextResponse.json({
      success: true,
      data: {
        ingredient,
        totalCount: products.length,
        lowestPrice: sortedProducts[0],
        allProducts: sortedProducts,
        byPlatform: groupedByPlatform,
      }
    });
  } catch (error) {
    console.error('Product search error:', error);
    return NextResponse.json(
      { error: 'Failed to search products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
