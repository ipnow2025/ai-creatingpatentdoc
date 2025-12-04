"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Sparkles,
  Download,
  CheckCircle,
  FileText,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Lock,
  ArrowRight,
  ExternalLink,
  Edit3,
  RotateCcw,
} from "lucide-react"
import { useState, useEffect } from "react"

import type { DraftVersion } from "@/features/patent/types/draft.types";
import type { ExtractedData } from "@/features/patent/types/extraction.types";
import type { Patent } from "@/features/patent/types/patent.types";

export function MainContent() {
  const [memoText, setMemoText] = useState("")
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [selectedTechnicalFields, setSelectedTechnicalFields] = useState<string[]>([])
  const [selectedProblems, setSelectedProblems] = useState<string[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  const [similarPatents, setSimilarPatents] = useState<Patent[]>([])
  const [selectedPatents, setSelectedPatents] = useState<string[]>([])

  const [inventionTitle, setInventionTitle] = useState("")
  const [inventor, setInventor] = useState("")
  const [applicant, setApplicant] = useState("")

  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState("")
  const [draftVersions, setDraftVersions] = useState<DraftVersion[]>([])
  const [currentDraftIndex, setCurrentDraftIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<string>("draft-1")
  const [viewMode, setViewMode] = useState<"summary" | "full">("full")

  const [editingItem, setEditingItem] = useState<{ type: string; index: number } | null>(null)
  const [editingValue, setEditingValue] = useState("")

  const [userFeedback, setUserFeedback] = useState("")
  const [isRefining, setIsRefining] = useState(false)

  const [hoveredPatent, setHoveredPatent] = useState<Patent | null>(null)

  const [isLoadingStep2, setIsLoadingStep2] = useState(false)
  const [isLoadingStep3, setIsLoadingStep3] = useState(false)

  const [selectedPatentDetail, setSelectedPatentDetail] = useState<Patent | null>(null)
  const [isPatentModalOpen, setIsPatentModalOpen] = useState(false)

  const [viewState, setViewState] = useState<"input" | "results">("input")
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)

  const [isEditMode, setIsEditMode] = useState(false)
  const [hasEdits, setHasEdits] = useState(false)
  const [originalMemoText, setOriginalMemoText] = useState("")
  const [originalSelectedKeywords, setOriginalSelectedKeywords] = useState<string[]>([])
  const [originalSelectedPatents, setOriginalSelectedPatents] = useState<string[]>([])

  const [expandedSection, setExpandedSection] = useState<number | null>(null)

  const [editModeData, setEditModeData] = useState<{
    memoText: string
    extractedData: ExtractedData | null
    selectedKeywords: string[]
    selectedTechnicalFields: string[]
    selectedProblems: string[]
    selectedFeatures: string[]
    selectedPatents: string[]
    inventionTitle: string
    inventor: string
    applicant: string
  } | null>(null)

  useEffect(() => {
    if (isEditMode && editModeData) {
      console.log("[v0] Restoring edit mode data:", editModeData)
      setMemoText(editModeData.memoText)
      setExtractedData(editModeData.extractedData)
      setSelectedKeywords(editModeData.selectedKeywords)
      setSelectedTechnicalFields(editModeData.selectedTechnicalFields)
      setSelectedProblems(editModeData.selectedProblems)
      setSelectedFeatures(editModeData.selectedFeatures)
      setSelectedPatents(editModeData.selectedPatents)
      setInventionTitle(editModeData.inventionTitle)
      setInventor(editModeData.inventor)
      setApplicant(editModeData.applicant)
    }
  }, [isEditMode])

  const getCurrentDraft = () => draftVersions[currentDraftIndex]
  const getCurrentContent = () => getCurrentDraft()?.content || ""

  const cleanContent = (content: string) => {
    if (!content) return content
    return content.replace(/\*\*/g, "").replace(/\*/g, "")
  }

  const parseDraftSections = (content: string) => {
    const cleanedContent = cleanContent(content)
    const lines = cleanedContent.split("\n")
    const sectionsInOrder: Array<{ title: string; content: string; color: string }> = []
    let currentSection: { title: string; content: string; color: string } | null = null

    for (const line of lines) {
      const trimmedLine = line.trim()

      if (trimmedLine.includes("기술분야") || trimmedLine.includes("기술 분야")) {
        if (currentSection) sectionsInOrder.push(currentSection)
        currentSection = { title: "기술분야", content: "", color: "blue" }
      } else if (trimmedLine.includes("배경기술") || trimmedLine.includes("발명의 배경")) {
        if (currentSection) sectionsInOrder.push(currentSection)
        currentSection = { title: "발명배경", content: "", color: "green" }
      } else if (
        trimmedLine.includes("구성요소") ||
        trimmedLine.includes("주요 구성") ||
        trimmedLine.includes("시스템 구성") ||
        trimmedLine.includes("장치 구성")
      ) {
        if (currentSection) sectionsInOrder.push(currentSection)
        currentSection = { title: "구성요소", content: "", color: "cyan" }
      } else if (
        trimmedLine.includes("발명의 내용") ||
        trimmedLine.includes("발명 내용") ||
        trimmedLine.includes("구체적인 내용") ||
        trimmedLine.includes("실시예")
      ) {
        if (currentSection) sectionsInOrder.push(currentSection)
        currentSection = { title: "발명내용", content: "", color: "teal" }
      } else if (trimmedLine.includes("해결하고자 하는 과제") || trimmedLine.includes("해결과제")) {
        if (currentSection) sectionsInOrder.push(currentSection)
        currentSection = { title: "해결과제", content: "", color: "orange" }
      } else if (
        trimmedLine.includes("과제의 해결 수단") ||
        trimmedLine.includes("해결 수단") ||
        trimmedLine.includes("발명의 구성")
      ) {
        if (currentSection) sectionsInOrder.push(currentSection)
        currentSection = { title: "해결수단", content: "", color: "purple" }
      } else if (trimmedLine.includes("발명의 효과") || trimmedLine.includes("효과")) {
        if (currentSection) sectionsInOrder.push(currentSection)
        currentSection = { title: "발명효과", content: "", color: "red" }
      } else if (trimmedLine.includes("청구항") || trimmedLine.includes("특허청구범위")) {
        if (currentSection) sectionsInOrder.push(currentSection)
        currentSection = { title: "청구항", content: "", color: "indigo" }
      } else if (trimmedLine.includes("요약")) {
        if (currentSection) sectionsInOrder.push(currentSection)
        currentSection = { title: "요약", content: "", color: "gray" }
      } else {
        if (currentSection) {
          currentSection.content += line + "\n"
        }
      }
    }

    if (currentSection) sectionsInOrder.push(currentSection)

    const createSummary = (text: string, sectionTitle: string) => {
      if (!text) return ""
      const cleaned = text.trim()

      // Special handling for claims section - extract first 3-5 claims
      if (sectionTitle === "청구항") {
        const claimMatches = cleaned.match(/【청구항\s*\d+】[^【]*/g)
        if (claimMatches && claimMatches.length > 0) {
          const claimsToShow = claimMatches.slice(0, 5)
          return claimsToShow
            .map((claim) => {
              // Extract claim number and first sentence
              const claimText = claim.replace(/【청구항\s*\d+】/, "").trim()
              const firstSentence = claimText.split(/[.。]/)[0]
              return `• ${firstSentence}...`
            })
            .join("\n")
        }
      }

      // For other sections, create a more readable summary
      const sentences = cleaned.split(/[.。]/).filter((s) => s.trim().length > 0)
      if (sentences.length === 0) return cleaned.substring(0, 200) + "..."

      // Take first 2-3 sentences for a better summary
      const summaryText = sentences.slice(0, 3).join(". ") + "."
      return summaryText.length > 300 ? summaryText.substring(0, 300) + "..." : summaryText
    }

    return sectionsInOrder
      .filter((section) => section.content.trim().length > 0)
      .map((section) => ({
        ...section,
        content: createSummary(section.content, section.title),
      }))
  }

  // Added parseStructuredSummary function
  const parseStructuredSummary = (content: string) => {
    const cleanedContent = cleanContent(content)
    const lines = cleanedContent.split("\n")

    // Extract invention title (first non-empty line or from header)
    const titleMatch = cleanedContent.match(/발명의\s*명칭[:\s]*(.+?)(?:\n|$)/i)
    const title = titleMatch ? titleMatch[1].trim() : inventionTitle || "제목 없음"

    // Extract abstract section
    const abstractMatch = cleanedContent.match(/요약[:\s]*\n([\s\S]*?)(?=\n\n|청구|기술분야|$)/i)
    const abstract = abstractMatch ? abstractMatch[1].trim() : ""

    // Extract claims - find first 3 claims
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

    // Extract technical field - first 1-2 sentences
    const techFieldMatch = cleanedContent.match(/기술\s*분야[:\s]*\n([\s\S]*?)(?=\n\n|배경|$)/i)
    let technicalField = ""
    if (techFieldMatch) {
      const sentences = techFieldMatch[1].trim().split(/[.。]/)
      technicalField = sentences.slice(0, 2).join(". ") + "."
    }

    // Extract problems - look for numbered or bulleted problems
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

    // Extract effects - look for numbered or bulleted effects
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

  const handleMemoSubmit = async () => {
    if (!memoText.trim()) {
      return
    }

    setIsProcessing(true)
    setIsLoadingStep2(true)
    setProcessingMessage("메모를 분석하는 중...")

    try {
      const extractResponse = await fetch("/api/patent/extract-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: memoText }),
      })

      const extractData = await extractResponse.json()

      if (!extractResponse.ok) {
        return
      }

      setExtractedData(extractData)
      setSelectedKeywords(extractData.keywords || [])
      setSelectedTechnicalFields(extractData.technicalField || [])
      setSelectedProblems(extractData.problems || [])
      setSelectedFeatures(extractData.features || [])
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setIsProcessing(false)
      setIsLoadingStep2(false)
      setProcessingMessage("")
    }
  }

  const handleSelectInfoAndSearch = async () => {
    if (!extractedData) {
      return
    }

    setIsProcessing(true)
    setIsLoadingStep3(true)
    setProcessingMessage("유사 특허를 검색하는 중...")

    try {
      const searchResponse = await fetch("/api/patent/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: selectedKeywords }),
      })

      const searchData = await searchResponse.json()

      if (!searchResponse.ok) {
        return
      }

      setSimilarPatents(searchData.patents || [])
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setIsProcessing(false)
      setIsLoadingStep3(false)
      setProcessingMessage("")
    }
  }

  const handleGenerateDraft1 = async () => {
    if (!extractedData) {
      return
    }

    if (selectedPatents.length === 0) {
      return
    }

    setIsGeneratingDraft(true)
    setIsProcessing(true)
    setProcessingMessage("모든 정보를 종합하여 초안 1을 생성하는 중...")

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
          structuredData: {
            technicalField: selectedTechnicalFields,
            problem: extractedData.problem,
            solution: extractedData.solution,
            effects: extractedData.effects || [],
            components: extractedData.components || [],
            problems: selectedProblems,
            features: selectedFeatures,
          },
          referencePatents: selectedPatentData,
        }),
      })

      const generateData = await generateResponse.json()

      if (!generateResponse.ok) {
        return
      }

      const newDraft: DraftVersion = {
        version: 1,
        content: generateData.result,
        timestamp: new Date(),
      }
      setDraftVersions([newDraft])
      setCurrentDraftIndex(0)
      setActiveTab("draft-1")

      setViewState("results")
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setIsProcessing(false)
      setIsGeneratingDraft(false)
      setProcessingMessage("")
    }
  }

  const handleGenerateDraft2 = async () => {
    if (!extractedData) {
      alert("먼저 메모를 입력하고 초안 1을 생성해주세요.")
      return
    }

    setIsProcessing(true)
    setProcessingMessage("선택한 정보로 초안 2를 생성하는 중...")

    try {
      const generateResponse = await fetch("/api/patent/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: selectedKeywords.join(", "),
          inventionTitle,
          inventor,
          applicant,
          mode: "memo",
          structuredData: {
            technicalField: selectedTechnicalFields,
            problem: extractedData.problem,
            solution: extractedData.solution,
            effects: extractedData.effects || [],
            components: extractedData.components || [],
            problems: selectedProblems,
            features: selectedFeatures,
          },
        }),
      })

      const generateData = await generateResponse.json()

      if (!generateResponse.ok) {
        if (generateData.errorType === "quota_exceeded") {
          alert(
            "일일 사용 한도를 초과했습니다.\n\n" +
              (generateData.retryAfter
                ? `${generateData.retryAfter} 후에 다시 시도해주세요.`
                : "내일 다시 시도해주세요.") +
              "\n\n💡 무료 계정은 하루 50회까지 사용 가능합니다.",
          )
        } else if (generateData.errorType === "network_error") {
          alert("인터넷 연결이 불안정합니다.\n\n" + "Wi-Fi 또는 데이터 연결을 확인하고 다시 시도해주세요.")
        } else if (generateData.errorType === "forbidden") {
          alert("서비스 인증에 문제가 있습니다.\n\n" + "페이지를 새로고침하고 다시 시도해주세요.")
        } else {
          alert(
            "명세서 생성 중 문제가 발생했습니다.\n\n" +
              "잠시 후 다시 시도해주세요. 문제가 계속되면 입력 내용을 확인해주세요.",
          )
        }
        return
      }

      const newDraft: DraftVersion = {
        version: 2,
        content: generateData.result,
        timestamp: new Date(),
      }
      setDraftVersions((prev) => [...prev, newDraft])
      setCurrentDraftIndex(1)
      setActiveTab("draft-2")

      setProcessingMessage("유사 특허를 검색하는 중...")

      const searchResponse = await fetch("/api/patent/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: selectedKeywords }),
      })

      const searchData = await searchResponse.json()

      if (!searchResponse.ok) {
        // Don't block the flow if patent search fails, just show a warning
        console.error("[v0] Patent search failed:", searchData)
        alert("초안 2는 생성되었으나 특허 검색 중 문제가 발생했습니다.\n\n나중에 다시 시도해주세요.")
      } else {
        setSimilarPatents(searchData.patents || [])
      }
    } catch (error) {
      console.error("[v0] Error:", error)
      alert("초안 2 생성 중 오류가 발생했습니다.")
    } finally {
      setIsProcessing(false)
      setProcessingMessage("")
    }
  }

  const handleSearchAndGenerateDraft3 = async () => {
    if (selectedKeywords.length === 0) {
      alert("먼저 키워드를 선택해주세요.")
      return
    }

    setIsProcessing(true)
    setProcessingMessage("유사 특허를 검색하는 중...")

    try {
      const searchResponse = await fetch("/api/patent/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: selectedKeywords }),
      })

      const searchData = await searchResponse.json()

      if (!searchResponse.ok) {
        if (searchData.errorType === "quota_exceeded") {
          alert("일일 사용 한도를 초과했습니다.\n\n" + "잠시 후 다시 시도해주세요.")
        } else if (searchData.errorType === "network_error") {
          alert("인터넷 연결이 불안정합니다.\n\n" + "연결을 확인하고 다시 시도해주세요.")
        } else {
          alert("특허 검색 중 문제가 발생했습니다.\n\n" + "잠시 후 다시 시도해주세요.")
        }
        return
      }

      setSimilarPatents(searchData.patents || [])
      setIsProcessing(false)
      setProcessingMessage("")
    } catch (error) {
      console.error("[v0] Error:", error)
      alert("특허 검색 중 오류가 발생했습니다.")
      setIsProcessing(false)
      setProcessingMessage("")
    }
  }

  const handleGenerateDraft3 = async () => {
    if (selectedPatents.length === 0) {
      alert("참고할 특허를 1개 이상 선택해주세요.")
      return
    }

    setIsProcessing(true)
    setProcessingMessage("선택한 특허를 참고하여 초안 3을 생성하는 중...")

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
        if (generateData.errorType === "quota_exceeded") {
          alert(
            "일일 사용 한도를 초과했습니다.\n\n" +
              (generateData.retryAfter
                ? `${generateData.retryAfter} 후에 다시 시도해주세요.`
                : "내일 다시 시도해주세요.") +
              "\n\n💡 무료 계정은 하루 50회까지 사용 가능합니다.",
          )
        } else if (generateData.errorType === "network_error") {
          alert("인터넷 연결이 불안정합니다.\n\n" + "Wi-Fi 또는 데이터 연결을 확인하고 다시 시도해주세요.")
        } else if (generateData.errorType === "forbidden") {
          alert("서비스 인증에 문제가 있습니다.\n\n" + "페이지를 새로고침하고 다시 시도해주세요.")
        } else {
          alert(
            "명세서 생성 중 문제가 발생했습니다.\n\n" +
              "잠시 후 다시 시도해주세요. 문제가 계속되면 입력 내용을 확인해주세요.",
          )
        }
        return
      }

      const newDraft: DraftVersion = {
        version: 3,
        content: generateData.result,
        timestamp: new Date(),
      }
      setDraftVersions((prev) => [...prev, newDraft])
      setCurrentDraftIndex(2)
      setActiveTab("draft-3")
    } catch (error) {
      console.error("[v0] Error:", error)
      alert("초안 3 생성 중 오류가 발생했습니다.")
    } finally {
      setIsProcessing(false)
      setProcessingMessage("")
    }
  }

  const handleRefineDraft = async () => {
    if (!userFeedback.trim()) {
      return
    }

    const currentDraft = getCurrentDraft()
    if (!currentDraft) return

    setIsRefining(true)
    const newVersion = currentDraft.version + 1
    setProcessingMessage(`사용자 피드백을 반영하여 초안 ${newVersion}을 생성하는 중...`)

    try {
      const generateResponse = await fetch("/api/patent/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: selectedKeywords.join(", "),
          inventionTitle,
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
        return
      }

      const newDraft: DraftVersion = {
        version: newVersion,
        content: generateData.result,
        timestamp: new Date(),
        feedbackUsed: userFeedback,
      }

      setDraftVersions((prev) => [...prev, newDraft])
      const newIndex = draftVersions.length
      setCurrentDraftIndex(newIndex)
      setActiveTab(`draft-${newVersion}`)

      setUserFeedback("")
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setIsRefining(false)
      setProcessingMessage("")
    }
  }

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords((prev) => {
      const newKeywords = prev.includes(keyword) ? prev.filter((k) => k !== keyword) : [...prev, keyword]
      if (isEditMode && JSON.stringify(newKeywords) !== JSON.stringify(originalSelectedKeywords)) {
        setHasEdits(true)
      }
      return newKeywords
    })
  }

  const toggleTechnicalField = (field: string) => {
    setSelectedTechnicalFields((prev) => (prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]))
    if (isEditMode) setHasEdits(true)
  }

  const toggleProblem = (problem: string) => {
    setSelectedProblems((prev) => (prev.includes(problem) ? prev.filter((p) => p !== problem) : [...prev, problem]))
    if (isEditMode) setHasEdits(true)
  }

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) => (prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]))
    if (isEditMode) setHasEdits(true)
  }

  const togglePatentSelection = (patentNumber: string) => {
    setSelectedPatents((prev) => {
      const newPatents = prev.includes(patentNumber) ? prev.filter((p) => p !== patentNumber) : [...prev, patentNumber]
      if (isEditMode && JSON.stringify(newPatents) !== JSON.stringify(originalSelectedPatents)) {
        setHasEdits(true)
      }
      return newPatents
    })
  }

  // Add handler to open patent detail modal
  const handleViewPatentDetail = (patent: Patent, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click from toggling selection
    setSelectedPatentDetail(patent)
    setIsPatentModalOpen(true)
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

  const handleBackToInput = () => {
    setViewState("input")
  }

  const handleEditMode = () => {
    const currentData = {
      memoText,
      extractedData,
      selectedKeywords,
      selectedTechnicalFields,
      selectedProblems,
      selectedFeatures,
      selectedPatents,
      inventionTitle,
      inventor,
      applicant,
    }

    console.log("[v0] Saving data for edit mode:", currentData)

    setEditModeData(currentData)
    setIsEditMode(true)
    setHasEdits(false)
    setOriginalMemoText(memoText)
    setOriginalSelectedKeywords([...selectedKeywords])
    setOriginalSelectedPatents([...selectedPatents])
    setExpandedSection(null)
    setViewState("input")
  }

  const handleBackToResults = () => {
    setIsEditMode(false)
    setHasEdits(false)
    setEditModeData(null) // Clear edit mode data when exiting
    setViewState("results")
  }

  const handleRegenerateAfterEdit = async () => {
    if (!extractedData) {
      return
    }

    if (selectedPatents.length === 0) {
      return
    }

    setIsGeneratingDraft(true)
    setIsProcessing(true)
    const nextVersion = draftVersions.length + 1
    setProcessingMessage(`수정된 정보로 초안 ${nextVersion}을 생성하는 중...`)

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
          structuredData: {
            technicalField: selectedTechnicalFields,
            problem: extractedData.problem,
            solution: extractedData.solution,
            effects: extractedData.effects || [],
            components: extractedData.components || [],
            problems: selectedProblems,
            features: selectedFeatures,
          },
          referencePatents: selectedPatentData,
        }),
      })

      const generateData = await generateResponse.json()

      if (!generateResponse.ok) {
        return
      }

      const newDraft: DraftVersion = {
        version: nextVersion,
        content: generateData.result,
        timestamp: new Date(),
      }
      setDraftVersions((prev) => [...prev, newDraft])
      setCurrentDraftIndex(draftVersions.length)
      setActiveTab(`draft-${nextVersion}`)

      setIsEditMode(false)
      setHasEdits(false)
      setEditModeData(null) // Clear edit mode data after successful regeneration
      setViewState("results")
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setIsProcessing(false)
      setIsGeneratingDraft(false)
      setProcessingMessage("")
    }
  }

  const handleResetWithConfirmation = () => {
    setShowResetDialog(true)
  }

  const handleConfirmReset = () => {
    // Reset all state to initial values
    setMemoText("")
    setExtractedData(null)
    setSelectedKeywords([])
    setSelectedTechnicalFields([])
    setSelectedProblems([])
    setSelectedFeatures([])
    setSimilarPatents([])
    setSelectedPatents([])
    setInventionTitle("")
    setInventor("")
    setApplicant("")
    setDraftVersions([])
    setCurrentDraftIndex(0)
    setActiveTab("draft-1")
    setUserFeedback("")
    setViewState("input")
    setIsEditMode(false)
    setHasEdits(false)
    setOriginalMemoText("")
    setOriginalSelectedKeywords([])
    setOriginalSelectedPatents([])
    setEditModeData(null) // Reset edit mode data
    setShowResetDialog(false)
  }

  const handleMemoTextChange = (newText: string) => {
    setMemoText(newText)
    if (isEditMode && newText !== originalMemoText) {
      setHasEdits(true)
    }
  }

  const toggleSectionExpansion = (sectionNumber: number) => {
    if (isEditMode) {
      setExpandedSection(expandedSection === sectionNumber ? null : sectionNumber)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
      {isGeneratingDraft && (
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
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {viewState === "input" && (
        <div className="bg-white border-b-2 border-teal-500 shadow-md">
          <div className="max-w-7xl mx-auto px-8 py-6">
            {isEditMode ? (
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">편집 모드</h1>
                  <p className="text-sm text-gray-600 mt-1">입력 내용을 수정하고 새로운 초안을 생성할 수 있습니다</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleBackToResults}
                    variant="outline"
                    className="flex items-center gap-2 border-2 border-gray-400 text-gray-700 hover:bg-gray-50 font-bold px-6 py-3 h-auto rounded-xl bg-transparent"
                  >
                    <ArrowRight className="h-5 w-5 rotate-180" />
                    결과 화면으로 돌아가기
                  </Button>
                  {hasEdits && (
                    <Button
                      onClick={handleRegenerateAfterEdit}
                      className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold px-6 py-3 h-auto rounded-xl"
                    >
                      <Sparkles className="h-5 w-5" />
                      특허명세서 생성하기
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">AI 직무발명신고서</h1>

                <div className="flex items-center gap-6 max-w-5xl">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all shadow-md ${
                        extractedData
                          ? "bg-gradient-to-br from-teal-500 to-emerald-600 text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      1
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">정보 입력</div>
                      <div className="text-xs text-gray-600">발명 내용 작성</div>
                    </div>
                  </div>

                  <div className="flex-1 flex items-center gap-3">
                    <div
                      className={`flex-1 h-1.5 rounded-full transition-all ${
                        extractedData ? "bg-gradient-to-r from-teal-500 to-emerald-500" : "bg-gray-200"
                      }`}
                    />
                    <ArrowRight
                      className={`w-5 h-5 transition-all ${extractedData ? "text-teal-600" : "text-gray-300"}`}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all shadow-md ${
                        similarPatents.length > 0
                          ? "bg-gradient-to-br from-teal-500 to-emerald-600 text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      2
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">정보 선택</div>
                      <div className="text-xs text-gray-600">키워드 및 분야</div>
                    </div>
                  </div>

                  <div className="flex-1 flex items-center gap-3">
                    <div
                      className={`flex-1 h-1.5 rounded-full transition-all ${
                        similarPatents.length > 0 ? "bg-gradient-to-r from-teal-500 to-emerald-500" : "bg-gray-200"
                      }`}
                    />
                    <ArrowRight
                      className={`w-5 h-5 transition-all ${similarPatents.length > 0 ? "text-teal-600" : "text-gray-300"}`}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all shadow-md ${
                        draftVersions.length > 0
                          ? "bg-gradient-to-br from-teal-500 to-emerald-600 text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      3
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">특허 검색</div>
                      <div className="text-xs text-gray-600">유사 특허 분석</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {viewState === "results" && (
        <div className="bg-white border-b-2 border-teal-500 shadow-md">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">특허 명세서 초안</h1>
                <p className="text-sm text-gray-600 mt-1">AI가 생성한 특허 명세서를 확인하고 수정할 수 있습니다</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleEditMode}
                  variant="outline"
                  className="flex items-center gap-2 border-2 border-teal-500 text-teal-700 hover:bg-teal-50 font-bold px-6 py-3 h-auto rounded-xl bg-transparent"
                >
                  <Edit3 className="h-5 w-5" />
                  편집 모드
                </Button>
                <Button
                  onClick={handleResetWithConfirmation}
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
      )}

      <div className="max-w-7xl mx-auto px-8 py-10">
        {viewState === "input" ? (
          <div className="flex gap-4">
            {/* Step 1: Memo Input */}
            <Card
              className={`shadow-lg border border-gray-200 overflow-hidden rounded-2xl hover:shadow-xl transition-all ${
                !extractedData || (isEditMode && expandedSection === 1) ? "flex-[2]" : "flex-[0.5]"
              }`}
            >
              <CardHeader
                className={`bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 pb-4 pt-4 ${
                  isEditMode && extractedData ? "cursor-pointer" : ""
                }`}
                onClick={() => toggleSectionExpansion(1)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/90 backdrop-blur-sm text-teal-600 rounded-xl flex items-center justify-center font-bold shadow-lg text-base">
                      1
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white font-bold tracking-tight">정보 입력</CardTitle>
                      {!extractedData && <p className="text-teal-50 text-xs mt-0.5 font-medium">발명 내용 작성</p>}
                    </div>
                  </div>
                  {extractedData && (
                    <Badge className="bg-white/95 text-teal-700 border-0 font-bold px-3 py-1 rounded-full shadow-lg text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      완료
                    </Badge>
                  )}
                </div>
                {!extractedData && (
                  <p className="text-white/95 text-xs leading-relaxed pl-13">
                    발명하고 싶은 내용을 자유롭게 작성하세요
                  </p>
                )}
              </CardHeader>
              {!extractedData || (isEditMode && expandedSection === 1) ? (
                <CardContent className="p-6 space-y-5 bg-white">
                  {console.log("[v0] Rendering section 1 with memoText:", memoText)}

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
                      onChange={(e) => handleMemoTextChange(e.target.value)}
                      className="min-h-[200px] text-sm border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 leading-relaxed rounded-xl transition-all"
                    />
                    {!isEditMode && (
                      <Button
                        onClick={handleMemoSubmit}
                        disabled={!memoText.trim() || isProcessing}
                        className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all rounded-xl"
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        {isProcessing ? "분석 중..." : "정보 추출하기"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              ) : (
                <CardContent className="p-4 bg-white">
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="font-semibold text-gray-900">{inventionTitle || "제목 없음"}</p>
                    <p className="text-gray-500 line-clamp-2">{memoText.substring(0, 100)}...</p>
                    {isEditMode && <p className="text-teal-600 font-semibold pt-1">클릭하여 수정하기</p>}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Step 2: Core Info Selection */}
            <Card
              className={`shadow-lg border border-gray-200 overflow-hidden rounded-2xl hover:shadow-xl transition-all ${
                (extractedData && similarPatents.length === 0) || (isEditMode && expandedSection === 2)
                  ? "flex-[2]"
                  : "flex-[0.5]"
              } ${!extractedData ? "opacity-60" : ""}`}
            >
              <CardHeader
                className={`bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 pb-4 pt-4 ${
                  isEditMode && extractedData && similarPatents.length > 0 ? "cursor-pointer" : ""
                }`}
                onClick={() => toggleSectionExpansion(2)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/90 backdrop-blur-sm text-teal-600 rounded-xl flex items-center justify-center font-bold shadow-lg text-base">
                      2
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white font-bold tracking-tight">핵심 정보 선택</CardTitle>
                      {extractedData && similarPatents.length === 0 && (
                        <p className="text-teal-50 text-xs mt-0.5 font-medium">키워드 및 분야</p>
                      )}
                    </div>
                  </div>
                  {similarPatents.length > 0 && (
                    <Badge className="bg-white/95 text-teal-700 border-0 font-bold px-3 py-1 rounded-full shadow-lg text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      완료
                    </Badge>
                  )}
                </div>
                {extractedData && similarPatents.length === 0 && (
                  <p className="text-white/95 text-xs leading-relaxed pl-13">원하는 항목을 선택하세요</p>
                )}
              </CardHeader>
              {isLoadingStep2 ? (
                <CardContent className="p-6 bg-white flex items-center justify-center min-h-[300px]">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 text-teal-500 animate-spin mx-auto" />
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-gray-900">정보 추출 중</h3>
                      <p className="text-sm text-gray-600">메모에서 핵심 정보를 분석하고 있습니다...</p>
                    </div>
                  </div>
                </CardContent>
              ) : extractedData && (similarPatents.length === 0 || (isEditMode && expandedSection === 2)) ? (
                <CardContent className="p-6 space-y-5 bg-white max-h-[600px] overflow-y-auto">
                  {console.log(
                    "[v0] Rendering section 2 with extractedData:",
                    extractedData,
                    "selectedKeywords:",
                    selectedKeywords,
                  )}

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

                  {!isEditMode && (
                    <Button
                      onClick={handleSelectInfoAndSearch}
                      disabled={isProcessing}
                      className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all rounded-xl"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      유사 특허 검색하기
                    </Button>
                  )}
                </CardContent>
              ) : similarPatents.length > 0 && !isEditMode ? (
                <CardContent className="p-4 bg-white">
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="font-semibold text-gray-900">
                      {selectedKeywords.length}개 키워드, {selectedTechnicalFields.length}개 분야 선택됨
                    </p>
                  </div>
                </CardContent>
              ) : similarPatents.length > 0 && isEditMode ? (
                <CardContent className="p-4 bg-white">
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="font-semibold text-gray-900">
                      {selectedKeywords.length}개 키워드, {selectedTechnicalFields.length}개 분야 선택됨
                    </p>
                    <p className="text-teal-600 font-semibold pt-1">클릭하여 수정하기</p>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="p-4 bg-white">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Lock className="h-4 w-4" />
                    <p className="text-xs">먼저 메모를 입력해주세요</p>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Step 3: Similar Patent Selection */}
            <Card
              className={`shadow-lg border border-gray-200 overflow-hidden rounded-2xl hover:shadow-xl transition-all ${
                similarPatents.length > 0 && draftVersions.length === 0 ? "flex-[3]" : "flex-[0.5]"
              } ${similarPatents.length === 0 ? "opacity-60" : ""}`}
            >
              <CardHeader className="bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 pb-4 pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/90 backdrop-blur-sm text-teal-600 rounded-xl flex items-center justify-center font-bold shadow-lg text-base">
                      3
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white font-bold tracking-tight">유사 특허 선택</CardTitle>
                      {similarPatents.length > 0 && draftVersions.length === 0 && (
                        <p className="text-teal-50 text-xs mt-0.5 font-medium">특허 분석 및 선택</p>
                      )}
                    </div>
                  </div>
                  {draftVersions.length > 0 && (
                    <Badge className="bg-white/95 text-teal-700 border-0 font-bold px-3 py-1 rounded-full shadow-lg text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      완료
                    </Badge>
                  )}
                </div>
                {similarPatents.length > 0 && draftVersions.length === 0 && (
                  <p className="text-white/95 text-xs leading-relaxed pl-13">참고할 유사 특허를 선택하세요</p>
                )}
              </CardHeader>
              {isLoadingStep3 ? (
                <CardContent className="p-6 bg-white flex items-center justify-center min-h-[300px]">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 text-teal-500 animate-spin mx-auto" />
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-gray-900">특허 검색 중</h3>
                      <p className="text-sm text-gray-600">유사 특허를 검색하고 있습니다...</p>
                    </div>
                  </div>
                </CardContent>
              ) : similarPatents.length > 0 && (draftVersions.length === 0 || isEditMode) ? (
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
                      {similarPatents.map((patent) => (
                        <Card
                          key={patent.patentNumber}
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
                                  <h4 className="font-bold text-gray-900 text-base leading-snug flex-1">
                                    {patent.title}
                                  </h4>
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

                                {/* Patent Number Badge */}
                                <Badge
                                  variant="outline"
                                  className="text-xs border border-teal-500 text-teal-700 font-bold rounded-md px-3 py-1"
                                >
                                  {patent.patentNumber}
                                </Badge>

                                {/* Applicant and Date */}
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

                                {/* Abstract */}
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

                  {!isEditMode && (
                    <Button
                      onClick={handleGenerateDraft1}
                      disabled={selectedPatents.length === 0 || isProcessing}
                      className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all rounded-xl"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      초안 1 생성하기
                    </Button>
                  )}
                </CardContent>
              ) : draftVersions.length > 0 && !isEditMode ? (
                <CardContent className="p-4 bg-white">
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="font-semibold text-gray-900">{selectedPatents.length}개 특허 선택됨</p>
                  </div>
                </CardContent>
              ) : draftVersions.length > 0 && isEditMode ? (
                <CardContent className="p-4 bg-white">
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="font-semibold text-gray-900">{selectedPatents.length}개 특허 선택됨</p>
                    <p className="text-teal-600 font-semibold pt-1">클릭하여 수정하기</p>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="p-4 bg-white">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Lock className="h-4 w-4" />
                    <p className="text-xs">핵심 정보를 선택한 후 이용 가능</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <Card className="shadow-lg border border-gray-200 rounded-2xl">
              <CardContent className="p-8">
                {isProcessing || isRefining ? (
                  <div className="flex items-center justify-center h-[400px]">
                    <div className="text-center space-y-4">
                      <Loader2 className="h-12 w-12 text-teal-500 animate-spin mx-auto" />
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-gray-900">처리 중입니다</h3>
                        <p className="text-sm text-gray-600">{processingMessage}</p>
                      </div>
                    </div>
                  </div>
                ) : draftVersions.length > 0 ? (
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
                            <FileText className="h-4 w-4" />
                            초안 {draft.version}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {draftVersions.map((draft, index) => (
                        <TabsContent
                          key={`draft-${draft.version}`}
                          value={`draft-${draft.version}`}
                          className="space-y-6 mt-6"
                        >
                          <div className="bg-teal-50 border border-teal-200 p-5 rounded-xl flex items-center justify-between">
                            <span className="font-bold text-teal-800 text-base">초안 {draft.version}</span>
                            <span className="text-gray-600 text-sm">{draft.timestamp.toLocaleString()}</span>
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

                          {/* Replaced section-based summary with structured summary */}
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
                                      {/* Invention Title */}
                                      <Card className="border-2 border-teal-200 shadow-md rounded-xl">
                                        <CardContent className="p-6">
                                          <div className="flex items-center gap-3 mb-4">
                                            <Badge className="bg-teal-500 text-white text-sm font-bold px-4 py-1.5 rounded-lg">
                                              발명의 명칭
                                            </Badge>
                                          </div>
                                          <h2 className="text-2xl font-bold text-gray-900 leading-relaxed">
                                            {summary.title}
                                          </h2>
                                        </CardContent>
                                      </Card>

                                      {/* Abstract */}
                                      {summary.abstract && (
                                        <Card className="border-2 border-blue-200 shadow-md rounded-xl">
                                          <CardContent className="p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                              <Badge className="bg-blue-500 text-white text-sm font-bold px-4 py-1.5 rounded-lg">
                                                요약
                                              </Badge>
                                            </div>
                                            <p className="text-base text-gray-800 leading-relaxed">
                                              {summary.abstract}
                                            </p>
                                          </CardContent>
                                        </Card>
                                      )}

                                      {/* Claims */}
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
                                                  <span className="text-indigo-600 font-bold flex-shrink-0">
                                                    {idx + 1}.
                                                  </span>
                                                  <p className="text-base text-gray-800 leading-relaxed">{claim}</p>
                                                </div>
                                              ))}
                                            </div>
                                          </CardContent>
                                        </Card>
                                      )}

                                      {/* Technical Field */}
                                      {summary.technicalField && (
                                        <Card className="border-2 border-cyan-200 shadow-md rounded-xl">
                                          <CardContent className="p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                              <Badge className="bg-cyan-500 text-white text-sm font-bold px-4 py-1.5 rounded-lg">
                                                기술분야
                                              </Badge>
                                            </div>
                                            <p className="text-base text-gray-800 leading-relaxed">
                                              {summary.technicalField}
                                            </p>
                                          </CardContent>
                                        </Card>
                                      )}

                                      {/* Problems */}
                                      {summary.problems.length > 0 && (
                                        <Card className="border-2 border-orange-200 shadow-md rounded-xl">
                                          <CardContent className="p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                              <Badge className="bg-orange-500 text-white text-sm font-bold px-4 py-1.5 rounded-lg">
                                                해결하는 핵심 과제
                                              </Badge>
                                            </div>
                                            <div className="space-y-3">
                                              {summary.problems.map((problem, idx) => (
                                                <div key={idx} className="flex gap-3">
                                                  <span className="text-orange-600 font-bold flex-shrink-0">•</span>
                                                  <p className="text-base text-gray-800 leading-relaxed">{problem}</p>
                                                </div>
                                              ))}
                                            </div>
                                          </CardContent>
                                        </Card>
                                      )}

                                      {/* Effects */}
                                      {summary.effects.length > 0 && (
                                        <Card className="border-2 border-green-200 shadow-md rounded-xl">
                                          <CardContent className="p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                              <Badge className="bg-green-500 text-white text-sm font-bold px-4 py-1.5 rounded-lg">
                                                발명의 핵심 효과
                                              </Badge>
                                            </div>
                                            <div className="space-y-3">
                                              {summary.effects.map((effect, idx) => (
                                                <div key={idx} className="flex gap-3">
                                                  <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                                                  <p className="text-base text-gray-800 leading-relaxed">{effect}</p>
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
        )}
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
              {/* Patent Number and Basic Info */}
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

              {/* Patent Specification Content */}
              <div className="prose prose-lg max-w-none space-y-8">
                {/* Technical Field */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">【기술분야】</h2>
                  <p className="text-gray-800 leading-relaxed text-base">
                    본 발명은 {selectedPatentDetail.title}에 관한 것으로, 보다 상세하게는 최신 기술을 활용하여 기존
                    시스템의 한계를 극복하고 사용자 경험을 향상시키는 혁신적인 기술에 관한 것이다. 특히, 실시간 데이터
                    처리, 인공지능 기반 분석, 클라우드 컴퓨팅 환경에서의 효율적인 운영을 가능하게 하는 시스템 및 방법에
                    관한 것이다.
                  </p>
                </div>

                {/* Background Art */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">【배경기술】</h2>
                  <div className="text-gray-800 leading-relaxed text-base space-y-4">
                    <p>
                      최근 정보통신 기술의 발달로 인해 다양한 분야에서 디지털 전환이 가속화되고 있다. 특히,
                      사물인터넷(IoT), 인공지능(AI), 빅데이터 등의 기술이 융합되면서 새로운 서비스와 비즈니스 모델이
                      등장하고 있다.
                    </p>
                    <p>그러나 기존의 시스템들은 다음과 같은 문제점을 가지고 있다:</p>
                    <p>
                      1. 실시간 데이터 처리 능력의 한계: 대용량 데이터를 실시간으로 처리하고 분석하는 데 있어 성능
                      저하가 발생한다.
                    </p>
                    <p>
                      2. 확장성 부족: 사용자 수가 증가하거나 데이터량이 급증할 경우 시스템이 원활하게 확장되지 못하는
                      문제가 있다.
                    </p>
                    <p>3. 보안 취약성: 민감한 데이터를 다루는 과정에서 보안 위협에 노출될 위험이 있다.</p>
                    <p>4. 사용자 경험 저하: 복잡한 인터페이스와 느린 응답 속도로 인해 사용자 만족도가 낮다.</p>
                    <p>5. 유지보수의 어려움: 시스템 구조가 복잡하고 모듈화가 부족하여 유지보수 비용이 증가한다.</p>
                    <p>이러한 문제점들을 해결하기 위해 새로운 접근 방식과 기술적 혁신이 필요한 상황이다.</p>
                  </div>
                </div>

                {/* Summary of Invention */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">【발명의 내용】</h2>
                  <div className="text-gray-800 leading-relaxed text-base space-y-4">
                    <p>{selectedPatentDetail.summary}</p>
                    <p>본 발명의 시스템은 다음과 같은 주요 구성요소를 포함한다:</p>
                    <p>
                      • 데이터 수집 모듈: 다양한 소스로부터 실시간으로 데이터를 수집하고 전처리하는 기능을 수행한다.
                    </p>
                    <p>
                      • 분석 엔진: 수집된 데이터를 인공지능 알고리즘을 활용하여 분석하고 의미 있는 인사이트를 도출한다.
                    </p>
                    <p>
                      • 저장소 관리 시스템: 대용량 데이터를 효율적으로 저장하고 관리하며, 필요시 빠르게 검색할 수 있는
                      기능을 제공한다.
                    </p>
                    <p>
                      • 사용자 인터페이스: 직관적이고 사용하기 쉬운 인터페이스를 통해 사용자가 시스템의 기능을 쉽게
                      활용할 수 있도록 한다.
                    </p>
                    <p>• 보안 모듈: 데이터 암호화, 접근 제어, 감사 로그 등의 기능을 통해 시스템의 보안을 강화한다.</p>
                  </div>
                </div>

                {/* Detailed Description */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">【발명을 실시하기 위한 구체적인 내용】</h2>
                  <div className="text-gray-800 leading-relaxed text-base space-y-4">
                    <p>이하, 첨부된 도면을 참조하여 본 발명의 바람직한 실시예를 상세히 설명한다.</p>

                    <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">[실시예 1] 기본 시스템 구성</h3>
                    <p>
                      본 발명의 제1 실시예에 따른 시스템은 클라이언트 장치, 서버, 데이터베이스로 구성된다. 클라이언트
                      장치는 사용자로부터 입력을 받아 서버로 전송하고, 서버는 이를 처리하여 결과를 데이터베이스에
                      저장한다.
                    </p>
                    <p>서버는 다음과 같은 세부 모듈로 구성된다:</p>
                    <p>- 요청 처리 모듈: 클라이언트로부터 수신한 요청을 파싱하고 검증한다.</p>
                    <p>- 비즈니스 로직 모듈: 실제 데이터 처리 및 분석 작업을 수행한다.</p>
                    <p>- 응답 생성 모듈: 처리 결과를 적절한 형식으로 변환하여 클라이언트에 전송한다.</p>

                    <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">[실시예 2] 고급 기능 구현</h3>
                    <p>
                      본 발명의 제2 실시예는 제1 실시예의 기본 구성에 인공지능 기반 예측 기능을 추가한 것이다. 머신러닝
                      모델을 활용하여 과거 데이터를 학습하고, 미래의 트렌드를 예측할 수 있다.
                    </p>
                    <p>예측 모델은 다음과 같은 단계로 동작한다:</p>
                    <p>1. 데이터 전처리: 수집된 원시 데이터를 정제하고 정규화한다.</p>
                    <p>2. 특징 추출: 예측에 유용한 특징들을 추출하고 선택한다.</p>
                    <p>3. 모델 학습: 선택된 특징을 바탕으로 예측 모델을 학습시킨다.</p>
                    <p>4. 예측 수행: 학습된 모델을 사용하여 새로운 데이터에 대한 예측을 수행한다.</p>
                    <p>5. 결과 검증: 예측 결과의 정확도를 평가하고 필요시 모델을 재학습한다.</p>

                    <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">[실시예 3] 분산 처리 시스템</h3>
                    <p>
                      본 발명의 제3 실시예는 대규모 데이터 처리를 위한 분산 처리 시스템에 관한 것이다. 여러 서버 노드에
                      작업을 분산하여 처리 속도를 향상시키고, 하나의 노드에 장애가 발생하더라도 시스템 전체가 중단되지
                      않도록 한다.
                    </p>
                    <p>
                      분산 처리 시스템은 마스터 노드와 워커 노드로 구성되며, 마스터 노드는 작업을 분할하고 워커 노드에
                      할당하는 역할을 수행한다. 각 워커 노드는 할당받은 작업을 독립적으로 처리하고, 결과를 마스터 노드로
                      반환한다.
                    </p>
                  </div>
                </div>

                {/* Effects */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">【발명의 효과】</h2>
                  <div className="text-gray-800 leading-relaxed text-base space-y-4">
                    <p>본 발명에 따르면 다음과 같은 효과를 얻을 수 있다:</p>
                    <p>
                      1. 처리 성능 향상: 최적화된 알고리즘과 병렬 처리 기술을 통해 기존 대비 3배 이상의 처리 속도 향상을
                      달성할 수 있다.
                    </p>
                    <p>
                      2. 확장성 개선: 마이크로서비스 아키텍처를 채택하여 필요에 따라 개별 모듈을 독립적으로 확장할 수
                      있다.
                    </p>
                    <p>3. 보안 강화: 다층 보안 체계를 구축하여 데이터 유출 및 무단 접근을 효과적으로 방지할 수 있다.</p>
                    <p>4. 사용자 경험 개선: 직관적인 UI/UX 설계를 통해 사용자 만족도를 크게 향상시킬 수 있다.</p>
                    <p>
                      5. 비용 절감: 클라우드 기반 인프라를 활용하여 초기 투자 비용을 절감하고, 사용량에 따른 유연한 비용
                      관리가 가능하다.
                    </p>
                    <p>
                      6. 유지보수 용이성: 모듈화된 구조와 명확한 인터페이스 정의를 통해 유지보수 시간과 비용을 대폭
                      절감할 수 있다.
                    </p>
                    <p>7. 호환성: 다양한 플랫폼 및 기존 시스템과의 연동이 용이하여 기업 환경에 쉽게 통합할 수 있다.</p>
                  </div>
                </div>

                {/* Claims */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">【특허청구범위】</h2>
                  <div className="text-gray-800 leading-relaxed text-base space-y-5">
                    <div>
                      <p className="font-bold mb-2">【청구항 1】</p>
                      <p>
                        사용자로부터 입력 데이터를 수신하는 입력 모듈; 상기 입력 데이터를 분석하여 핵심 정보를 추출하는
                        분석 모듈; 추출된 핵심 정보를 기반으로 결과를 생성하는 처리 모듈; 및 생성된 결과를 사용자에게
                        제공하는 출력 모듈을 포함하는 것을 특징으로 하는 시스템.
                      </p>
                    </div>
                    <div>
                      <p className="font-bold mb-2">【청구항 2】</p>
                      <p>
                        제1항에 있어서, 상기 분석 모듈은 인공지능 알고리즘을 활용하여 데이터 패턴을 학습하고 예측하는
                        것을 특징으로 하는 시스템.
                      </p>
                    </div>
                    <div>
                      <p className="font-bold mb-2">【청구항 3】</p>
                      <p>
                        제1항에 있어서, 상기 처리 모듈은 실시간으로 데이터를 처리하며, 병렬 처리 기술을 통해 처리 속도를
                        향상시키는 것을 특징으로 하는 시스템.
                      </p>
                    </div>
                    <div>
                      <p className="font-bold mb-2">【청구항 4】</p>
                      <p>제1항에 있어서, 데이터 보안을 위한 암호화 모듈을 더 포함하는 것을 특징으로 하는 시스템.</p>
                    </div>
                    <div>
                      <p className="font-bold mb-2">【청구항 5】</p>
                      <p>
                        제1항에 있어서, 상기 시스템은 클라우드 환경에서 동작하며, 복수의 서버 노드에 작업을 분산하여
                        처리하는 것을 특징으로 하는 시스템.
                      </p>
                    </div>
                    <div>
                      <p className="font-bold mb-2">【청구항 6】</p>
                      <p>제1항 내지 제5항 중 어느 한 항의 시스템을 이용한 데이터 처리 방법.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selection Checkbox */}
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

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">모든 내용을 초기화하시겠습니까?</DialogTitle>
            <DialogDescription className="text-base text-gray-600 pt-4">
              입력한 모든 정보와 생성된 초안이 삭제됩니다.
              <br />이 작업은 되돌릴 수 없습니다.
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
