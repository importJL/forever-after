import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? ''

    // Handle Google URL import (JSON body)
    if (contentType.includes('application/json')) {
      const body = await request.json()
      if (body.source === 'google') {
        return NextResponse.json({
          success: false,
          message: 'Google integration coming soon',
        })
      }
      return NextResponse.json(
        { error: 'Unsupported JSON import source' },
        { status: 400 }
      )
    }

    // Handle file upload (FormData)
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const targetModule = (formData.get('targetModule') as string) ?? ''

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name
    const ext = fileName.split('.').pop()?.toLowerCase() ?? ''

    let parsedData: unknown = null

    if (ext === 'xlsx' || ext === 'xls') {
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      parsedData = XLSX.utils.sheet_to_json(sheet)
    } else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ buffer })
      parsedData = { text: result.value }
    } else if (ext === 'pptx') {
      // Basic file info for now
      parsedData = {
        fileName,
        fileType: ext,
        size: buffer.length,
        message: 'PPTX text extraction coming soon',
      }
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: .${ext}` },
        { status: 400 }
      )
    }

    // Store import record
    await db.importedFile.create({
      data: {
        fileName,
        fileType: ext,
        content: typeof parsedData === 'string' ? parsedData : '',
        parsedData: JSON.stringify(parsedData),
        targetModule,
      },
    })

    return NextResponse.json({
      success: true,
      data: parsedData,
      targetModule,
      fileName,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process import'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}