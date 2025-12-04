# 파일 이동 가이드 (상세)

이 문서는 기존 프로젝트 구조를 새로운 아키텍처로 마이그레이션하는 단계별 가이드를 제공합니다.

---

## 📋 마이그레이션 전 체크리스트

마이그레이션을 시작하기 전에 다음을 확인하세요:

- [ ] 현재 프로젝트가 정상적으로 빌드됨
- [ ] Git 저장소에 커밋 (백업)
- [ ] 모든 기능이 정상 작동함
- [ ] 테스트 실행 (있는 경우)

---

## 🚀 Phase 1: 공통 모듈 생성 및 이동

### Step 1.1: 폴더 구조 생성

```bash
# 루트 디렉토리에서 실행
mkdir -p src/shared/lib/api
mkdir -p src/shared/lib/constants
mkdir -p src/shared/hooks
mkdir -p src/shared/types
mkdir -p src/features/patent/types
mkdir -p src/features/patent/services
mkdir -p src/features/patent/hooks
mkdir -p src/shared/components/layout
```

### Step 1.2: API 공통 로직 생성

#### 파일: `src/shared/lib/api/api-key-validator.ts`
```typescript
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
```

#### 파일: `src/shared/lib/api/error-handler.ts`
```typescript
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
```

#### 파일: `src/shared/lib/api/client.ts`
```typescript
import { validateApiKey } from "./api-key-validator";
import { handleApiError } from "./error-handler";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export interface GeminiRequest {
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export async function callGeminiApi(request: GeminiRequest): Promise<string> {
  const apiKey = process.env.AI || process.env.GOOGLE_API_KEY;
  
  const validation = validateApiKey(apiKey);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const response = await fetch(`${GEMINI_API_BASE}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: request.prompt }],
        },
      ],
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxOutputTokens ?? 8192,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { error: errorData };
  }

  const data = await response.json();
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!generatedText) {
    throw new Error("생성된 텍스트가 없습니다.");
  }

  return generatedText;
}
```

### Step 1.3: 공통 타입 정의

#### 파일: `src/features/patent/types/patent.types.ts`
```typescript
export interface Patent {
  patentNumber: string;
  title: string;
  applicant: string;
  applicationDate: string;
  summary: string;
}
```

#### 파일: `src/features/patent/types/draft.types.ts`
```typescript
export interface DraftVersion {
  version: number;
  content: string;
  timestamp: Date;
  feedbackUsed?: string;
}
```

#### 파일: `src/features/patent/types/extraction.types.ts`
```typescript
export interface ExtractedData {
  keywords: string[];
  technicalField: string[];
  problem: string;
  solution: string;
  effects: string[];
  components: string[];
  problems: string[];
  features: string[];
}
```

### Step 1.4: 중복 파일 정리

**작업**: `hooks/use-mobile.ts`와 `components/ui/use-mobile.tsx` 중 하나만 유지

1. 두 파일 내용 비교
2. 더 최신 버전 또는 더 완전한 버전 선택
3. 선택한 파일을 `src/shared/hooks/use-mobile.ts`로 이동
4. 다른 파일 삭제
5. 모든 import 경로 업데이트: `@/hooks/use-mobile` → `@/shared/hooks/use-mobile`

동일하게 `use-toast.ts`도 처리

---

## 🔧 Phase 2: 컴포넌트 분리

### Step 2.1: 메인 컴포넌트 분석 및 분리 계획

`components/main-content.tsx`를 다음 컴포넌트로 분리:

1. **MemoInput** (라인 1095-1204)
2. **KeywordSelector** (라인 1206-1388)
3. **PatentSelector** (라인 1390-1543)
4. **DraftViewer** (라인 1546-1783)
5. **PatentDetailModal** (라인 1787-2011)

### Step 2.2: 컴포넌트 폴더 생성

```bash
mkdir -p src/features/patent/components/memo-input
mkdir -p src/features/patent/components/keyword-selector
mkdir -p src/features/patent/components/patent-selector
mkdir -p src/features/patent/components/draft-viewer
mkdir -p src/features/patent/components/patent-detail-modal
```

### Step 2.3: 각 컴포넌트 추출 예시

#### 파일: `src/features/patent/components/memo-input/memo-input.tsx`
```typescript
"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import type { ExtractedData } from "@/features/patent/types/extraction.types";

