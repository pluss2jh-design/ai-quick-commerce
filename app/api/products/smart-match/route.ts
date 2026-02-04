
import { NextRequest, NextResponse } from 'next/server';
import { searchAllPlatforms, findBestMatchByWeight } from '@/packages/scraper/src/index';

export async function POST(request: NextRequest) {
    try {
        const { ingredient, amount, unit, filter = 'price' } = await request.json();

        if (!ingredient) {
            return NextResponse.json({ error: 'ingredient is required' }, { status: 400 });
        }

        console.log(`[SmartMatch] Searching for: ${ingredient} ${amount}${unit}`);

        const products = await searchAllPlatforms(ingredient);

        const matchedProduct = findBestMatchByWeight(
            products,
            amount,
            unit,
            filter
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
