import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { handleApiError } from "@/shared/lib/api/error-handler"

const DATA_DIR = path.join(process.cwd(), "data", "saved-patents")

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const filePath = path.join(DATA_DIR, `${id}.json`)

    try {
      const fileContent = await fs.readFile(filePath, "utf-8")
      const data = JSON.parse(fileContent)

      return NextResponse.json(data)
    } catch (fileError) {
      if ((fileError as NodeJS.ErrnoException).code === "ENOENT") {
        return NextResponse.json(
          { error: "저장된 기록을 찾을 수 없습니다." },
          { status: 404 }
        )
      }
      throw fileError
    }
  } catch (error) {
    console.error("[Get Saved Patent] Error:", error)
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const filePath = path.join(DATA_DIR, `${id}.json`)

    try {
      await fs.unlink(filePath)
      return NextResponse.json({
        success: true,
        message: "삭제되었습니다.",
      })
    } catch (fileError) {
      if ((fileError as NodeJS.ErrnoException).code === "ENOENT") {
        return NextResponse.json(
          { error: "저장된 기록을 찾을 수 없습니다." },
          { status: 404 }
        )
      }
      throw fileError
    }
  } catch (error) {
    console.error("[Delete Saved Patent] Error:", error)
    return handleApiError(error)
  }
}

