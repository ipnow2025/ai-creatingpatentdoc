import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/shared/lib/api/error-handler";
import { searchPatentsFromAPI } from "@/shared/lib/api/patent-search";

export async function POST(request: NextRequest) {
  try {
    const { keywords } = await request.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: "키워드가 필요합니다." }, { status: 400 });
    }

    // Biznavi API를 사용하여 특허 검색
    let patents: any[] = [];
    let source = "api";
    let usedKeywords = keywords;
    
    try {
      // 처음에는 모든 키워드로 검색
      patents = await searchPatentsFromAPI({ keywords, numOfRows: 10 });
      console.log("[patent-search] Search from Biznavi API returned:", patents.length, "results");
      
      // 검색 결과가 없고 키워드가 2개 이상이면, 키워드를 하나씩 줄여가며 재검색
      if (patents.length === 0 && keywords.length > 1) {
        console.log("[patent-search] No results found, trying with fewer keywords...");
        
        // 키워드를 하나씩 줄여가며 재검색 (마지막 키워드부터 제거)
        for (let i = keywords.length - 1; i >= 1; i--) {
          const reducedKeywords = keywords.slice(0, i);
          console.log(`[patent-search] Trying with ${reducedKeywords.length} keyword(s):`, reducedKeywords);
          
          try {
            const retryPatents = await searchPatentsFromAPI({ keywords: reducedKeywords, numOfRows: 10 });
            if (retryPatents.length > 0) {
              patents = retryPatents;
              usedKeywords = reducedKeywords;
              console.log(`[patent-search] Found ${patents.length} results with reduced keywords:`, reducedKeywords);
              break;
            }
          } catch (retryError) {
            console.warn(`[patent-search] Retry with ${reducedKeywords.length} keyword(s) failed:`, retryError);
            // 계속 다음 키워드 조합 시도
          }
        }
      }
      
      // 검색 결과의 첫 번째 항목 로그 (디버깅용)
      if (patents.length > 0) {
        console.log("[patent-search] First result sample:", {
          patentNumber: patents[0].patentNumber,
          title: patents[0].title?.substring(0, 50),
          applicant: patents[0].applicant,
          source: "api",
          usedKeywords: usedKeywords,
        });
      }
    } catch (error) {
      console.error("[patent-search] Error searching from Biznavi API:", error);
      if (error instanceof Error) {
        // API 토큰 관련 오류
        if (error.message.includes("토큰") || error.message.includes("token")) {
          return NextResponse.json(
            {
              error: "API 토큰이 설정되지 않았습니다. 환경변수 BIZNAVI_TOKEN (또는 BIZNAVI_X_TOKEN)과 BIZNAVI_GW_TOKEN을 설정해주세요.",
              errorType: "api_token_error",
              details: error.message,
              patents: [],
            },
            { status: 500 }
          );
        }
        
        return NextResponse.json(
          {
            error: "특허 검색 API 호출 중 오류가 발생했습니다.",
            errorType: "api_error",
            details: error.message,
            patents: [],
          },
          { status: 500 }
        );
      }
      patents = [];
    }

    // 검색 결과가 없으면 에러 반환
    if (patents.length === 0) {
      console.log("[patent-search] No matches found even after reducing keywords:", keywords);
      return NextResponse.json(
        { 
          error: `검색 결과가 없습니다. 키워드 "${keywords.join(", ")}"에 대한 유사 특허를 찾을 수 없습니다. 다른 키워드로 시도해주세요.`,
          errorType: "no_results",
          patents: [],
          triedKeywords: usedKeywords.length < keywords.length ? usedKeywords : undefined,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      patents: patents.slice(0, 10), // 최대 10개만 반환
      source: source, // 검색 소스: "api"
      usedKeywords: usedKeywords.length < keywords.length ? usedKeywords : undefined, // 키워드가 줄어들었으면 알림
    });
  } catch (error) {
    console.error("[patent-search] Unexpected error:", error);
    return handleApiError(error);
  }
}