interface MemoInputProps {
  memoText: string;
  inventionTitle: string;
  inventor: string;
  applicant: string;
  extractedData: ExtractedData | null;
  isProcessing: boolean;
  isEditMode: boolean;
  expandedSection: number | null;
  onMemoTextChange: (text: string) => void;
  onInventionTitleChange: (title: string) => void;
  onInventorChange: (inventor: string) => void;
  onApplicantChange: (applicant: string) => void;
  onMemoSubmit: () => void;
  onSectionExpand: (section: number) => void;
}

export function MemoInput({
  memoText,
  inventionTitle,
  inventor,
  applicant,
  extractedData,
  isProcessing,
  isEditMode,
  expandedSection,
  onMemoTextChange,
  onInventionTitleChange,
  onInventorChange,
  onApplicantChange,
  onMemoSubmit,
  onSectionExpand,
}: MemoInputProps) {
  const isExpanded = expandedSection === 1;
  const shouldShowFull = !extractedData || (isEditMode && isExpanded);

  return (
    <Card
      className={`shadow-lg border border-gray-200 overflow-hidden rounded-2xl hover:shadow-xl transition-all ${
        shouldShowFull ? "flex-[2]" : "flex-[0.5]"
      }`}
    >
      <CardHeader
        className={`bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 pb-4 pt-4 ${
          isEditMode && extractedData ? "cursor-pointer" : ""
        }`}
        onClick={() => onSectionExpand(1)}
      >
        {/* 헤더 내용 */}
      </CardHeader>
      {shouldShowFull ? (
        <CardContent className="p-6 space-y-5 bg-white">
          {/* 입력 폼 내용 */}
        </CardContent>
      ) : (
        <CardContent className="p-4 bg-white">
          {/* 축약된 내용 */}
        </CardContent>
      )}
    </Card>
  );
}
```

**주의사항**:
- 각 컴포넌트는 필요한 props만 받도록 설계
- 상태는 상위 컴포넌트에서 관리
- 이벤트 핸들러는 props로 전달

---

## 🎣 Phase 3: 비즈니스 로직 분리

### Step 3.1: 커스텀 훅 생성

#### 파일: `src/features/patent/hooks/use-keyword-extraction.ts`
```typescript
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
        return;
      }

      setExtractedData(data);
      return data;
    } catch (err) {
      setError("키워드 추출 중 오류가 발생했습니다.");
      console.error("[v0] Error:", err);
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
```

#### 파일: `src/features/patent/hooks/use-patent-search.ts`
```typescript
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
        return;
      }

      setPatents(data.patents || []);
      return data.patents;
    } catch (err) {
      setError("특허 검색 중 오류가 발생했습니다.");
      console.error("[v0] Error:", err);
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
```

### Step 3.2: 서비스 함수 생성

#### 파일: `src/features/patent/services/draft-parser.service.ts`
```typescript
export function cleanContent(content: string): string {
  if (!content) return content;
  return content.replace(/\*\*/g, "").replace(/\*/g, "");
}

export function parseDraftSections(content: string) {
  const cleanedContent = cleanContent(content);
  // 파싱 로직...
  return sections;
}

export function parseStructuredSummary(content: string) {
  const cleanedContent = cleanContent(content);
  // 파싱 로직...
  return summary;
}
```

---

## 🔄 Phase 4: API 라우트 리팩토링

### Step 4.1: API 라우트 폴더 구조 변경

```bash
# 기존 구조
app/api/extract-keywords/route.ts
app/api/generate-patent/route.ts
app/api/search-patents/route.ts
app/api/generate-report/route.ts

# 새로운 구조
app/api/patent/extract-keywords/route.ts
app/api/patent/generate/route.ts
app/api/patent/search/route.ts
app/api/patent/report/route.ts
```

### Step 4.2: API 라우트 리팩토링 예시

#### 파일: `app/api/patent/extract-keywords/route.ts` (리팩토링 후)
```typescript
import { type NextRequest, NextResponse } from "next/server";
import { callGeminiApi } from "@/shared/lib/api/client";
import { handleApiError } from "@/shared/lib/api/error-handler";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "텍스트가 필요합니다." }, { status: 400 });
    }

    const prompt = `다음 텍스트에서 특허 명세서 작성에 필요한 정보를 추출해주세요.

텍스트: ${text}

다음 형식의 JSON으로만 응답해주세요:
{
  "keywords": ["키워드1", "키워드2", ...],
  "technicalField": ["분야1", "분야2", "분야3"],
  "problems": ["문제1", "문제2", "문제3"],
  "features": ["기능1", "기능2", ...],
}

JSON 형식으로만 응답하고, 다른 설명은 포함하지 마세요.`;

    const generatedText = await callGeminiApi({
      prompt,
      temperature: 0.3,
      maxOutputTokens: 8192,
    });

    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const extractedData = JSON.parse(jsonMatch[0]);

      return NextResponse.json({
        keywords: extractedData.keywords || [],
        technicalField: extractedData.technicalField || [],
        problems: extractedData.problems || [],
        features: extractedData.features || [],
      });
    } catch (parseError) {
      console.error("[v0] Failed to parse structured data:", parseError);
      return NextResponse.json({ error: "데이터 파싱에 실패했습니다." }, { status: 500 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## ⚙️ Phase 5: 설정 파일 업데이트

### Step 5.1: `tsconfig.json` 업데이트

```json
{
  "compilerOptions": {
    // ... 기존 설정 ...
    "paths": {
      "@/*": ["./*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"]
    }
  }
}
```

### Step 5.2: Import 경로 업데이트 예시

**기존**:
```typescript
import { MainContent } from "@/components/main-content";
```

**새로운**:
```typescript
import { MainContent } from "@/features/patent/components/main-content";
```

또는 각 컴포넌트를 개별 import:
```typescript
import { MemoInput } from "@/features/patent/components/memo-input/memo-input";
import { KeywordSelector } from "@/features/patent/components/keyword-selector/keyword-selector";
```

---

## ✅ 마이그레이션 검증

### 체크리스트

- [ ] 모든 파일이 올바른 위치로 이동됨
- [ ] 모든 import 경로가 업데이트됨
- [ ] `npm run build` 성공
- [ ] `npm run dev` 실행 시 에러 없음
- [ ] 모든 기능이 정상 작동함
- [ ] 타입 에러 없음 (`npm run type-check`)

### 테스트 방법

1. **빌드 테스트**:
   ```bash
   npm run build
   ```

2. **타입 체크**:
   ```bash
   npx tsc --noEmit
   ```

3. **기능 테스트**:
   - 메모 입력 → 키워드 추출
   - 키워드 선택 → 특허 검색
   - 특허 선택 → 초안 생성
   - 초안 다운로드
   - 초안 수정

---

## 🚨 주의사항

1. **점진적 마이그레이션**: 한 번에 모든 것을 이동하지 말고, 단계별로 진행
2. **Git 커밋**: 각 Phase 완료 후 커밋
3. **백업**: 마이그레이션 전 전체 백업
4. **테스트**: 각 단계마다 빌드 및 기능 테스트

---

## 📞 문제 해결

### 문제: Import 경로를 찾을 수 없음
**해결**: `tsconfig.json`의 `paths` 설정 확인

### 문제: 빌드 에러
**해결**: 
1. `node_modules` 삭제 후 `npm install` 재실행
2. `.next` 폴더 삭제 후 재빌드

### 문제: 타입 에러
**해결**: 
1. 타입 파일이 올바른 위치에 있는지 확인
2. `tsconfig.json`의 `include` 설정 확인

---

이 가이드를 따라 단계별로 마이그레이션을 진행하시면 됩니다. 각 단계를 완료한 후 다음 단계로 진행하세요.

