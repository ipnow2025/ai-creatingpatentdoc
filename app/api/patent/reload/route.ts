import { type NextRequest, NextResponse } from "next/server";
import { reloadPatents } from "@/shared/lib/api/patent-search";
import { handleApiError } from "@/shared/lib/api/error-handler";

/**
 * 특허 데이터 캐시를 강제로 새로고침하는 API
 * GET /api/patent/reload
 */
export async function GET(request: NextRequest) {
  try {
    const result = await reloadPatents();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        count: result.count,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          count: result.count,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
}

