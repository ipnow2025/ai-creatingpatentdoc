import { useState } from "react";
import type { ExtractedData } from "@/features/patent/types/extraction.types";

export function useKeywordExtraction() {
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extractKeywords = async (text: string) => {
    if (!text.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/patent/extract-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "키워드 추출에 실패했습니다.");
        return null;
      }

      setExtractedData(data);
      return data;
    } catch (err) {
      setError("키워드 추출 중 오류가 발생했습니다.");
      console.error("[v0] Error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    extractKeywords,
    extractedData,
    isLoading,
    error,
  };
}

