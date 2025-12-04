export function validateApiKey(apiKey: string | undefined): {
  isValid: boolean;
  error?: string;
  errorType?: string;
} {
  if (!apiKey) {
    return {
      isValid: false,
      error: "API 키가 설정되지 않았습니다.",
      errorType: "missing_api_key",
    };
  }

  if (!apiKey.startsWith("AIza")) {
    return {
      isValid: false,
      error: "유효하지 않은 API 키 형식입니다. Google API 키는 'AIza'로 시작해야 합니다.",
      errorType: "invalid_api_key",
    };
  }

  return { isValid: true };
}

