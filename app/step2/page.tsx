"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePatentContext } from "@/features/patent/contexts/patent-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react"

export default function Step2Page() {
  const router = useRouter()
  const {
    extractedData,
    selectedKeywords,
    selectedTechnicalFields,
    selectedProblems,
    selectedFeatures,
    toggleKeyword,
    toggleTechnicalField,
    toggleProblem,
    toggleFeature,
    setSimilarPatents,
  } = usePatentContext()

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!extractedData) {
      router.push("/step1")
    }
  }, [extractedData, router])

  const handleSelectInfoAndSearch = async () => {
    if (!extractedData) {
      return
    }

    setIsLoading(true)

    try {
      const searchResponse = await fetch("/api/patent/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: selectedKeywords }),
      })

      const searchData = await searchResponse.json()

      if (!searchResponse.ok) {
        alert("특허 검색 중 오류가 발생했습니다.")
        return
      }

      setSimilarPatents(searchData.patents || [])

      // Step 3로 이동
      router.push("/step3")
    } catch (error) {
      console.error("Error:", error)
      alert("특허 검색 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!extractedData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
      <div className="bg-white border-b-2 border-teal-500 shadow-md">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">AI 직무발명신고서</h1>

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
              <div className="flex-1 h-1.5 rounded-full transition-all bg-gradient-to-r from-teal-500 to-emerald-500" />
              <ArrowRight className="w-5 h-5 text-teal-600" />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all shadow-md bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
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
                  2
                </div>
                <div>
                  <CardTitle className="text-lg text-white font-bold tracking-tight">핵심 정보 선택</CardTitle>
                  <p className="text-teal-50 text-xs mt-0.5 font-medium">키워드 및 분야</p>
                </div>
              </div>
            </div>
            <p className="text-white/95 text-xs leading-relaxed pl-13">원하는 항목을 선택하세요</p>
          </CardHeader>
          <CardContent className="p-6 space-y-5 bg-white max-h-[600px] overflow-y-auto">
            {extractedData.keywords && extractedData.keywords.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  핵심 키워드
                  <Badge
                    variant="outline"
                    className="text-xs font-bold border-2 border-teal-500 text-teal-700 rounded-full px-2 py-0.5"
                  >
                    {selectedKeywords.length}개 선택
                  </Badge>
                </label>
                <div className="flex flex-wrap gap-2">
                  {extractedData.keywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant={selectedKeywords.includes(keyword) ? "default" : "secondary"}
                      className={`cursor-pointer text-sm px-4 py-2 transition-all rounded-lg font-bold shadow-sm hover:shadow-md ${
                        selectedKeywords.includes(keyword)
                          ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                      }`}
                      onClick={() => toggleKeyword(keyword)}
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {extractedData.technicalField && extractedData.technicalField.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  기술 분야
                  <Badge
                    variant="outline"
                    className="text-xs font-bold border-2 border-teal-500 text-teal-700 rounded-full px-2 py-0.5"
                  >
                    {selectedTechnicalFields.length}개 선택
                  </Badge>
                </label>
                <div className="flex flex-wrap gap-2">
                  {extractedData.technicalField.map((field) => (
                    <Badge
                      key={field}
                      variant={selectedTechnicalFields.includes(field) ? "default" : "secondary"}
                      className={`cursor-pointer text-sm px-4 py-2 transition-all rounded-lg font-bold shadow-sm hover:shadow-md ${
                        selectedTechnicalFields.includes(field)
                          ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                      }`}
                      onClick={() => toggleTechnicalField(field)}
                    >
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {extractedData.problems && extractedData.problems.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  해결하는 문제점
                  <Badge
                    variant="outline"
                    className="text-xs font-bold border-2 border-teal-500 text-teal-700 rounded-full px-2 py-0.5"
                  >
                    {selectedProblems.length}개 선택
                  </Badge>
                </label>
                <div className="flex flex-wrap gap-2">
                  {extractedData.problems.map((problem) => (
                    <Badge
                      key={problem}
                      variant={selectedProblems.includes(problem) ? "default" : "secondary"}
                      className={`cursor-pointer text-sm px-4 py-2 transition-all rounded-lg font-bold shadow-sm hover:shadow-md ${
                        selectedProblems.includes(problem)
                          ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                      }`}
                      onClick={() => toggleProblem(problem)}
                    >
                      {problem}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {extractedData.features && extractedData.features.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  주요 특징
                  <Badge
                    variant="outline"
                    className="text-xs font-bold border-2 border-teal-500 text-teal-700 rounded-full px-2 py-0.5"
                  >
                    {selectedFeatures.length}개 선택
                  </Badge>
                </label>
                <div className="flex flex-wrap gap-2">
                  {extractedData.features.map((feature) => (
                    <Badge
                      key={feature}
                      variant={selectedFeatures.includes(feature) ? "default" : "secondary"}
                      className={`cursor-pointer text-sm px-4 py-2 transition-all rounded-lg font-bold shadow-sm hover:shadow-md ${
                        selectedFeatures.includes(feature)
                          ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                      }`}
                      onClick={() => toggleFeature(feature)}
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => router.push("/step1")}
                variant="outline"
                className="flex-1 h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-bold rounded-xl"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                이전 단계
              </Button>
              <Button
                onClick={handleSelectInfoAndSearch}
                disabled={isLoading || selectedKeywords.length === 0}
                className="flex-1 h-12 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all rounded-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    검색 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    유사 특허 검색하기
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

