import { NextRequest, NextResponse } from 'next/server';
import { addToKurlyCartWithLogin, ProductInfo } from '../../../../packages/scraper/src/index';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { products } = body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return NextResponse.json(
                { error: '상품 목록이 필요합니다.' },
                { status: 400 }
            );
        }

        console.log('[API] Starting Kurly cart operation with products:', products.map((p: ProductInfo) => p.name));

        // 컬리 로그인 및 장바구니 담기 실행 (상품 정보 전달)
        const result = await addToKurlyCartWithLogin(products);

        return NextResponse.json(result);
    } catch (error) {
        console.error('[API] Error in Kurly cart operation:', error);
        return NextResponse.json(
            {
                success: false,
                message: `서버 에러: ${error}`,
                addedItems: []
            },
            { status: 500 }
        );
    }
}
