import { type NextRequest, NextResponse } from "next/server";
import { callGeminiApi } from "@/shared/lib/api/client";
import { handleApiError } from "@/shared/lib/api/error-handler";

export async function POST(request: NextRequest) {
  try {
    const { keywords } = await request.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: "키워드가 필요합니다." }, { status: 400 });
    }

    const keywordsText = keywords.join(", ");

    const prompt = `다음 키워드와 관련된 유사 특허 10건을 생성해주세요: ${keywordsText}

각 특허는 다음 정보를 포함해야 합니다:
- 특허번호 (예: KR10-2023-0123456)
- 특허명 (구체적이고 기술적인 명칭)
- 출원인 (실제 회사명 또는 기관명)
- 출원일 (YYYY-MM-DD 형식)
- 요약 (2-3문장으로 핵심 기술 설명)

다음 JSON 형식으로만 응답해주세요:
{
  "patents": [
    {
      "patentNumber": "특허번호",
      "title": "특허명",
      "applicant": "출원인",
      "applicationDate": "출원일",
      "summary": "요약"
    }
  ]
}

JSON 형식으로만 응답하고, 다른 설명은 포함하지 마세요.`;

    const generatedText = await callGeminiApi({
      prompt,
      temperature: 0.7,
      maxOutputTokens: 8192,
    });

    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const patentData = JSON.parse(jsonMatch[0]);

      return NextResponse.json({
        patents: patentData.patents || [],
      });
    } catch (parseError) {
      console.error("[v0] Failed to parse patent data:", parseError);
      return NextResponse.json({ error: "데이터 파싱에 실패했습니다." }, { status: 500 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

