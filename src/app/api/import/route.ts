import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'

function parseYesNo(value: unknown): boolean {
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    return v === 'yes' || v === '1' || v === 'true'
  }
  if (typeof value === 'number') return value === 1
  if (typeof value === 'boolean') return value
  return false
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const v = value.trim()
    if (v === '') return 0
    const n = parseInt(v, 10)
    return isNaN(n) ? 0 : n
  }
  return 0
}

function parseString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  if (value === null || value === undefined) return ''
  return String(value)
}

interface CsvRow {
  Priority?: unknown
  'Guest Name'?: unknown
  Side?: unknown
  Category?: unknown
  'Relationship Group'?: unknown
  Overseas?: unknown
  'Verbal Asked'?: unknown
  'RSVP Status'?: unknown
  'Plus One?'?: unknown
  Adults?: unknown
  Children?: unknown
  'Total in Party'?: unknown
  'Dietary Restrictions'?: unknown
  Address?: unknown
  Email?: unknown
  'Gift Received'?: unknown
  'Thank You Sent?'?: unknown
  Remarks?: unknown
}

interface TaskCsvRow {
  Timeline?: unknown
  Task?: unknown
  Topic?: unknown
}

interface VendorCsvRow {
  Categories?: unknown
  Company?: unknown
  Content?: unknown
  Remark?: unknown
  'Reference Rate'?: unknown
}

const WEDDING_DATE = new Date(2027, 4, 15)

