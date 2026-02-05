import { NextRequest, NextResponse } from 'next/server';
import { addToKurlyCartWithLogin } from '../../../../packages/scraper/src/index';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { ingredients } = body;

        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            return NextResponse.json(
                { error: '재료 목록이 필요합니다.' },
                { status: 400 }
            );
        }

        console.log('[API] Starting Kurly cart operation with ingredients:', ingredients);

        // 컬리 로그인 및 장바구니 담기 실행
        const result = await addToKurlyCartWithLogin(ingredients);

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
