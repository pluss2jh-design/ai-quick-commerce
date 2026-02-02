import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ExtractedIngredient {
  name: string;
  amount: string;
  unit: string;
}

export interface RecipeExtractionResult {
  title: string;
  ingredients: ExtractedIngredient[];
}

export async function extractIngredientsFromText(
  text: string
): Promise<RecipeExtractionResult> {
  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `다음 레시피 텍스트에서 식재료 목록을 추출해주세요. JSON 형식으로 응답해주세요.

레시피 텍스트:
${text}

응답 형식:
{
  "title": "레시피 제목",
  "ingredients": [
    {"name": "식재료명", "amount": "분량", "unit": "단위"}
  ]
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return JSON.parse(content.text);
  }

  throw new Error('Failed to extract ingredients');
}

export async function extractIngredientsFromDishName(
  dishName: string
): Promise<RecipeExtractionResult> {
  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `"${dishName}" 요리를 만들기 위한 기본 식재료 목록을 추출해주세요. JSON 형식으로 응답해주세요.

응답 형식:
{
  "title": "${dishName}",
  "ingredients": [
    {"name": "식재료명", "amount": "분량", "unit": "단위"}
  ]
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return JSON.parse(content.text);
  }

  throw new Error('Failed to extract ingredients');
}
