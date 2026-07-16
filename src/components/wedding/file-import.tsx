'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useWeddingStore } from '@/lib/store'
import { client } from '@/lib/amplify-client'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import {
  FileUp,
  Upload,
  FileSpreadsheet,
  FileType,
  FileText,
  Presentation,
  Link2,
  Cloud,
  CheckCircle,
  AlertCircle,
  X,
  Table2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface SelectedFile {
  file: File
  name: string
  size: string
  type: string
}

interface ImportHistoryItem {
  id: string
  fileName: string
  targetModule: string
  status: 'success' | 'error'
  timestamp: string
  rows?: number
}

const TARGET_MODULES = [
  { value: 'guests', label: 'Guests' },
  { value: 'budget', label: 'Budget' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'vendors', label: 'Vendors' },
  { value: 'notes', label: 'General Notes' },
] as const

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.docx', '.pptx']

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileTypeIcon(fileName: string) {
  const ext = fileName.toLowerCase().split('.').pop()
  switch (ext) {
    case 'csv':
      return <Table2 className="h-8 w-8 text-green-600" />
    case 'xlsx':
      return <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
    case 'docx':
      return <FileType className="h-8 w-8 text-blue-600" />
    case 'pptx':
      return <Presentation className="h-8 w-8 text-orange-600" />
    default:
      return <FileText className="h-8 w-8 text-muted-foreground" />
  }
}

function getFileTypeBadge(fileName: string) {
  const ext = fileName.toLowerCase().split('.').pop()
  switch (ext) {
    case 'csv':
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">CSV</Badge>
    case 'xlsx':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Spreadsheet</Badge>
    case 'docx':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Document</Badge>
    case 'pptx':
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Presentation</Badge>
    default:
      return <Badge variant="secondary">File</Badge>
  }
}

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

interface SetupRow {
  'RSVP Status'?: string
  Side?: string
  Category?: string
  Relationship?: string
  Binary?: string
  Priority?: string
}

interface ParsedFileData {
  headers: string[]
  rows: string[][]
  rawData: Record<string, unknown>[]
  setupData?: ReturnType<typeof parseSetupCsv> | null
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

function mapCsvRowToTask(row: TaskCsvRow, index: number) {
  return {
    title: parseString(row.Task),
    description: '',
    category: parseString(row.Topic) || 'Other',
    priority: 'medium' as const,
    status: 'todo' as const,
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
    status: 'considering' as const,
    rating: 0,
    notes,
    contractDate: '',
  }
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

async function parseFileInBrowser(file: File): Promise<Record<string, unknown>[]> {
  const ext = file.name.toLowerCase().split('.').pop() ?? ''
  const arrayBuffer = await file.arrayBuffer()

  if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
    const data = new Uint8Array(arrayBuffer)
    const workbook = XLSX.read(data, { type: 'array', raw: true })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    return XLSX.utils.sheet_to_json(sheet, { defval: '' })
  }

  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ arrayBuffer })
    return [{ text: result.value }]
  }

  return [{ fileName: file.name, fileType: ext, size: file.size, message: 'Preview not available for this file type' }]
}

