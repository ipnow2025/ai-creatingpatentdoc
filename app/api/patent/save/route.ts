import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { handleApiError } from "@/shared/lib/api/error-handler"

const DATA_DIR = path.join(process.cwd(), "data", "saved-patents")

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDataDir()

    const data = await request.json()

    // Validate required data
    if (!data.step1Data || !data.step2Data || !data.step3Data || !data.draftVersions) {
      return NextResponse.json(
        { error: "필수 데이터가 누락되었습니다." },
        { status: 400 }
      )
    }

    // Generate unique ID
    const id = `patent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const createdAt = new Date().toISOString()

    // Validate selected patents exist in similarPatents
    const similarPatents = data.step2Data?.similarPatents || []
    const selectedPatents = data.step3Data?.selectedPatents || []
    const validSelectedPatents = selectedPatents.filter((patentNum: string) =>
      similarPatents.some((p: any) => p.patentNumber === patentNum)
    )

    // Warn if some selected patents are not in similarPatents
    if (validSelectedPatents.length < selectedPatents.length) {
      const invalidPatents = selectedPatents.filter(
        (patentNum: string) => !similarPatents.some((p: any) => p.patentNumber === patentNum)
      )
      console.warn(
        `[Save Patent] Some selected patents are not in similarPatents: ${invalidPatents.join(", ")}`
      )
    }

    // Prepare saved data
    const savedData = {
      id,
      createdAt,
      title: data.step1Data.inventionTitle || "제목 없음",
      step1Data: {
        memoText: data.step1Data.memoText || "",
        inventionTitle: data.step1Data.inventionTitle || "",
        inventor: data.step1Data.inventor || "",
        applicant: data.step1Data.applicant || "",
        extractedData: data.step1Data.extractedData || null,
      },
      step2Data: {
        selectedKeywords: data.step2Data.selectedKeywords || [],
        selectedTechnicalFields: data.step2Data.selectedTechnicalFields || [],
        selectedProblems: data.step2Data.selectedProblems || [],
        selectedFeatures: data.step2Data.selectedFeatures || [],
        similarPatents: similarPatents,
      },
      step3Data: {
        selectedPatents: validSelectedPatents.length > 0 ? validSelectedPatents : selectedPatents, // Keep original if all invalid for debugging
      },
      draftVersions: data.draftVersions.map((draft: any) => ({
        ...draft,
        timestamp: draft.timestamp instanceof Date ? draft.timestamp.toISOString() : draft.timestamp,
      })),
    }

    // Save to file
    const filePath = path.join(DATA_DIR, `${id}.json`)
    await fs.writeFile(filePath, JSON.stringify(savedData, null, 2), "utf-8")

    return NextResponse.json({
      success: true,
      id,
      message: "저장되었습니다.",
    })
  } catch (error) {
    console.error("[Save Patent] Error:", error)
    return handleApiError(error)
  }
}

