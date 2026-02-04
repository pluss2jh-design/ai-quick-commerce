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

function safeJsonParse(text: string): any {
  try {
    // 1. Try direct parse
    return JSON.parse(text);
  } catch (e) {
    // 2. Try extracting from markdown code blocks
    const match = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/```\n?([\s\S]*?)\n?```/);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch (e2) {
        // Fallback to searching for the first { and last }
      }
    }

    // 3. Last resort: find anything between the first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } catch (e3) {
        throw new Error(`Failed to parse AI response as JSON: ${text}`);
      }
    }

    throw new Error(`Invalid JSON response from AI: ${text}`);
  }
}

export async function extractIngredientsFromText(
  text: string
): Promise<RecipeExtractionResult> {
  const message = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `다음 레시피 텍스트에서 식재료 목록을 추출해주세요. 1인 기준 분량으로 계산해주세요. JSON 형식으로 응답해주세요.

레시피 텍스트:
${text}

요구사항:
- 모든 재료는 1인분 기준으로 분량을 계산해주세요
- 예: 4인분 레시피라면 모든 분량을 4로 나눈 값을 사용
- amount는 숫자(정수 또는 소수)만 문자열로 표시 (예: "1", "0.5", "200")
- 분수(1/2 등)는 절대 사용하지 말고 소수(0.5)로 변환해서 표시
- 용량 단위는 g, ml, kg 등으로 통일해주세요

응답 형식:
{
  "title": "레시피 제목",
  "ingredients": [
    {"name": "식재료명", "amount": "분량(숫자만)", "unit": "단위"}
  ]
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return safeJsonParse(content.text);
  }

  throw new Error('Failed to extract ingredients');
}

export async function extractIngredientsFromDishName(
  dishName: string
): Promise<RecipeExtractionResult> {
  const message = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `"${dishName}" 요리를 만들기 위한 기본 식재료 목록을 1인분 기준으로 추출해주세요. JSON 형식으로 응답해주세요.

요구사항:
- 모든 재료는 1인분 기준으로 분량을 계산해주세요
- amount는 숫자(정수 또는 소수)만 문자열로 표시 (예: "1", "0.5", "200")
- 분수(1/2 등)는 절대 사용하지 말고 소수(0.5)로 변환해서 표시
- 용량 단위는 g, ml, kg 등으로 통일해주세요

응답 형식:
{
  "title": "${dishName}",
  "ingredients": [
    {"name": "식재료명", "amount": "분량(숫자만)", "unit": "단위"}
  ]
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return safeJsonParse(content.text);
  }

  throw new Error('Failed to extract ingredients');
}
export async function extractFoodAndIngredientsFromYoutube(
  videoInfo: { title: string; description: string; captions: string }
): Promise<RecipeExtractionResult & { detectedFood: string }> {
  const combinedText = `
제목: ${videoInfo.title}
설명: ${videoInfo.description}
자막: ${videoInfo.captions}
  `.trim();

  const message = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `다음은 유튜브 요리/먹방 영상의 정보입니다. 이 영상에서 다루는 음식을 분석하고, 그 음식을 만들기 위한 재료 목록을 1인분 기준으로 추출해주세요. JSON 형식으로 응답해주세요.

${combinedText}

요구사항:
- detectedFood: 영상에서 주로 다루는 음식 이름
- 모든 재료는 1인분 기준으로 분량을 계산해주세요
- amount는 숫자(정수 또는 소수)만 문자열로 표시 (예: "1", "0.5", "200")
- 분수(1/2 등)는 절대 사용하지 말고 소수(0.5)로 변환해서 표시
- unit은 단위(개, g, ml, 큰술, 작은술 등)만 표시해주세요
- 용량 단위는 가능한 한 g, ml 등으로 표준화해주세요

응답 형식:
{
  "detectedFood": "음식 이름",
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
    const result = safeJsonParse(content.text);
    return {
      detectedFood: result.detectedFood || result.title,
      title: result.title,
      ingredients: result.ingredients,
    };
  }

  throw new Error('Failed to extract food and ingredients from YouTube');
}
