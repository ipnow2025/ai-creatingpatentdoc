import { type NextRequest, NextResponse } from "next/server";
import { callAIApi } from "@/shared/lib/api/client";
import { handleApiError } from "@/shared/lib/api/error-handler";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const {
      keywords,
      inventionTitle,
      inventor,
      applicant,
      mode,
      description,
      originalContent,
      feedbackComments,
      isRevision,
      structuredData,
      referencePatents,
    } = await request.json();

    const inputText = description || keywords;

    if (!inputText) {
      return NextResponse.json({ error: "키워드 또는 설명이 필요합니다." }, { status: 400 });
    }

    const finalTitle = inventionTitle?.trim() || `${inputText.split(",")[0] || inputText.substring(0, 30)} 기반 시스템`;
    const finalInventor = inventor?.trim() || "";
    const finalApplicant = applicant?.trim() || "";

    let prompt = "";

    if (isRevision && originalContent && feedbackComments) {
      prompt = `다음 특허 명세서를 피드백에 따라 개선해주세요:

=== 기존 명세서 ===
${originalContent}

=== 피드백 ===
${feedbackComments}

위 피드백을 반영하여 한국 특허청 형식에 맞게 개선된 특허 명세서를 작성하세요.
다음 구조를 따르되, 단락 번호나 도면 관련 내용은 제외하세요:

# 발명의 명칭
# 요약
# 청구범위
# 발명의 설명
## 기술분야
## 배경기술
## 발명의 내용
### 해결하려는 과제
### 과제의 해결 수단
### 발명의 효과
## 발명을 실시하기 위한 구체적인 내용`;
    } else if (structuredData && mode === "memo") {
      let referenceInfo = "";
      if (referencePatents && referencePatents.length > 0) {
        referenceInfo = `\n\n참고 특허:\n${referencePatents.map((p: any) => `- ${p.patentNumber}: ${p.title}\n  요약: ${p.summary || "N/A"}`).join("\n")}`;
      }

      let coverInfo = `**발명의 명칭:** ${finalTitle}\n\n`;
      if (finalInventor) {
        coverInfo += `**발명자:** ${finalInventor}\n\n`;
      }
      if (finalApplicant) {
        coverInfo += `**출원인:** ${finalApplicant}\n\n`;
      }

      prompt = `한국 특허청 형식의 완전한 특허 명세서를 작성하세요.

**발명 정보**
- 발명의 명칭: ${finalTitle}
${finalInventor ? `- 발명자: ${finalInventor}` : ""}
${finalApplicant ? `- 출원인: ${finalApplicant}` : ""}
- 키워드: ${inputText}
- 기술분야: ${structuredData.technicalField?.join(", ") || "N/A"}
- 해결할 문제점: ${structuredData.problems?.join(", ") || "N/A"}
- 핵심 기능: ${structuredData.features?.join(", ") || "N/A"}${referenceInfo}

**작성 지침**

다음 구조로 완전한 특허 명세서를 작성하세요. 단락 번호([0001] 등)와 도면 관련 내용은 제외합니다.
**중요: 각 섹션을 반드시 완결된 문장으로 마무리하고, 문장이 중간에 끊기지 않도록 하세요.**

# 표지 정보

${coverInfo}

# 요약
발명의 핵심 내용을 500-700자로 요약하세요. 기술분야, 해결하려는 과제, 해결 수단, 효과를 포함하여 자연스러운 문장으로 작성하세요.

# 청구범위

**총 3-5개 청구항 작성 (독립항 1-2개, 종속항 2-3개)**

청구항 1
[독립항] 발명의 핵심 구성요소를 포함한 완전한 청구항을 작성하세요. "~를 포함하는 시스템" 또는 "~하는 방법" 형식으로 작성하세요.

청구항 2
[종속항] 청구항 1에 있어서, 가장 중요한 추가 특징을 기재하세요.

청구항 3
[종속항] 청구항 1 또는 2에 있어서, 또 다른 핵심 특징을 기재하세요.

청구항 4 (선택)
[독립항 또는 종속항] 발명의 다른 측면이나 추가 특징을 기재하세요.

청구항 5 (선택)
[종속항] 청구항 1 내지 4 중 어느 한 항에 있어서, 구체적인 실시 형태를 기재하세요.

# 발명의 설명

## 기술분야

본 발명은 ${structuredData.technicalField?.join(", ") || "관련 기술"}에 관한 것으로, 더욱 상세하게는 [구체적인 기술 내용]에 관한 것이다.

(2개 문단으로 기술분야를 설명하세요. 발명이 속하는 기술 분야와 그 중요성을 설명하세요.)

## 배경기술

종래의 기술에서는 [기존 기술의 내용]이 사용되어 왔다. 그러나 이러한 종래 기술은 다음과 같은 문제점을 가지고 있었다.

첫째, ${structuredData.problems?.[0] || "[문제점 1]"}

둘째, [문제점 2에 대한 설명]

따라서, 이러한 문제점들을 해결할 수 있는 새로운 기술의 개발이 요구되고 있는 실정이다.

(3개 문단으로 배경기술과 문제점을 설명하세요.)

## 발명의 내용

### 해결하려는 과제

본 발명은 상기와 같은 종래 기술의 문제점을 해결하기 위하여 안출된 것으로, 그 목적은 [주요 목적]을 제공하는 것이다.

본 발명의 다른 목적은 [부가적인 목적]을 제공하는 것이다.

(2개 문단으로 해결하려는 과제를 명확히 제시하세요.)

### 과제의 해결 수단

상기 목적을 달성하기 위한 본 발명의 일 실시예에 따른 ${finalTitle}은(는) [핵심 구성요소 1]; [핵심 구성요소 2]; 및 [핵심 구성요소 3]을 포함한다.

상기 [구성요소 1]은(는) [구체적인 기능과 작동 방식]을 수행한다.

상기 [구성요소 2]는 [구체적인 기능]을 수행하며, [작동 원리]를 특징으로 한다.

상기 [구성요소 3]은 [구체적인 기능]을 수행하며, 이를 통해 [달성되는 효과]를 제공한다.

**이 섹션을 반드시 완결된 문장으로 마무리하세요.**

(3-4개 문단으로 발명의 구성과 작동 원리를 설명하세요.)

### 발명의 효과

본 발명에 따르면, [주요 효과 1]을 달성할 수 있다.

또한, 본 발명은 [효과 2]를 제공함으로써, [실용적인 이점]을 가져온다.

더 나아가, 본 발명은 [효과 3]을 통해 [산업적 가치]를 제공한다.

(3개 문단으로 발명의 효과를 설명하세요.)

## 발명을 실시하기 위한 구체적인 내용

이하, 본 발명의 바람직한 실시예를 상세히 설명한다.

**[실시예 1]**

본 발명의 제1 실시예에 따른 ${finalTitle}은(는) [구체적인 구성]을 포함한다. 

[실시예 1의 상세한 설명 - 구성요소, 작동 방식, 구체적인 조건이나 수치 포함]

[실시예 1의 효과 및 특징]

**[실시예 2]**

본 발명의 제2 실시예는 제1 실시예와 유사하나, [차이점]을 특징으로 한다.

[실시예 2의 상세한 설명]

[실시예 2의 효과 및 특징]

**[산업상 이용가능성]**

본 발명은 [산업 분야]에 광범위하게 적용될 수 있다. 특히, [구체적인 응용 분야]에서 유용하게 활용될 수 있다.

또한, 본 발명은 [미래 발전 가능성]을 가지고 있어, [장기적인 산업적 가치]를 제공할 수 있다.

**이 섹션을 반드시 완결된 문장으로 마무리하세요.**

(실시예 2개를 각각 3개 문단으로 작성하고, 산업상 이용가능성을 2개 문단으로 작성하세요.)

**작성 시 주의사항:**
- 모든 섹션을 완결된 문장으로 마무리하세요
- 문장이 중간에 끊기지 않도록 주의하세요
- 자연스러운 문장으로 작성하세요
- 특허 전문 용어를 적절히 사용하세요
- 청구항은 완전한 문장으로 작성하세요`;
    } else {
      let coverInfo = `**발명의 명칭:** ${finalTitle}\n\n`;
      if (finalInventor) {
        coverInfo += `**발명자:** ${finalInventor}\n\n`;
      }
      if (finalApplicant) {
        coverInfo += `**출원인:** ${finalApplicant}\n\n`;
      }

      prompt = `한국 특허청 형식의 완전한 특허 명세서를 작성하세요.

**발명 정보**
- 발명의 명칭: ${finalTitle}
${finalInventor ? `- 발명자: ${finalInventor}` : ""}
${finalApplicant ? `- 출원인: ${finalApplicant}` : ""}
- 키워드: ${inputText}

**작성 지침**

다음 구조로 완전한 특허 명세서를 작성하세요. 단락 번호([0001] 등)와 도면 관련 내용은 제외합니다.

# 표지 정보

${coverInfo}

# 요약
발명의 핵심 내용을 500-700자로 요약하세요.

# 청구범위
청구항 1-12 (독립항 2개, 종속항 10개)를 완전한 문장으로 작성하세요.

# 발명의 설명

## 기술분야
2-3개 문단

## 배경기술
4개 문단 (종래 기술과 문제점)

## 발명의 내용

### 해결하려는 과제
3개 문단

### 과제의 해결 수단
5개 문단 (구성과 작동 원리)

### 발명의 효과
4개 문단

## 발명을 실시하기 위한 구체적인 내용
실시예 4개 (각 3개 문단) + 산업상 이용가능성 (2개 문단)

모든 내용을 자연스러운 문장으로 작성하고, 특허 전문 용어를 사용하세요.`;
    }

    const responseText = await callAIApi({
      prompt,
      temperature: 0.9,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    });

    // Handle timeout and HTML errors
    if (responseText.includes("FUNCTION_INVOCATION_TIMEOUT") || responseText.includes("An error occurred")) {
      return NextResponse.json(
        {
          error: "특허 명세서 생성 시간이 초과되었습니다. 내용을 간략히 하거나 잠시 후 다시 시도해주세요.",
          errorType: "timeout",
        },
        { status: 504 }
      );
    }

    if (responseText.trim().startsWith("<") || responseText.trim().startsWith("<!")) {
      return NextResponse.json(
        {
          error: "서버에서 예상치 못한 응답을 받았습니다. 잠시 후 다시 시도해주세요.",
          errorType: "invalid_response",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ result: responseText });
  } catch (error) {
    console.error("[v0] Error generating patent:", error);
    return handleApiError(error);
  }
}

