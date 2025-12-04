import { useState } from "react";
import type { DraftVersion } from "@/features/patent/types/draft.types";
import type { ExtractedData } from "@/features/patent/types/extraction.types";
import type { Patent } from "@/features/patent/types/patent.types";

interface GeneratePatentParams {
  keywords: string[];
  inventionTitle: string;
  inventor: string;
  applicant: string;
  mode: "memo" | "refine";
  description?: string;
  originalContent?: string;
  feedbackComments?: string;
  isRevision?: boolean;
  structuredData?: {
    technicalField: string[];
    problem: string;
    solution: string;
    effects: string[];
    components: string[];
    problems: string[];
    features: string[];
  };
  referencePatents?: Patent[];
}

export function usePatentGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePatent = async (params: GeneratePatentParams): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/patent/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "특허 명세서 생성에 실패했습니다.");
        return null;
      }

      return data.result;
    } catch (err) {
      setError("특허 명세서 생성 중 오류가 발생했습니다.");
      console.error("[v0] Error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generatePatent,
    isLoading,
    error,
  };
}

