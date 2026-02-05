
import { NextRequest, NextResponse } from 'next/server';
import { searchAllPlatforms, findBestMatchByWeight } from '@/packages/scraper/src/index';

export async function POST(request: NextRequest) {
    try {
        const { ingredient, amount, unit, filter = 'price' } = await request.json();

        if (!ingredient) {
            return NextResponse.json({ error: 'ingredient is required' }, { status: 400 });
        }

        const searchQuery = filter === 'calorie' ? `${ingredient} 저칼로리` : ingredient;
        console.log(`[SmartMatch] Searching for: ${searchQuery} ${amount}${unit}`);

        const products = await searchAllPlatforms(searchQuery);

        const matchedProduct = findBestMatchByWeight(
            products,
            amount,
            unit,
            filter,
            ingredient  // 재료명 전달하여 매칭 점수 계산
        );

        if (matchedProduct) {
            console.log(`[SmartMatch] Best Match: ${matchedProduct.name} on ${matchedProduct.platform}`);
        } else {
            console.log(`[SmartMatch] No match found for ${ingredient}`);
        }

        return NextResponse.json({
            success: true,
            data: {
                matchedProduct,
                platformResultsCount: products.length
            }
        });
    } catch (error) {
        console.error('Smart match error:', error);
        return NextResponse.json(
            { error: 'Failed to find smart match' },
            { status: 500 }
        );
    }
}
