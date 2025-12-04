import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { handleApiError } from "@/shared/lib/api/error-handler"

const DATA_DIR = path.join(process.cwd(), "data", "saved-patents")

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureDataDir()

    // Read all saved patent files
    const files = await fs.readdir(DATA_DIR)
    const jsonFiles = files.filter((file) => file.endsWith(".json"))

    const savedPatents = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const filePath = path.join(DATA_DIR, file)
          const fileContent = await fs.readFile(filePath, "utf-8")
          const data = JSON.parse(fileContent)

          // Return summary data only
          return {
            id: data.id,
            title: data.title || "제목 없음",
            createdAt: data.createdAt,
            draftCount: data.draftVersions?.length || 0,
            keywords: data.step2Data?.selectedKeywords?.slice(0, 3) || [],
          }
        } catch (error) {
          console.error(`[Get Saved Patents] Error reading file ${file}:`, error)
          return null
        }
      })
    )

    // Filter out null values and sort by creation date (newest first)
    const validPatents = savedPatents
      .filter((p) => p !== null)
      .sort((a, b) => {
        const dateA = new Date(a!.createdAt).getTime()
        const dateB = new Date(b!.createdAt).getTime()
        return dateB - dateA
      })

    return NextResponse.json({
      patents: validPatents,
      count: validPatents.length,
    })
  } catch (error) {
    console.error("[Get Saved Patents] Error:", error)
    return handleApiError(error)
  }
}

