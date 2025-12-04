import { type NextRequest, NextResponse } from "next/server"
import { callGeminiApi } from "@/shared/lib/api/client"
import { handleApiError } from "@/shared/lib/api/error-handler"

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "텍스트가 필요합니다." }, { status: 400 })
    }

    const prompt = `다음 텍스트에서 특허 명세서 작성에 필요한 정보를 추출해주세요.

텍스트: ${text}

다음 형식의 JSON으로만 응답해주세요:
{
  "keywords": ["키워드1", "키워드2", ...],  // 7-20개의 핵심 기술 키워드
  "technicalField": ["분야1", "분야2", "분야3"],  // 3-5개의 기술 분야 (예: "IoT", "농업", "자동화")
  "problems": ["문제1", "문제2", "문제3"],  // 3-5개의 해결하려는 문제점들
  "features": ["기능1", "기능2", ...],  // 3-7개의 핵심 기능/특징
}

JSON 형식으로만 응답하고, 다른 설명은 포함하지 마세요.`

    const generatedText = await callGeminiApi({
      prompt,
      temperature: 0.3,
      maxOutputTokens: 8192,
    })

    if (!generatedText) {
      return NextResponse.json({ error: "키워드 추출 결과가 없습니다." }, { status: 500 })
    }

    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in response")
      }

      const extractedData = JSON.parse(jsonMatch[0])

      return NextResponse.json({
        keywords: extractedData.keywords || [],
        technicalField: extractedData.technicalField || [],
        problems: extractedData.problems || [],
        features: extractedData.features || [],
      })
    } catch (parseError) {
      console.error("[v0] Failed to parse structured data:", parseError)
      const keywordsMatch = generatedText.match(/\[(.*?)\]/s)
      if (keywordsMatch) {
        const keywordsStr = keywordsMatch[1]
        const keywords = keywordsStr.split(",").map((k) => k.trim().replace(/"/g, ""))
        return NextResponse.json({
          keywords,
          technicalField: [],
          problems: [],
          features: [],
        })
      }
      return NextResponse.json({ error: "데이터 파싱에 실패했습니다." }, { status: 500 })
    }
  } catch (error) {
    return handleApiError(error);
  }
}
