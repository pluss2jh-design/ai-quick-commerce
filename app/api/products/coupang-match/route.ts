import { NextRequest, NextResponse } from 'next/server';
import { searchCoupang, findBestMatchByWeight, extractWeightFromName } from '@/packages/scraper/src/index';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ingredient, amount, unit, filter } = body;

    if (!ingredient || !amount || !unit || !filter) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      );
    }

    const products = await searchCoupang(ingredient);

    const matchedProduct = findBestMatchByWeight(
      products,
      amount,
      unit,
      filter
    );

    if (matchedProduct) {
      console.log(`[SmartMatch] Matched: ${matchedProduct.name} (${matchedProduct.price}원)`);
      console.log(`[SmartMatch] URL: ${matchedProduct.url}`);
    } else {
      console.log(`[SmartMatch] No suitable match found for ${ingredient} ${amount}${unit}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        matchedProduct,
        allProducts: products,
      },
    });
  } catch (error) {
    console.error('Coupang match error:', error);
    return NextResponse.json(
      { error: '상품 매칭 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
