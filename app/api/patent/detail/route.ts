import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/shared/lib/api/error-handler";
import { getPatentDetail } from "@/shared/lib/api/patent-search";

export async function POST(request: NextRequest) {
  try {
    const { idx, applyNumber } = await request.json();

    if (!idx && !applyNumber) {
      return NextResponse.json(
        { error: "idx 또는 applyNumber가 필요합니다." },
        { status: 400 }
      );
    }

    try {
      const patentDetail = await getPatentDetail(idx, applyNumber);

      if (!patentDetail) {
        return NextResponse.json(
          { error: "특허 상세 정보를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      return NextResponse.json({ patent: patentDetail });
    } catch (error) {
      console.error("[patent-detail] Error fetching patent detail:", error);
      if (error instanceof Error) {
        return NextResponse.json(
          {
            error: "특허 상세 정보 조회 중 오류가 발생했습니다.",
            errorType: "api_error",
            details: error.message,
          },
          { status: 500 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("[patent-detail] Unexpected error:", error);
    return handleApiError(error);
  }
}

