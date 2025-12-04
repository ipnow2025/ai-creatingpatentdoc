const API_BASE = "http://112.168.222.55:12254/api/generate";

// 기본 모델은 환경 변수로 설정 가능, 없으면 gpt-oss:120b-128k 사용
const DEFAULT_MODEL = process.env.API_MODEL || "gpt-oss:120b-128k";

export interface AIRequest {
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  topK?: number;
  topP?: number;
  model?: string; // 요청별로 모델을 지정할 수 있음
}

export async function callAIApi(request: AIRequest): Promise<string> {
  const model = request.model || DEFAULT_MODEL;

  try {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        prompt: request.prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        const errorText = await response.text();
        console.error("[callAIApi] Failed to parse error response:", errorText.substring(0, 200));
        errorData = { message: errorText.substring(0, 200) };
      }
      console.error("[callAIApi] API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw { error: errorData };
    }

    const data = await response.json();
    
    // 응답 형식 확인: response, text, 또는 다른 필드명일 수 있음
    const generatedText = data.response || data.text || data.content || data.output || data.result;

    if (!generatedText) {
      console.error("[callAIApi] No generated text in response:", JSON.stringify(data, null, 2));
      throw new Error("생성된 텍스트가 없습니다.");
    }

    return generatedText;
  } catch (error) {
    // Re-throw if it's already formatted for error handler
    if (error && typeof error === "object" && "error" in error) {
      throw error;
    }
    // Wrap other errors
    console.error("[callAIApi] Unexpected error:", error);
    throw error;
  }
}

