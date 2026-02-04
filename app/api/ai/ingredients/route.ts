import { NextRequest, NextResponse } from 'next/server';
import { getYoutubeVideoInfo } from '@/packages/scraper/src/index';
import {
  extractIngredientsFromDishName,
  extractIngredientsFromText,
  extractFoodAndIngredientsFromYoutube
} from '@/packages/ai/src/index';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: API key not set' },
        { status: 500 }
      );
    }

    const { inputType, value } = await request.json();

    if (!inputType || !value) {
      return NextResponse.json(
        { error: 'inputType and value are required' },
        { status: 400 }
      );
    }

    let result;
    let detectedFood = null;

    if (inputType === 'food') {
      result = await extractIngredientsFromDishName(value);
    } else if (inputType === 'youtube') {
      const videoInfo = await getYoutubeVideoInfo(value);

      if (!videoInfo) {
        return NextResponse.json(
          { error: 'Failed to fetch YouTube video information' },
          { status: 400 }
        );
      }

      const youtubeResult = await extractFoodAndIngredientsFromYoutube(videoInfo);
      result = {
        title: youtubeResult.title,
        ingredients: youtubeResult.ingredients,
      };
      detectedFood = youtubeResult.detectedFood;
    } else {
      return NextResponse.json(
        { error: 'Invalid inputType. Must be "food" or "youtube"' },
        { status: 400 }
      );
    }

    console.log('Extraction successful:', result);
    return NextResponse.json({
      success: true,
      data: {
        title: result.title,
        detectedFood,
        ingredients: result.ingredients.map(ingredient => ({
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit
        }))
      }
    });
  } catch (error) {
    console.error('API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Failed to extract ingredients', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
