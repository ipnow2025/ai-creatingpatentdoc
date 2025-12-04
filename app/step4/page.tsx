"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowRight, ArrowLeft, Eye, Trash2, FileText, Calendar, Tag } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface SavedPatent {
  id: string
  title: string
  createdAt: string
  draftCount: number
  keywords: string[]
}

interface SavedPatentDetail {
  id: string
  createdAt: string
  title: string
  step1Data: {
    memoText: string
    inventionTitle: string
    inventor: string
    applicant: string
    extractedData: any
  }
  step2Data: {
    selectedKeywords: string[]
    selectedTechnicalFields: string[]
    selectedProblems: string[]
    selectedFeatures: string[]
    similarPatents: any[]
  }
  step3Data: {
    selectedPatents: string[]
  }
  draftVersions: Array<{
    version: number
    content: string
    timestamp: string
    feedbackUsed?: string
  }>
}

export default function Step4Page() {
  const router = useRouter()
  const [savedPatents, setSavedPatents] = useState<SavedPatent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPatent, setSelectedPatent] = useState<SavedPatentDetail | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadSavedPatents()
  }, [])

  const loadSavedPatents = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/patent/saved")
      const data = await response.json()

      if (!response.ok) {
        alert("저장된 기록을 불러오는 중 오류가 발생했습니다.")
        return
      }

      setSavedPatents(data.patents || [])
    } catch (error) {
      console.error("Error:", error)
      alert("저장된 기록을 불러오는 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/patent/saved/${id}`)
      const data = await response.json()

      if (!response.ok) {
        alert("기록을 불러오는 중 오류가 발생했습니다.")
        return
      }

      setSelectedPatent(data)
      setIsDetailOpen(true)
    } catch (error) {
      console.error("Error:", error)
      alert("기록을 불러오는 중 오류가 발생했습니다.")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) {
      return
    }

    setIsDeleting(id)
    try {
      const response = await fetch(`/api/patent/saved/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        alert("삭제 중 오류가 발생했습니다: " + (data.error || "알 수 없는 오류"))
        return
      }

      // Remove from list
      setSavedPatents((prev) => prev.filter((p) => p.id !== id))
      if (selectedPatent?.id === id) {
        setIsDetailOpen(false)
        setSelectedPatent(null)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("삭제 중 오류가 발생했습니다.")
    } finally {
      setIsDeleting(null)
    }
  }

  const cleanContent = (content: string) => {
    if (!content) return content
    return content.replace(/\*\*/g, "").replace(/\*/g, "")
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
              <div className="flex-1 h-1.5 rounded-full transition-all bg-gradient-to-r from-teal-500 to-emerald-500" />
              <ArrowRight className="w-5 h-5 text-teal-600" />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all shadow-md bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
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

      <div className="max-w-6xl mx-auto px-8 py-10">
        <Card className="shadow-lg border border-gray-200 overflow-hidden rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 pb-4 pt-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/90 backdrop-blur-sm text-teal-600 rounded-xl flex items-center justify-center font-bold shadow-lg text-base">
                  4
                </div>
                <div>
                  <CardTitle className="text-lg text-white font-bold tracking-tight">저장된 기록</CardTitle>
                  <p className="text-teal-50 text-xs mt-0.5 font-medium">이전에 작성한 특허 명세서를 확인할 수 있습니다</p>
                </div>
              </div>
              <Button
                onClick={() => router.push("/step1")}
                variant="outline"
                className="flex items-center gap-2 border-2 border-white/30 text-white hover:bg-white/20 font-bold px-4 py-2 h-auto rounded-xl bg-transparent"
              >
                <ArrowLeft className="h-4 w-4" />
                새로 작성
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4 bg-white">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 text-teal-500 animate-spin" />
              </div>
            ) : savedPatents.length === 0 ? (
              <div className="text-center py-20">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-semibold mb-2">저장된 기록이 없습니다</p>
                <p className="text-gray-500 text-sm mb-6">특허 명세서를 작성하고 저장하면 여기에 표시됩니다</p>
                <Button
                  onClick={() => router.push("/step1")}
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold px-6 py-3 rounded-xl"
                >
                  새로 작성하기
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {savedPatents.map((patent) => (
                  <Card
                    key={patent.id}
                    className="border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all rounded-xl"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-lg font-bold text-gray-900 leading-snug">{patent.title}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs border-teal-500 text-teal-700 font-bold rounded-md px-3 py-1">
                                <FileText className="h-3 w-3 mr-1" />
                                초안 {patent.draftCount}개
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(patent.createdAt).toLocaleString("ko-KR")}</span>
                            </div>
                            {patent.keywords.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                <span>{patent.keywords.join(", ")}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleViewDetail(patent.id)}
                            variant="outline"
                            size="sm"
                            className="border-teal-500 text-teal-700 hover:bg-teal-50 font-bold rounded-lg px-4 py-2"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            상세보기
                          </Button>
                          <Button
                            onClick={() => handleDelete(patent.id)}
                            variant="outline"
                            size="sm"
                            disabled={isDeleting === patent.id}
                            className="border-red-500 text-red-700 hover:bg-red-50 font-bold rounded-lg px-4 py-2"
                          >
                            {isDeleting === patent.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            삭제
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="!max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 pr-8 leading-tight mb-4">
              {selectedPatent?.title || "저장된 기록"}
            </DialogTitle>
            <DialogDescription className="sr-only">저장된 특허 명세서 상세 정보</DialogDescription>
          </DialogHeader>
          {selectedPatent && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between pb-4 border-b-2 border-gray-300">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>저장일: {new Date(selectedPatent.createdAt).toLocaleString("ko-KR")}</span>
                  </div>
                </div>
                <Button
                  onClick={() => handleDelete(selectedPatent.id)}
                  variant="outline"
                  size="sm"
                  disabled={isDeleting === selectedPatent.id}
                  className="border-red-500 text-red-700 hover:bg-red-50 font-bold rounded-lg"
                >
                  {isDeleting === selectedPatent.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  삭제
                </Button>
              </div>

              <Tabs defaultValue="step1" className="space-y-4">
                <TabsList className="flex flex-wrap gap-2 bg-gray-100 p-2 rounded-lg">
                  <TabsTrigger value="step1" className="px-4 py-2 text-sm font-bold rounded-lg">
                    정보 입력
                  </TabsTrigger>
                  <TabsTrigger value="step2" className="px-4 py-2 text-sm font-bold rounded-lg">
                    정보 선택
                  </TabsTrigger>
                  <TabsTrigger value="step3" className="px-4 py-2 text-sm font-bold rounded-lg">
                    특허 검색
                  </TabsTrigger>
                  <TabsTrigger value="drafts" className="px-4 py-2 text-sm font-bold rounded-lg">
                    특허 초안 ({selectedPatent.draftVersions.length}개)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="step1" className="space-y-4">
                  <Card className="border-2 border-teal-200">
                    <CardContent className="p-5 space-y-4">
                      <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 block">발명의 명칭</label>
                        <p className="text-base text-gray-900">{selectedPatent.step1Data.inventionTitle || "없음"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 block">발명자</label>
                        <p className="text-base text-gray-900">{selectedPatent.step1Data.inventor || "없음"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 block">출원인</label>
                        <p className="text-base text-gray-900">{selectedPatent.step1Data.applicant || "없음"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 block">발명 메모</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {selectedPatent.step1Data.memoText || "없음"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="step2" className="space-y-4">
                  <Card className="border-2 border-blue-200">
                    <CardContent className="p-5 space-y-4">
                      <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 block">선택된 키워드</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedPatent.step2Data.selectedKeywords.length > 0 ? (
                            selectedPatent.step2Data.selectedKeywords.map((keyword, idx) => (
                              <Badge key={idx} className="bg-teal-500 text-white px-3 py-1 rounded-lg">
                                {keyword}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-500">없음</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 block">기술 분야</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedPatent.step2Data.selectedTechnicalFields.length > 0 ? (
                            selectedPatent.step2Data.selectedTechnicalFields.map((field, idx) => (
                              <Badge key={idx} className="bg-blue-500 text-white px-3 py-1 rounded-lg">
                                {field}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-500">없음</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 block">해결하는 문제점</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedPatent.step2Data.selectedProblems.length > 0 ? (
                            selectedPatent.step2Data.selectedProblems.map((problem, idx) => (
                              <Badge key={idx} className="bg-orange-500 text-white px-3 py-1 rounded-lg">
                                {problem}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-500">없음</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 block">주요 특징</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedPatent.step2Data.selectedFeatures.length > 0 ? (
                            selectedPatent.step2Data.selectedFeatures.map((feature, idx) => (
                              <Badge key={idx} className="bg-purple-500 text-white px-3 py-1 rounded-lg">
                                {feature}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-500">없음</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="step3" className="space-y-4">
                  <Card className="border-2 border-indigo-200">
                    <CardContent className="p-5 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <label className="text-sm font-bold text-gray-700 block">
                            선택된 특허 (
                              {
                                selectedPatent.step3Data.selectedPatents.filter((patentNum) =>
                                  selectedPatent.step2Data.similarPatents?.some(
                                    (p) => p.patentNumber === patentNum
                                  )
                                ).length
                              }
                              개)
                          </label>
                        </div>
                        {(() => {
                          // 검색 결과에 있는 선택된 특허만 필터링
                          const validSelectedPatents = selectedPatent.step3Data.selectedPatents.filter((patentNum) =>
                            selectedPatent.step2Data.similarPatents?.some((p) => p.patentNumber === patentNum)
                          )

                          return validSelectedPatents.length > 0 ? (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-indigo-50">
                                    <TableHead className="font-bold text-gray-900 w-[200px]">출원번호</TableHead>
                                    <TableHead className="font-bold text-gray-900">발명의 명칭</TableHead>
                                    <TableHead className="font-bold text-gray-900 w-[200px]">출원인</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {validSelectedPatents.map((patentNum, idx) => {
                                    // similarPatents에서 해당 특허 번호와 일치하는 특허 찾기
                                    const matchedPatent = selectedPatent.step2Data.similarPatents?.find(
                                      (p) => p.patentNumber === patentNum
                                    )

                                    return (
                                      <TableRow key={idx} className="hover:bg-gray-50">
                                        <TableCell className="font-medium text-gray-900">
                                          {matchedPatent?.patentNumber || patentNum}
                                        </TableCell>
                                        <TableCell className="text-gray-800">{matchedPatent?.title || ""}</TableCell>
                                        <TableCell className="text-gray-800">{matchedPatent?.applicant || ""}</TableCell>
                                      </TableRow>
                                    )
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">선택된 특허가 없습니다</div>
                          )
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="drafts" className="space-y-4">
                  <div className="space-y-4">
                    {selectedPatent.draftVersions.map((draft, idx) => (
                      <Card key={idx} className="border-2 border-emerald-200">
                        <CardHeader className="bg-emerald-50">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-bold text-gray-900">초안 {draft.version}</CardTitle>
                            <span className="text-sm text-gray-600">
                              {new Date(draft.timestamp).toLocaleString("ko-KR")}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="p-5">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                            {cleanContent(draft.content)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

