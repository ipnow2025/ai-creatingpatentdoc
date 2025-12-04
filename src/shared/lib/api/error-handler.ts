import { NextResponse } from "next/server";

export interface ApiError {
  error: string;
  errorType: string;
  retryAfter?: string;
}

export function handleApiError(error: any): NextResponse<ApiError> {
  // 네트워크 에러
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return NextResponse.json(
      {
        error: "네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.",
        errorType: "network_error",
      },
      { status: 503 }
    );
  }

  // Google API 에러
  if (error?.error?.code === 429) {
    return NextResponse.json(
      {
        error: "API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
        errorType: "quota_exceeded",
        retryAfter:
          error.error?.details?.find((d: any) => d["@type"]?.includes("RetryInfo"))?.retryDelay || "60s",
      },
      { status: 429 }
    );
  }

  if (error?.error?.code === 400) {
    return NextResponse.json(
      {
        error: "요청 형식이 올바르지 않습니다.",
        errorType: "bad_request",
      },
      { status: 400 }
    );
  }

  if (error?.error?.code === 403) {
    return NextResponse.json(
      {
        error: "API 키가 유효하지 않거나 권한이 없습니다.",
        errorType: "forbidden",
      },
      { status: 403 }
    );
  }

  // 기본 서버 에러
  return NextResponse.json(
    {
      error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      errorType: "server_error",
    },
    { status: 500 }
  );
}

