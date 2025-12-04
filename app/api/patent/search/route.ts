import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/shared/lib/api/error-handler";
import { searchPatentsFromJSON } from "@/shared/lib/api/patent-search";

export async function POST(request: NextRequest) {
  try {
    const { keywords } = await request.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: "키워드가 필요합니다." }, { status: 400 });
    }

    // data 폴더의 파일에서만 특허 데이터 검색 (외부 API 사용 안 함)
    let patents: any[] = [];
    let source = "file";
    
    try {
      patents = await searchPatentsFromJSON({ keywords, numOfRows: 10 });
      console.log("[patent-search] Search from files returned:", patents.length, "results");
      
      // 검색 결과의 첫 번째 항목 로그 (디버깅용)
      if (patents.length > 0) {
        console.log("[patent-search] First result sample:", {
          patentNumber: patents[0].patentNumber,
          title: patents[0].title?.substring(0, 50),
          applicant: patents[0].applicant,
          source: "file"
        });
      }
    } catch (error) {
      console.error("[patent-search] Error searching from files:", error);
      // 파일 검색 실패 시 상세한 오류 메시지 반환
      if (error instanceof Error) {
        return NextResponse.json(
          {
            error: "특허 데이터 파일을 읽는 중 오류가 발생했습니다.",
            errorType: "file_read_error",
            details: error.message,
            patents: [],
          },
          { status: 500 }
        );
      }
      patents = [];
    }

    // 검색 결과가 없으면 에러 반환 (임의 특허 반환 방지)
    if (patents.length === 0) {
      console.log("[patent-search] No matches found for keywords:", keywords);
      return NextResponse.json(
        { 
          error: `검색 결과가 없습니다. 키워드 "${keywords.join(", ")}"에 대한 유사 특허를 찾을 수 없습니다. 다른 키워드로 시도해주세요.`,
          errorType: "no_results",
          patents: [] 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      patents: patents.slice(0, 10), // 최대 10개만 반환
      source: source, // 검색 소스: "json" 또는 "api"
    });
  } catch (error) {
    console.error("[patent-search] Unexpected error:", error);
    if (error instanceof Error) {
      console.error("[patent-search] Error message:", error.message);
      console.error("[patent-search] Error stack:", error.stack);
      
      // 파일 읽기 관련 오류인 경우 더 명확한 메시지 반환
      if (error.message.includes("ENOENT") || error.message.includes("Cannot read")) {
        return NextResponse.json(
          {
            error: "특허 데이터 파일을 읽는 중 오류가 발생했습니다. 파일이 올바른 형식인지 확인해주세요.",
            errorType: "file_read_error",
            details: error.message,
          },
          { status: 500 }
        );
      }
      
      // 메모리 관련 오류
      if (error.message.includes("heap") || error.message.includes("memory")) {
        return NextResponse.json(
          {
            error: "데이터가 너무 많아 처리할 수 없습니다. 파일을 분할하거나 서버 메모리를 늘려주세요.",
            errorType: "memory_error",
            details: error.message,
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      {
        error: "특허 검색 중 오류가 발생했습니다.",
        errorType: "unknown_error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

