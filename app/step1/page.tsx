"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { usePatentContext } from "@/features/patent/contexts/patent-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2, CheckCircle, ArrowRight, FolderOpen } from "lucide-react"

function Step1Content() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    memoText,
    setMemoText,
    inventionTitle,
    setInventionTitle,
    inventor,
    setInventor,
    applicant,
    setApplicant,
    extractedData,
    setExtractedData,
    setSelectedKeywords,
    setSelectedTechnicalFields,
    setSelectedProblems,
    setSelectedFeatures,
  } = usePatentContext()

  const [isProcessing, setIsProcessing] = useState(false)
  const [hasAutoFilled, setHasAutoFilled] = useState(false)

  // URL 쿼리 파라미터에서 정보를 가져와서 자동완성
  useEffect(() => {
    if (hasAutoFilled) return // 이미 자동완성했으면 다시 실행하지 않음

    const title = searchParams.get("title")
    const description = searchParams.get("description")
    const content = searchParams.get("content")
    const tags = searchParams.get("tags")

    // 쿼리 파라미터가 있고, 현재 필드가 비어있을 때만 자동완성
    if ((title || description || content || tags) && !memoText && !inventionTitle) {
      // 제목 설정
      if (title) {
        setInventionTitle(decodeURIComponent(title))
      }

      // 메모 텍스트 구성
      let memoContent = ""

      // description 또는 content가 있으면 메모에 추가
      if (description) {
        memoContent += decodeURIComponent(description) + "\n\n"
      } else if (content) {
        memoContent += decodeURIComponent(content) + "\n\n"
      }

      // 태그가 있으면 메모에 추가
      if (tags) {
        const tagList = decodeURIComponent(tags)
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
        
        if (tagList.length > 0) {
          memoContent += "관련 기술: " + tagList.join(", ")
        }
      }

      if (memoContent.trim()) {
        setMemoText(memoContent.trim())
      }

      setHasAutoFilled(true)
    }
  }, [searchParams, hasAutoFilled, memoText, inventionTitle, setMemoText, setInventionTitle])

  const handleMemoSubmit = async () => {
    if (!memoText.trim()) {
      return
    }

    setIsProcessing(true)

    try {
      const extractResponse = await fetch("/api/patent/extract-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: memoText }),
      })

      const extractData = await extractResponse.json()

      if (!extractResponse.ok) {
        const errorMessage = extractData?.error || "정보 추출 중 오류가 발생했습니다."
        console.error("[Step1] API Error:", extractData)
        alert(errorMessage)
        return
      }

      setExtractedData(extractData)
      setSelectedKeywords(extractData.keywords || [])
      setSelectedTechnicalFields(extractData.technicalField || [])
      setSelectedProblems(extractData.problems || [])
      setSelectedFeatures(extractData.features || [])

      // Step 2로 이동
      router.push("/step2")
    } catch (error) {
      console.error("[Step1] Error:", error)
      const errorMessage = error instanceof Error ? error.message : "정보 추출 중 오류가 발생했습니다."
      alert(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
      <div className="bg-white border-b-2 border-teal-500 shadow-md">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">AI 직무발명신고서</h1>
            <Button
              onClick={() => router.push("/step4")}
              variant="outline"
              className="flex items-center gap-2 border-2 border-teal-500 text-teal-700 hover:bg-teal-50 font-bold px-6 py-3 h-auto rounded-xl bg-transparent"
            >
              <FolderOpen className="h-5 w-5" />
              저장된 기록 보기
            </Button>
          </div>

          <div className="flex items-center gap-6 max-w-5xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all shadow-md bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                1
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">정보 입력</div>
                <div className="text-xs text-gray-600">발명 내용 작성</div>
              </div>
            </div>

            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full transition-all bg-gray-200" />
              <ArrowRight className="w-5 h-5 text-gray-300" />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all shadow-md bg-gray-200 text-gray-400">
                2
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">정보 선택</div>
                <div className="text-xs text-gray-600">키워드 및 분야</div>
              </div>
            </div>

            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full transition-all bg-gray-200" />
              <ArrowRight className="w-5 h-5 text-gray-300" />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all shadow-md bg-gray-200 text-gray-400">
                3
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">특허 검색</div>
                <div className="text-xs text-gray-600">유사 특허 분석</div>
              </div>
            </div>

            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full transition-all bg-gray-200" />
              <ArrowRight className="w-5 h-5 text-gray-300" />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all shadow-md bg-gray-200 text-gray-400">
                4
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">저장된 기록</div>
                <div className="text-xs text-gray-600">이전 작업 확인</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-10">
        <Card className="shadow-lg border border-gray-200 overflow-hidden rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 pb-4 pt-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/90 backdrop-blur-sm text-teal-600 rounded-xl flex items-center justify-center font-bold shadow-lg text-base">
                  1
                </div>
                <div>
                  <CardTitle className="text-lg text-white font-bold tracking-tight">정보 입력</CardTitle>
                  <p className="text-teal-50 text-xs mt-0.5 font-medium">발명 내용 작성</p>
                </div>
              </div>
              {extractedData && (
                <Badge className="bg-white/95 text-teal-700 border-0 font-bold px-3 py-1 rounded-full shadow-lg text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  완료
                </Badge>
              )}
            </div>
            <p className="text-white/95 text-xs leading-relaxed pl-13">
              발명하고 싶은 내용을 자유롭게 작성하세요
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-5 bg-white">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900">
                발명의 명칭 <span className="text-gray-500 font-normal">(선택사항)</span>
              </label>
              <Input
                placeholder="입력하지 않으면 자동으로 생성됩니다"
                value={inventionTitle}
                onChange={(e) => setInventionTitle(e.target.value)}
                className="h-11 text-sm border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-xl transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">
                  발명자 <span className="text-gray-500 font-normal">(선택사항)</span>
                </label>
                <Input
                  placeholder="입력하지 않으면 비워둡니다"
                  value={inventor}
                  onChange={(e) => setInventor(e.target.value)}
                  className="h-11 text-sm border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-xl transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">
                  출원인 <span className="text-gray-500 font-normal">(선택사항)</span>
                </label>
                <Input
                  placeholder="입력하지 않으면 비워둡니다"
                  value={applicant}
                  onChange={(e) => setApplicant(e.target.value)}
                  className="h-11 text-sm border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-xl transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                발명 메모
                <Badge variant="destructive" className="text-xs font-bold px-3 py-0.5 rounded-full">
                  필수
                </Badge>
              </label>
              <Textarea
                placeholder="발명하고 싶은 내용을 자유롭게 작성하세요..."
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                className="min-h-[200px] text-sm border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 leading-relaxed rounded-xl transition-all"
              />
              <Button
                onClick={handleMemoSubmit}
                disabled={!memoText.trim() || isProcessing}
                className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all rounded-xl"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    정보 추출하기
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function Step1Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-teal-500 animate-spin" />
      </div>
    }>
      <Step1Content />
    </Suspense>
  )
}