function parseTimelineToDueDate(timeline: string): string {
  if (!timeline) return ''
  const match = timeline.match(/(\d+)/)
  if (!match) return ''
  const amount = parseInt(match[1], 10)
  const date = new Date(WEDDING_DATE)
  if (timeline.includes('day')) {
    date.setDate(date.getDate() - amount)
  } else if (timeline.includes('week')) {
    date.setDate(date.getDate() - amount * 7)
  } else if (timeline.includes('month')) {
    date.setMonth(date.getMonth() - amount)
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function parsePrice(value: unknown): number {
  const str = parseString(value)
  if (!str) return 0
  const match = str.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

function mapCsvRowToTask(row: TaskCsvRow, index: number) {
  return {
    title: parseString(row.Task),
    description: '',
    category: parseString(row.Topic) || 'Other',
    priority: 'medium',
    status: 'todo',
    dueDate: parseTimelineToDueDate(parseString(row.Timeline)),
    assignee: '',
    notes: '',
    sortOrder: index,
  }
}

function mapCsvRowToVendor(row: VendorCsvRow) {
  const content = parseString(row.Content)
  const remark = parseString(row.Remark)
  const notes = [content, remark].filter(Boolean).join(' - ')
  return {
    name: parseString(row.Company),
    category: parseString(row.Categories),
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    district: '',
    city: 'Hong Kong',
    price: parsePrice(row['Reference Rate']),
    depositPaid: 0,
    status: 'considering',
    rating: 0,
    notes,
    contractDate: '',
  }
}

function mapCsvRowToGuest(row: CsvRow) {
  return {
    name: parseString(row['Guest Name']),
    email: parseString(row['Email']),
    group: parseString(row['Category']),
    rsvpStatus: mapRsvpStatus(parseString(row['RSVP Status'])),
    dietaryNotes: parseString(row['Dietary Restrictions']),
    plusOne: parseYesNo(row['Plus One?']),
    notes: parseString(row['Remarks']),
    priority: parseNumber(row['Priority']),
    side: parseString(row['Side']),
    category: parseString(row['Category']),
    relationshipGroup: parseString(row['Relationship Group']),
    overseas: parseYesNo(row['Overseas']),
    verbalAsked: parseYesNo(row['Verbal Asked']),
    adults: parseNumber(row['Adults']) || 1,
    children: parseNumber(row['Children']),
    totalInParty: parseNumber(row['Total in Party']) || 1,
    address: parseString(row['Address']),
    giftReceived: parseString(row['Gift Received']),
    thankYouSent: parseYesNo(row['Thank You Sent?']),
    role: mapRelationshipToRole(parseString(row['Relationship Group'])),
    mealPreference: '',
    plusOneName: '',
    tableNumber: 0,
    seatNumber: 0,
    phone: '',
  }
}

function mapRsvpStatus(status: string): 'pending' | 'accepted' | 'declined' | 'maybe' {
  const s = status.toLowerCase()
  if (s === 'accepted') return 'accepted'
  if (s === 'declined') return 'declined'
  if (s === 'maybe') return 'maybe'
  return 'pending'
}

function mapRelationshipToRole(relationship: string): string {
  const r = relationship.toLowerCase()
  if (r.includes('bridesmaid')) return 'bridesmaid'
  if (r.includes('groomsmen') || r.includes('groomsman')) return 'groomsman'
  if (r.includes('immediate family')) return 'family'
  if (r.includes('officiant')) return 'officiant'
  return 'guest'
}

interface SetupRow {
  'RSVP Status'?: string
  Side?: string
  Category?: string
  Relationship?: string
  Binary?: string
  Priority?: string
}

function parseSetupCsv(rows: SetupRow[]) {
  const sides = new Set<string>()
  const categories = new Set<string>()
  const relationshipGroups = new Set<string>()
  const rsvpStatuses = new Set<string>()
  const priorities = new Set<number>()
  const binaries = new Set<string>()

  for (const row of rows) {
    if (row.Side) sides.add(row.Side.trim())
    if (row.Category) categories.add(row.Category.trim())
    if (row.Relationship) relationshipGroups.add(row.Relationship.trim())
    if (row['RSVP Status']) rsvpStatuses.add(row['RSVP Status'].trim())
    if (row.Priority) {
      const p = parseInt(row.Priority.trim(), 10)
      if (!isNaN(p)) priorities.add(p)
    }
    if (row.Binary) binaries.add(row.Binary.trim())
  }

  return {
    sides: Array.from(sides),
    categories: Array.from(categories),
    relationshipGroups: Array.from(relationshipGroups),
    rsvpStatuses: Array.from(rsvpStatuses),
    priorities: Array.from(priorities).sort(),
    binaries: Array.from(binaries),
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? ''

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

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const targetModule = (formData.get('targetModule') as string) ?? ''
    const confirmStr = (formData.get('confirm') as string) ?? ''
    const isConfirm = confirmStr === 'true'
    const setupFile = formData.get('setupFile') as File | null

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

    if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
      const workbook = XLSX.read(buffer, { type: 'buffer', raw: true })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      parsedData = jsonData
    } else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ buffer })
      parsedData = { text: result.value }
    } else if (ext === 'pptx') {
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

    // Parse setup CSV if provided
    let setupData: {
      sides: string[]
      categories: string[]
      relationshipGroups: string[]
      rsvpStatuses: string[]
      priorities: number[]
      binaries: string[]
    } | null = null
    if (setupFile) {
      const setupBuffer = Buffer.from(await setupFile.arrayBuffer())
      const setupWorkbook = XLSX.read(setupBuffer, { type: 'buffer', raw: true })
      const setupSheet = setupWorkbook.Sheets[setupWorkbook.SheetNames[0]]
      const setupJson: SetupRow[] = XLSX.utils.sheet_to_json(setupSheet, { defval: '' })
      setupData = parseSetupCsv(setupJson)
    }

    // Handle confirmed guest import
    if (isConfirm && targetModule === 'guests' && Array.isArray(parsedData)) {
      const guests = parsedData.map((row) => mapCsvRowToGuest(row as CsvRow))
      const created = await Promise.all(
        guests.map((g) => db.guest.create({ data: g }))
      )
      return NextResponse.json({
        success: true,
        data: created,
        count: created.length,
        setupData,
        targetModule,
      })
    }

    // Handle confirmed task import
    if (isConfirm && targetModule === 'tasks' && Array.isArray(parsedData)) {
      const tasks = (parsedData as Record<string, unknown>[]).map((row, i) =>
        mapCsvRowToTask(row as TaskCsvRow, i)
      )
      const created = await Promise.all(
        tasks.map((t) => db.task.create({ data: t }))
      )
      return NextResponse.json({
        success: true,
        data: created,
        count: created.length,
        targetModule,
      })
    }

    // Handle confirmed vendor import
    if (isConfirm && targetModule === 'vendors' && Array.isArray(parsedData)) {
      const vendors = (parsedData as Record<string, unknown>[]).map((row) =>
        mapCsvRowToVendor(row as VendorCsvRow)
      )
      const created = await Promise.all(
        vendors.map((v) => db.vendor.create({ data: v }))
      )
      return NextResponse.json({
        success: true,
        data: created,
        count: created.length,
        targetModule,
      })
    }

    // For preview, return headers and rows
    if (Array.isArray(parsedData) && parsedData.length > 0) {
      const headers = Object.keys(parsedData[0] as Record<string, unknown>)
      const rows = (parsedData as Record<string, unknown>[]).map((item) =>
        headers.map((h) => String(item[h] ?? ''))
      )
      return NextResponse.json({
        success: true,
        headers,
        rows,
        targetModule,
        setupData,
        fileName,
      })
    }

    // Store import record for non-guest data
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
