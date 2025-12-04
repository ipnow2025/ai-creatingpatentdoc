"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import type { DraftVersion } from "@/features/patent/types/draft.types"
import type { ExtractedData } from "@/features/patent/types/extraction.types"
import type { Patent } from "@/features/patent/types/patent.types"

interface PatentContextType {
  // Step 1: Memo Input
  memoText: string
  setMemoText: (text: string) => void
  inventionTitle: string
  setInventionTitle: (title: string) => void
  inventor: string
  setInventor: (inventor: string) => void
  applicant: string
  setApplicant: (applicant: string) => void
  extractedData: ExtractedData | null
  setExtractedData: (data: ExtractedData | null) => void

  // Step 2: Core Info Selection
  selectedKeywords: string[]
  setSelectedKeywords: (keywords: string[]) => void
  selectedTechnicalFields: string[]
  setSelectedTechnicalFields: (fields: string[]) => void
  selectedProblems: string[]
  setSelectedProblems: (problems: string[]) => void
  selectedFeatures: string[]
  setSelectedFeatures: (features: string[]) => void

  // Step 3: Patent Selection
  similarPatents: Patent[]
  setSimilarPatents: (patents: Patent[]) => void
  selectedPatents: string[]
  setSelectedPatents: (patents: string[]) => void

  // Results
  draftVersions: DraftVersion[]
  setDraftVersions: (drafts: DraftVersion[]) => void
  currentDraftIndex: number
  setCurrentDraftIndex: (index: number) => void
  activeTab: string
  setActiveTab: (tab: string) => void

  // Helper functions
  toggleKeyword: (keyword: string) => void
  toggleTechnicalField: (field: string) => void
  toggleProblem: (problem: string) => void
  toggleFeature: (feature: string) => void
  togglePatentSelection: (patentNumber: string) => void
  resetAll: () => void
}

const PatentContext = createContext<PatentContextType | undefined>(undefined)

export function PatentProvider({ children }: { children: ReactNode }) {
  // Step 1: Memo Input
  const [memoText, setMemoText] = useState("")
  const [inventionTitle, setInventionTitle] = useState("")
  const [inventor, setInventor] = useState("")
  const [applicant, setApplicant] = useState("")
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)

  // Step 2: Core Info Selection
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [selectedTechnicalFields, setSelectedTechnicalFields] = useState<string[]>([])
  const [selectedProblems, setSelectedProblems] = useState<string[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  // Step 3: Patent Selection
  const [similarPatents, setSimilarPatents] = useState<Patent[]>([])
  const [selectedPatents, setSelectedPatents] = useState<string[]>([])

  // Results
  const [draftVersions, setDraftVersions] = useState<DraftVersion[]>([])
  const [currentDraftIndex, setCurrentDraftIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<string>("draft-1")

  // Helper functions
  const toggleKeyword = useCallback((keyword: string) => {
    setSelectedKeywords((prev) => {
      // 이미 선택된 키워드면 제거
      if (prev.includes(keyword)) {
        return prev.filter((k) => k !== keyword)
      }
      // 최대 5개까지만 선택 가능
      if (prev.length >= 5) {
        return prev
      }
      return [...prev, keyword]
    })
  }, [])

  const toggleTechnicalField = useCallback((field: string) => {
    setSelectedTechnicalFields((prev) => {
      // 이미 선택된 분야면 제거
      if (prev.includes(field)) {
        return prev.filter((f) => f !== field)
      }
      // 최대 2개까지만 선택 가능
      if (prev.length >= 2) {
        return prev
      }
      return [...prev, field]
    })
  }, [])

  const toggleProblem = useCallback((problem: string) => {
    setSelectedProblems((prev) => {
      // 이미 선택된 문제점이면 제거
      if (prev.includes(problem)) {
        return prev.filter((p) => p !== problem)
      }
      // 최대 2개까지만 선택 가능
      if (prev.length >= 2) {
        return prev
      }
      return [...prev, problem]
    })
  }, [])

  const toggleFeature = useCallback((feature: string) => {
    setSelectedFeatures((prev) => {
      // 이미 선택된 특징이면 제거
      if (prev.includes(feature)) {
        return prev.filter((f) => f !== feature)
      }
      // 최대 2개까지만 선택 가능
      if (prev.length >= 2) {
        return prev
      }
      return [...prev, feature]
    })
  }, [])

  const togglePatentSelection = useCallback((patentNumber: string) => {
    setSelectedPatents((prev) =>
      prev.includes(patentNumber)
        ? prev.filter((p) => p !== patentNumber)
        : [...prev, patentNumber]
    )
  }, [])

  const resetAll = useCallback(() => {
    setMemoText("")
    setInventionTitle("")
    setInventor("")
    setApplicant("")
    setExtractedData(null)
    setSelectedKeywords([])
    setSelectedTechnicalFields([])
    setSelectedProblems([])
    setSelectedFeatures([])
    setSimilarPatents([])
    setSelectedPatents([])
    setDraftVersions([])
    setCurrentDraftIndex(0)
    setActiveTab("draft-1")
  }, [])

  const value: PatentContextType = {
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
    selectedKeywords,
    setSelectedKeywords,
    selectedTechnicalFields,
    setSelectedTechnicalFields,
    selectedProblems,
    setSelectedProblems,
    selectedFeatures,
    setSelectedFeatures,
    similarPatents,
    setSimilarPatents,
    selectedPatents,
    setSelectedPatents,
    draftVersions,
    setDraftVersions,
    currentDraftIndex,
    setCurrentDraftIndex,
    activeTab,
    setActiveTab,
    toggleKeyword,
    toggleTechnicalField,
    toggleProblem,
    toggleFeature,
    togglePatentSelection,
    resetAll,
  }

  return <PatentContext.Provider value={value}>{children}</PatentContext.Provider>
}

export function usePatentContext() {
  const context = useContext(PatentContext)
  if (context === undefined) {
    throw new Error("usePatentContext must be used within a PatentProvider")
  }
  return context
}