export function FileImport() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)
  const [targetModule, setTargetModule] = useState('guests')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewData, setPreviewData] = useState<{
    headers: string[]
    rows: string[][]
  } | null>(null)
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([])
  const [parsedFileData, setParsedFileData] = useState<ParsedFileData | null>(null)

  const [setupFile, setSetupFile] = useState<SelectedFile | null>(null)

  const [googleUrl, setGoogleUrl] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [googleResult, setGoogleResult] = useState<{
    success: boolean
    data?: Record<string, unknown>[]
    error?: string
  } | null>(null)

  const validateFile = useCallback((file: File): boolean => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast.error('Invalid file type. Please upload .csv, .xlsx, .docx, or .pptx files.')
      return false
    }
    return true
  }, [])

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!validateFile(file)) return
      setSelectedFile({
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || 'application/octet-stream',
      })
      setPreviewData(null)
      setParsedFileData(null)
      setGoogleResult(null)
    },
    [validateFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect],
  )

  const clearFile = useCallback(() => {
    setSelectedFile(null)
    setPreviewData(null)
    setParsedFileData(null)
    setSetupFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const setupFileInputRef = useRef<HTMLInputElement>(null)

  const handleSetupFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSetupFile({
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || 'application/octet-stream',
      })
    }
  }, [])

  const clearSetupFile = useCallback(() => {
    setSetupFile(null)
    if (setupFileInputRef.current) setupFileInputRef.current.value = ''
  }, [])

  const handlePreview = useCallback(async () => {
    if (!selectedFile) return
    setIsUploading(true)
    try {
      const rawData = await parseFileInBrowser(selectedFile.file)

      let setupData = null
      if (setupFile) {
        const setupRaw = await parseFileInBrowser(setupFile.file)
        setupData = parseSetupCsv(setupRaw as SetupRow[])
      }

      const headers = rawData.length > 0 ? Object.keys(rawData[0]) : []
      const rows = rawData.map((item) => headers.map((h) => String(item[h] ?? '')))

      setParsedFileData({ headers, rows, rawData, setupData })
      setPreviewData({ headers, rows })

      if (setupData) {
        useWeddingStore.getState().setGuestSetup(setupData)
      }

      toast.success('File parsed successfully. Review the preview below.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to parse file')
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, targetModule, setupFile])

  const handleConfirmImport = useCallback(async () => {
    if (!selectedFile || !parsedFileData) return
    setIsUploading(true)
    try {
      const rawData = parsedFileData.rawData
      let created: unknown[] = []
      let count = 0

      if (targetModule === 'tasks') {
        const tasks = rawData.map((row, i) => mapCsvRowToTask(row as TaskCsvRow, i))
        const results = await Promise.allSettled(
          tasks.map((t) => client.models.Task.create(t))
        )
        created = results.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<{ data: unknown }>).value.data)
        count = created.length
        if (created.length > 0) {
          useWeddingStore.getState().setTasks(created)
        }
      } else if (targetModule === 'vendors') {
        const vendors = rawData.map((row) => mapCsvRowToVendor(row as VendorCsvRow))
        const results = await Promise.allSettled(
          vendors.map((v) => client.models.Vendor.create(v))
        )
        created = results.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<{ data: unknown }>).value.data)
        count = created.length
        if (created.length > 0) {
          useWeddingStore.getState().setVendors(created)
        }
      } else {
        const guests = rawData.map((row) => mapCsvRowToGuest(row as CsvRow))
        const results = await Promise.allSettled(
          guests.map((g) => client.models.Guest.create(g))
        )
        created = results.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<{ data: unknown }>).value.data)
        count = created.length
        if (created.length > 0) {
          useWeddingStore.getState().setGuests(created)
        }
      }

      if (parsedFileData.setupData) {
        useWeddingStore.getState().setGuestSetup(parsedFileData.setupData)
      }

      setImportHistory((prev) => [
        {
          id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          fileName: selectedFile.name,
          targetModule,
          status: 'success',
          timestamp: new Date().toISOString(),
          rows: count,
        },
        ...prev,
      ])

      const moduleLabel = targetModule === 'tasks' ? 'task(s)' : targetModule === 'vendors' ? 'vendor(s)' : 'guest(s)'
      toast.success(`Successfully imported ${count} ${moduleLabel}.`)
      clearFile()
    } catch (err) {
      setImportHistory((prev) => [
        {
          id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          fileName: selectedFile.name,
          targetModule,
          status: 'error',
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ])
      toast.error(err instanceof Error ? err.message : 'Failed to import data')
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, targetModule, previewData, parsedFileData, clearFile, setupFile])

  const handleGoogleExtract = useCallback(async () => {
    if (!googleUrl.trim()) {
      toast.error('Please enter a Google Docs or Sheets URL.')
      return
    }
    setIsExtracting(true)
    setGoogleResult(null)
    try {
      await new Promise(r => setTimeout(r, 500))
      setGoogleResult({ success: false, error: 'Google integration coming soon' })
      setImportHistory((prev) => [
        {
          id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          fileName: googleUrl,
          targetModule: 'Google',
          status: 'error',
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ])
      toast.error('Google integration coming soon')
    } catch (err) {
      setGoogleResult({
        success: false,
        error: err instanceof Error ? err.message : 'Extraction failed',
      })
      toast.error(err instanceof Error ? err.message : 'Failed to extract Google content')
    } finally {
      setIsExtracting(false)
    }
  }, [googleUrl])

  return (
    <motion.div
      className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileUp className="h-6 w-6 text-rose-500" />
          Import Files
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Import guest lists, budgets, tasks, and more from Excel, Word, or PowerPoint files
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4 text-rose-500" />
              Upload File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-rose-400 bg-rose-50 scale-[1.01]'
                  : 'border-muted-foreground/25 hover:border-rose-300 hover:bg-muted/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.docx,.pptx"
                onChange={handleInputChange}
                className="hidden"
              />
              <div className="mb-3 opacity-60">
                {isDragging ? (
                  <FileUp className="h-10 w-10 text-rose-500" />
                ) : (
                  <Upload className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm font-medium">
                {isDragging ? 'Drop file here...' : 'Drop files here or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports .csv, .xlsx, .docx, .pptx
              </p>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                <div className="shrink-0">{getFileTypeIcon(selectedFile.name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{selectedFile.size}</span>
                    {getFileTypeBadge(selectedFile.name)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={clearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {selectedFile && !previewData && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                  <div className="space-y-1.5 w-full sm:w-48">
                    <Label className="text-xs">Target Module</Label>
                    <Select value={targetModule} onValueChange={setTargetModule}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TARGET_MODULES.map((mod) => (
                          <SelectItem key={mod.value} value={mod.value}>
                            {mod.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                    disabled={isUploading}
                    onClick={handlePreview}
                  >
                    {isUploading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <FileUp className="h-4 w-4" />
                        Preview &amp; Import
                      </span>
                    )}
                  </Button>
                </div>

                {targetModule === 'guests' && (
                  <div className="rounded-lg border border-dashed border-muted-foreground/25 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs font-medium">Setup CSV (optional)</Label>
                        <p className="text-xs text-muted-foreground">
                          Upload the Setup CSV to populate dropdown options for Side, Category, Relationship Group, etc.
                        </p>
                      </div>
                      {!setupFile ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 text-xs"
                          onClick={() => setupFileInputRef.current?.click()}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Choose File
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground truncate max-w-[120px]">{setupFile.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={clearSetupFile}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      <input
                        ref={setupFileInputRef}
                        type="file"
                        accept=".csv,.xlsx"
                        onChange={handleSetupFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {previewData && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Preview ({previewData.rows.length} rows)
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={clearFile}
                  >
                    Cancel
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[300px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {previewData.headers.map((h, i) => (
                            <TableHead key={i} className="text-xs font-semibold whitespace-nowrap">
                              {h}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.rows.slice(0, 50).map((row, ri) => (
                          <TableRow key={ri}>
                            {row.map((cell, ci) => (
                              <TableCell key={ci} className="text-xs py-1.5 max-w-[200px] truncate">
                                {cell}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {previewData.rows.length > 50 && (
                    <p className="text-xs text-muted-foreground text-center py-2 bg-muted/30">
                      Showing first 50 of {previewData.rows.length} rows
                    </p>
                  )}
                </div>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isUploading}
                  onClick={handleConfirmImport}
                >
                  {isUploading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Importing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Confirm Import
                    </span>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cloud className="h-4 w-4 text-blue-500" />
              Google Docs / Sheets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Import content from a public Google Document or Spreadsheet
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="https://docs.google.com/document/d/..."
                value={googleUrl}
                onChange={(e) => setGoogleUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                disabled={isExtracting}
                onClick={handleGoogleExtract}
                className="shrink-0"
              >
                {isExtracting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
                    Extracting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Extract Content
                  </span>
                )}
              </Button>
            </div>

            {googleResult && (
              <div
                className={`p-4 rounded-lg border ${
                  googleResult.success
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-destructive/30 bg-destructive/5'
                }`}
              >
                {googleResult.success ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                      <CheckCircle className="h-4 w-4" />
                      Content extracted successfully
                    </div>
                    {Array.isArray(googleResult.data) && googleResult.data.length > 0 && (
                      <div className="max-h-[200px] overflow-auto text-xs bg-white rounded border p-2">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(googleResult.data.slice(0, 20), null, 2)}
                        </pre>
                        {googleResult.data.length > 20 && (
                          <p className="text-muted-foreground mt-1">
                            ...and {googleResult.data.length - 20} more records
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {googleResult.error}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {importHistory.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Recent Imports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {importHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.targetModule}
                          {item.rows ? ` · ${item.rows} rows` : ''} ·{' '}
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={item.status === 'success' ? 'secondary' : 'destructive'}
                      className="text-[10px] shrink-0"
                    >
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
