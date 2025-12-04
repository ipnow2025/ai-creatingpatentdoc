import { useState } from "react";
import type { Patent } from "@/features/patent/types/patent.types";

export function usePatentSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [patents, setPatents] = useState<Patent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const searchPatents = async (keywords: string[]) => {
    if (!keywords || keywords.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/patent/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "특허 검색에 실패했습니다.");
        return null;
      }

      setPatents(data.patents || []);
      return data.patents;
    } catch (err) {
      setError("특허 검색 중 오류가 발생했습니다.");
      console.error("[v0] Error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    searchPatents,
    patents,
    isLoading,
    error,
  };
}

