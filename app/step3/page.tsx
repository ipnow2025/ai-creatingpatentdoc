"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePatentContext } from "@/features/patent/contexts/patent-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Sparkles, Loader2, CheckCircle, ArrowRight, ArrowLeft, ExternalLink } from "lucide-react"
import type { Patent } from "@/features/patent/types/patent.types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function Step3Page() {
  const router = useRouter()
  const {
    similarPatents,
    selectedPatents,
    togglePatentSelection,
    selectedKeywords,
    inventionTitle,
    inventor,
    applicant,
    extractedData,
    selectedTechnicalFields,
    selectedProblems,
    selectedFeatures,
    setDraftVersions,
    setCurrentDraftIndex,
    setActiveTab,
  } = usePatentContext()

  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedPatentDetail, setSelectedPatentDetail] = useState<Patent | null>(null)
  const [isPatentModalOpen, setIsPatentModalOpen] = useState(false)

  useEffect(() => {
    if (similarPatents.length === 0) {
      router.push("/step2")
    }
  }, [similarPatents, router])

  const handleViewPatentDetail = (patent: Patent, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedPatentDetail(patent)
    setIsPatentModalOpen(true)
  }

  const handleGenerateDraft = async () => {
    if (selectedPatents.length === 0) {
      alert("참고할 특허를 1개 이상 선택해주세요.")
      return
    }

    setIsGenerating(true)

    try {
      const selectedPatentData = similarPatents.filter((p) => selectedPatents.includes(p.patentNumber))

      const generateResponse = await fetch("/api/patent/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: selectedKeywords.join(", "),
          inventionTitle,
          inventor,
          applicant,
          mode: "memo",
          structuredData: extractedData
            ? {
                technicalField: selectedTechnicalFields,
                problem: extractedData.problem,
                solution: extractedData.solution,
                effects: extractedData.effects || [],
                components: extractedData.components || [],
                problems: selectedProblems,
                features: selectedFeatures,
              }
            : null,
          referencePatents: selectedPatentData,
        }),
      })

      const generateData = await generateResponse.json()

      if (!generateResponse.ok) {
        alert("특허 명세서 생성 중 오류가 발생했습니다.")
        return
      }

      const newDraft = {
        version: 1,
        content: generateData.result,
        timestamp: new Date(),
      }

      setDraftVersions([newDraft])
      setCurrentDraftIndex(0)
      setActiveTab("draft-1")

      // 결과 페이지로 이동
      router.push("/result")
    } catch (error) {
      console.error("Error:", error)
      alert("특허 명세서 생성 중 오류가 발생했습니다.")
    } finally {
      setIsGenerating(false)
    }
  }

  if (similarPatents.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
      {isGenerating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-12 shadow-2xl max-w-md w-full mx-4">
            <div className="text-center space-y-6">
              <div className="relative">
                <Loader2 className="h-20 w-20 text-teal-500 animate-spin mx-auto" />
                <Sparkles className="h-8 w-8 text-teal-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-gray-900">AI가 특허 명세서를 생성하고 있습니다</h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  입력하신 정보와 선택한 특허를 분석하여
                  <br />
                  전문적인 특허 명세서 초안을 작성하고 있습니다.
                  <br />
                  잠시만 기다려주세요...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex-1 h-1.5 rounded-full transition-all bg-gradient-to-r from-teal-500 to-emerald-500" />
              <ArrowRight className="w-5 h-5 text-teal-600" />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all shadow-md bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
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
                  3
                </div>
                <div>
                  <CardTitle className="text-lg text-white font-bold tracking-tight">유사 특허 선택</CardTitle>
                  <p className="text-teal-50 text-xs mt-0.5 font-medium">특허 분석 및 선택</p>
                </div>
              </div>
            </div>
            <p className="text-white/95 text-xs leading-relaxed pl-13">참고할 유사 특허를 선택하세요</p>
          </CardHeader>
          <CardContent className="p-6 space-y-5 bg-white max-h-[600px] overflow-y-auto">
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2 sticky top-0 bg-white pb-2 z-10">
                유사 특허 목록
                <Badge
                  variant="outline"
                  className="text-xs font-bold border-2 border-teal-500 text-teal-700 rounded-full px-2 py-0.5"
                >
                  {selectedPatents.length}개 선택
                </Badge>
              </label>
              <div className="space-y-4">
                {similarPatents.map((patent, index) => (
                  <Card
                    key={patent.patentNumber ? `${patent.patentNumber}-${index}` : `patent-${index}`}
                    className={`cursor-pointer transition-all rounded-xl ${
                      selectedPatents.includes(patent.patentNumber)
                        ? "border-2 border-teal-500 bg-teal-50 shadow-lg"
                        : "border border-gray-200 hover:border-teal-300 bg-white hover:shadow-md"
                    }`}
                    onClick={() => togglePatentSelection(patent.patentNumber)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedPatents.includes(patent.patentNumber)}
                            onCheckedChange={() => togglePatentSelection(patent.patentNumber)}
                            className="mt-1 h-5 w-5"
                          />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-bold text-gray-900 text-base leading-snug flex-1">{patent.title}</h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleViewPatentDetail(patent, e)}
                              className="flex-shrink-0 text-xs border-teal-500 text-teal-700 hover:bg-teal-50 font-bold rounded-lg px-3 py-1"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              전체보기
                            </Button>
                          </div>

                          <Badge
                            variant="outline"
                            className="text-xs border border-teal-500 text-teal-700 font-bold rounded-md px-3 py-1"
                          >
                            {patent.patentNumber}
                          </Badge>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">출원인:</span>
                              <span>{patent.applicant}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">출원일:</span>
                              <span>{patent.applicationDate}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-200">
                            <h5 className="font-semibold text-gray-900 text-xs mb-1">요약</h5>
                            <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{patent.summary}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => router.push("/step2")}
                variant="outline"
                className="flex-1 h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-bold rounded-xl"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                이전 단계
              </Button>
              <Button
                onClick={handleGenerateDraft}
                disabled={selectedPatents.length === 0 || isGenerating}
                className="flex-1 h-12 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all rounded-xl"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    초안 생성하기
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPatentModalOpen} onOpenChange={setIsPatentModalOpen}>
        <DialogContent className="!max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-gray-900 pr-8 leading-tight mb-4">
              {selectedPatentDetail?.title}
            </DialogTitle>
            <DialogDescription className="sr-only">특허 명세서 전체 내용</DialogDescription>
          </DialogHeader>
          {selectedPatentDetail && (
            <div className="space-y-10 pt-4">
              <div className="flex items-center justify-between pb-6 border-b-2 border-gray-300">
                <Badge
                  variant="outline"
                  className="text-lg border-2 border-teal-500 text-teal-700 font-bold rounded-lg px-6 py-2"
                >
                  {selectedPatentDetail.patentNumber}
                </Badge>
                <div className="flex gap-8 text-base">
                  <div>
                    <span className="font-bold text-gray-700">출원인: </span>
                    <span className="text-gray-900">{selectedPatentDetail.applicant}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">출원일: </span>
                    <span className="text-gray-900">{selectedPatentDetail.applicationDate}</span>
                  </div>
                </div>
              </div>

              <div className="prose prose-lg max-w-none space-y-8">
                {/* 기본 정보 */}
                <div className="grid grid-cols-2 gap-6 pb-6 border-b border-gray-200">
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 mb-2">등록일자</h3>
                    <p className="text-base text-gray-900">{selectedPatentDetail.registrationDate || "-"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 mb-2">공고번호</h3>
                    <p className="text-base text-gray-900">{selectedPatentDetail.publicationNumber || "-"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 mb-2">공고일자</h3>
                    <p className="text-base text-gray-900">{selectedPatentDetail.publicationDate || "-"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 mb-2">지정분류코드</h3>
                    <p className="text-base text-gray-900">{selectedPatentDetail.classificationCode || "-"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 mb-2">청구항수</h3>
                    <p className="text-base text-gray-900">{selectedPatentDetail.claimCount || "-"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 mb-2">존속기간만료일자</h3>
                    <p className="text-base text-gray-900">{selectedPatentDetail.expirationDate || "-"}</p>
                  </div>
                </div>

                {/* 영문 발명의 명칭 */}
                {selectedPatentDetail.englishTitle && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">【영문 발명의 명칭】</h2>
                    <p className="text-gray-800 leading-relaxed text-base">{selectedPatentDetail.englishTitle}</p>
                  </div>
                )}

                {/* 기술분야/요약 */}
                {selectedPatentDetail.summary && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">【기술분야】</h2>
                    <p className="text-gray-800 leading-relaxed text-base">{selectedPatentDetail.summary}</p>
                  </div>
                )}

                {/* 상세설명 */}
                {selectedPatentDetail.abstract && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">【상세설명】</h2>
                    <p className="text-gray-800 leading-relaxed text-base whitespace-pre-wrap">{selectedPatentDetail.abstract}</p>
                  </div>
                )}

                {/* 상태 정보 */}
                {selectedPatentDetail.status && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">【법적상태】</h2>
                    <p className="text-gray-800 leading-relaxed text-base">{selectedPatentDetail.status}</p>
                  </div>
                )}
              </div>

              <div className="pt-8 border-t-2 border-gray-300 sticky bottom-0 bg-white">
                <div className="flex items-center gap-4 p-5 bg-teal-50 rounded-xl">
                  <Checkbox
                    id="modal-select"
                    checked={selectedPatents.includes(selectedPatentDetail.patentNumber)}
                    onCheckedChange={() => togglePatentSelection(selectedPatentDetail.patentNumber)}
                    className="h-6 w-6"
                  />
                  <label htmlFor="modal-select" className="text-lg font-bold text-gray-900 cursor-pointer">
                    이 특허를 참고 자료로 선택
                  </label>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

