"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePatentContext } from "@/features/patent/contexts/patent-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, EyeOff, RefreshCw, RotateCcw, Edit3, Save } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function ResultPage() {
  const router = useRouter()
  const {
    draftVersions,
    currentDraftIndex,
    setCurrentDraftIndex,
    activeTab,
    setActiveTab,
    inventionTitle,
    resetAll,
    selectedKeywords,
    selectedTechnicalFields,
    selectedProblems,
    selectedFeatures,
    selectedPatents,
    extractedData,
    inventionTitle: title,
    inventor,
    applicant,
    setDraftVersions,
    memoText,
    similarPatents,
  } = usePatentContext()

  const [viewMode, setViewMode] = useState<"summary" | "full">("full")
  const [userFeedback, setUserFeedback] = useState("")
  const [isRefining, setIsRefining] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (draftVersions.length === 0) {
      router.push("/step1")
    }
  }, [draftVersions, router])

  const getCurrentDraft = () => draftVersions[currentDraftIndex]
  const getCurrentContent = () => getCurrentDraft()?.content || ""

  const cleanContent = (content: string) => {
    if (!content) return content
    return content.replace(/\*\*/g, "").replace(/\*/g, "")
  }

  const parseStructuredSummary = (content: string) => {
    const cleanedContent = cleanContent(content)
    const titleMatch = cleanedContent.match(/발명의\s*명칭[:\s]*(.+?)(?:\n|$)/i)
    const title = titleMatch ? titleMatch[1].trim() : inventionTitle || "제목 없음"

    const abstractMatch = cleanedContent.match(/요약[:\s]*\n([\s\S]*?)(?=\n\n|청구|기술분야|$)/i)
    const abstract = abstractMatch ? abstractMatch[1].trim() : ""

    const claimsSection = cleanedContent.match(/청구항[\s\S]*?(?=\n\n|발명의\s*효과|$)/i)
    const claims: string[] = []
    if (claimsSection) {
      const claimMatches = claimsSection[0].match(/【청구항\s*\d+】[^【]*/g)
      if (claimMatches) {
        claims.push(
          ...claimMatches.slice(0, 3).map((claim) => {
            const text = claim.replace(/【청구항\s*\d+】/, "").trim()
            const firstSentence = text.split(/[.。]/)[0]
            return firstSentence.length > 150 ? firstSentence.substring(0, 150) + "..." : firstSentence
          }),
        )
      }
    }

    const techFieldMatch = cleanedContent.match(/기술\s*분야[:\s]*\n([\s\S]*?)(?=\n\n|배경|$)/i)
    let technicalField = ""
    if (techFieldMatch) {
      const sentences = techFieldMatch[1].trim().split(/[.。]/)
      technicalField = sentences.slice(0, 2).join(". ") + "."
    }

    const problemsMatch = cleanedContent.match(
      /해결하[고자]*\s*하는\s*과제[:\s]*\n([\s\S]*?)(?=\n\n과제의\s*해결|발명의\s*효과|$)/i,
    )
    const problems: string[] = []
    if (problemsMatch) {
      const problemText = problemsMatch[1]
      const problemLines = problemText.split("\n").filter((line) => {
        const trimmed = line.trim()
        return trimmed.match(/^[\d\-•]/) || trimmed.length > 20
      })
      problems.push(...problemLines.slice(0, 3).map((p) => p.replace(/^[\d\-•.\s]+/, "").trim()))
    }

    const effectsMatch = cleanedContent.match(/발명의\s*효과[:\s]*\n([\s\S]*?)(?=\n\n|청구|$)/i)
    const effects: string[] = []
    if (effectsMatch) {
      const effectText = effectsMatch[1]
      const effectLines = effectText.split("\n").filter((line) => {
        const trimmed = line.trim()
        return trimmed.match(/^[\d\-•]/) || trimmed.length > 20
      })
      effects.push(...effectLines.slice(0, 3).map((e) => e.replace(/^[\d\-•.\s]+/, "").trim()))
    }

    return {
      title,
      abstract,
      claims,
      technicalField,
      problems,
      effects,
    }
  }

  const handleDownload = () => {
    const contentToDownload = getCurrentContent()
    if (!contentToDownload) {
      return
    }

    const blob = new Blob([contentToDownload], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${inventionTitle || "특허명세서"}_${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleRefineDraft = async () => {
    if (!userFeedback.trim()) {
      return
    }

    const currentDraft = getCurrentDraft()
    if (!currentDraft) return

    setIsRefining(true)
    const newVersion = currentDraft.version + 1

    try {
      const generateResponse = await fetch("/api/patent/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: selectedKeywords.join(", "),
          inventionTitle: title,
          inventor,
          applicant,
          mode: "refine",
          previousDraft: currentDraft.content,
          userFeedback: userFeedback,
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
        }),
      })

      const generateData = await generateResponse.json()

      if (!generateResponse.ok) {
        alert("초안 수정 중 오류가 발생했습니다.")
        return
      }

      const newDraft = {
        version: newVersion,
        content: generateData.result,
        timestamp: new Date(),
        feedbackUsed: userFeedback,
      }

      setDraftVersions((prev) => [...prev, newDraft])
      setCurrentDraftIndex(draftVersions.length)
      setActiveTab(`draft-${newVersion}`)

      setUserFeedback("")
    } catch (error) {
      console.error("Error:", error)
      alert("초안 수정 중 오류가 발생했습니다.")
    } finally {
      setIsRefining(false)
    }
  }

  const handleConfirmReset = () => {
    resetAll()
    setShowResetDialog(false)
    router.push("/step1")
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const saveResponse = await fetch("/api/patent/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step1Data: {
            memoText,
            inventionTitle: title,
            inventor,
            applicant,
            extractedData,
          },
          step2Data: {
            selectedKeywords,
            selectedTechnicalFields,
            selectedProblems,
            selectedFeatures,
            similarPatents,
          },
          step3Data: {
            selectedPatents,
          },
          draftVersions,
        }),
      })

      const saveData = await saveResponse.json()

      if (!saveResponse.ok) {
        alert("저장 중 오류가 발생했습니다: " + (saveData.error || "알 수 없는 오류"))
        return
      }

      alert("저장되었습니다!")
      router.push("/step4")
    } catch (error) {
      console.error("Error:", error)
      alert("저장 중 오류가 발생했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  if (draftVersions.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
      <div className="bg-white border-b-2 border-teal-500 shadow-md">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">특허 명세서 초안</h1>
              <p className="text-sm text-gray-600 mt-1">AI가 생성한 특허 명세서를 확인하고 수정할 수 있습니다</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold px-6 py-3 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Save className="h-5 w-5" />
                {isSaving ? "저장 중..." : "저장하기"}
              </Button>
              <Button
                onClick={() => router.push("/step1")}
                variant="outline"
                className="flex items-center gap-2 border-2 border-teal-500 text-teal-700 hover:bg-teal-50 font-bold px-6 py-3 h-auto rounded-xl bg-transparent"
              >
                <Edit3 className="h-5 w-5" />
                처음부터 다시
              </Button>
              <Button
                onClick={() => setShowResetDialog(true)}
                variant="outline"
                className="flex items-center gap-2 border-2 border-red-500 text-red-700 hover:bg-red-50 font-bold px-6 py-3 h-auto rounded-xl bg-transparent"
              >
                <RotateCcw className="h-5 w-5" />
                초기화
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <Card className="shadow-lg border border-gray-200 rounded-2xl">
          <CardContent className="p-8">
            {draftVersions.length > 0 ? (
              <div className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="flex flex-wrap gap-2 bg-gray-100 p-2 rounded-lg">
                    {draftVersions.map((draft, index) => (
                      <TabsTrigger
                        key={`draft-${draft.version}`}
                        value={`draft-${draft.version}`}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-teal-700 rounded-lg transition-all"
                        onClick={() => setCurrentDraftIndex(index)}
                      >
                        초안 {draft.version}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {draftVersions.map((draft, index) => (
                    <TabsContent key={`draft-${draft.version}`} value={`draft-${draft.version}`} className="space-y-6 mt-6">
                      <div className="bg-teal-50 border border-teal-200 p-5 rounded-xl flex items-center justify-between">
                        <span className="font-bold text-teal-800 text-base">초안 {draft.version}</span>
                        <span className="text-gray-600 text-sm">
                          {new Date(draft.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewMode(viewMode === "summary" ? "full" : "summary")}
                          className="text-sm border-2 border-teal-400 hover:bg-teal-50 rounded-lg font-bold text-teal-600 shadow-sm hover:shadow-md transition-all"
                        >
                          {viewMode === "full" ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              요약보기
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              전체보기
                            </>
                          )}
                        </Button>
                      </div>

                      <div>
                        {viewMode === "full" ? (
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 min-h-[400px] text-base whitespace-pre-wrap leading-relaxed text-gray-800">
                            {cleanContent(draft.content)}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-l-4 border-teal-500 p-6 rounded-lg">
                              <h3 className="text-xl font-bold text-gray-900 mb-2">📋 특허 명세서 구조화 요약</h3>
                              <p className="text-sm text-gray-600">
                                핵심 내용을 구조화하여 한눈에 파악할 수 있도록 정리했습니다.
                              </p>
                            </div>

                            {(() => {
                              const summary = parseStructuredSummary(draft.content)
                              return (
                                <div className="space-y-5">
                                  <Card className="border-2 border-teal-200 shadow-md rounded-xl">
                                    <CardContent className="p-6">
                                      <div className="flex items-center gap-3 mb-4">
                                        <Badge className="bg-teal-500 text-white text-sm font-bold px-4 py-1.5 rounded-lg">
                                          발명의 명칭
                                        </Badge>
                                      </div>
                                      <h2 className="text-2xl font-bold text-gray-900 leading-relaxed">{summary.title}</h2>
                                    </CardContent>
                                  </Card>

                                  {summary.abstract && (
                                    <Card className="border-2 border-blue-200 shadow-md rounded-xl">
                                      <CardContent className="p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                          <Badge className="bg-blue-500 text-white text-sm font-bold px-4 py-1.5 rounded-lg">
                                            요약
                                          </Badge>
                                        </div>
                                        <p className="text-base text-gray-800 leading-relaxed">{summary.abstract}</p>
                                      </CardContent>
                                    </Card>
                                  )}

                                  {summary.claims.length > 0 && (
                                    <Card className="border-2 border-indigo-200 shadow-md rounded-xl">
                                      <CardContent className="p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                          <Badge className="bg-indigo-500 text-white text-sm font-bold px-4 py-1.5 rounded-lg">
                                            핵심 청구항 (1-3개)
                                          </Badge>
                                        </div>
                                        <div className="space-y-3">
                                          {summary.claims.map((claim, idx) => (
                                            <div key={idx} className="flex gap-3">
                                              <span className="text-indigo-600 font-bold flex-shrink-0">{idx + 1}.</span>
                                              <p className="text-base text-gray-800 leading-relaxed">{claim}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )}
                                </div>
                              )
                            })()}
                          </div>
                        )}
                      </div>

                      {currentDraftIndex === index && (
                        <>
                          <div className="pt-6 border-t border-gray-200">
                            <Button
                              onClick={handleDownload}
                              className="w-full h-14 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all rounded-xl"
                            >
                              <Download className="h-5 w-5 mr-2" />
                              다운로드
                            </Button>
                          </div>

                          <div className="space-y-4 pt-6 border-t border-gray-200">
                            <label className="text-base font-bold text-gray-900">초안 수정 요청</label>
                            <Textarea
                              placeholder="수정하고 싶은 내용을 입력하세요..."
                              value={userFeedback}
                              onChange={(e) => setUserFeedback(e.target.value)}
                              className="min-h-[120px] text-base border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 leading-relaxed rounded-xl transition-all"
                              disabled={isRefining}
                            />
                            <Button
                              onClick={handleRefineDraft}
                              disabled={!userFeedback.trim() || isRefining}
                              className="w-full h-14 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all rounded-xl"
                            >
                              <RefreshCw className="h-5 w-5 mr-2" />
                              {isRefining ? "수정 중..." : "초안 수정하기"}
                            </Button>
                          </div>
                        </>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">모든 내용을 초기화하시겠습니까?</DialogTitle>
            <DialogDescription className="text-base text-gray-600 pt-4">
              입력한 모든 정보와 생성된 초안이 삭제됩니다.
              <br />
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-6">
            <Button
              onClick={() => setShowResetDialog(false)}
              variant="outline"
              className="flex-1 h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-bold rounded-xl"
            >
              취소
            </Button>
            <Button
              onClick={handleConfirmReset}
              className="flex-1 h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl"
            >
              초기화
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

