'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
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
import { Separator } from '@/components/ui/separator'

// ── Types ──────────────────────────────────────────────────────────────────
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

// ── Constants ──────────────────────────────────────────────────────────────
const TARGET_MODULES = [
  { value: 'guests', label: 'Guests' },
  { value: 'budget', label: 'Budget' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'vendors', label: 'Vendors' },
  { value: 'notes', label: 'General Notes' },
] as const

const ACCEPTED_EXTENSIONS = ['.xlsx', '.docx', '.pptx']

// ── Animation ──────────────────────────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────────────────────────
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileTypeIcon(fileName: string) {
  const ext = fileName.toLowerCase().split('.').pop()
  switch (ext) {
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

// ── Component ──────────────────────────────────────────────────────────────
export function FileImport() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // File upload state
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)
  const [targetModule, setTargetModule] = useState('guests')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewData, setPreviewData] = useState<{
    headers: string[]
    rows: string[][]
  } | null>(null)
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([])

  // Google import state
  const [googleUrl, setGoogleUrl] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [googleResult, setGoogleResult] = useState<{
    success: boolean
    data?: Record<string, unknown>[]
    error?: string
  } | null>(null)

  // ── File handling ────────────────────────────────────────────────────────
  const validateFile = useCallback((file: File): boolean => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast.error('Invalid file type. Please upload .xlsx, .docx, or .pptx files.')
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
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // ── Upload & Preview ────────────────────────────────────────────────────
  const handlePreview = useCallback(async () => {
    if (!selectedFile) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile.file)
      formData.append('targetModule', targetModule)

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(err.error || 'Upload failed')
      }

      const data = await res.json()
      if (data.headers && data.rows) {
        setPreviewData({ headers: data.headers, rows: data.rows })
        toast.success('File parsed successfully. Review the preview below.')
      } else if (data.data) {
        // Handle non-tabular data
        const arr = Array.isArray(data.data) ? data.data : [data.data]
        const headers = Object.keys(arr[0] ?? {})
        const rows = arr.map((item: Record<string, unknown>) =>
          headers.map((h) => String(item[h] ?? '')),
        )
        setPreviewData({ headers, rows })
        toast.success('File parsed successfully. Review the preview below.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to parse file')
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, targetModule])

  const handleConfirmImport = useCallback(async () => {
    if (!selectedFile) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile.file)
      formData.append('targetModule', targetModule)
      formData.append('confirm', 'true')

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Import failed' }))
        throw new Error(err.error || 'Import failed')
      }

      const data = await res.json()
      const rowCount = previewData?.rows.length ?? data.count ?? 0

      setImportHistory((prev) => [
        {
          id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          fileName: selectedFile.name,
          targetModule,
          status: 'success',
          timestamp: new Date().toISOString(),
          rows: rowCount,
        },
        ...prev,
      ])

      toast.success(`Successfully imported ${rowCount} record(s) into ${targetModule}.`)
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
  }, [selectedFile, targetModule, previewData, clearFile])

  // ── Google Import ────────────────────────────────────────────────────────
  const handleGoogleExtract = useCallback(async () => {
    if (!googleUrl.trim()) {
      toast.error('Please enter a Google Docs or Sheets URL.')
      return
    }
    setIsExtracting(true)
    setGoogleResult(null)
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: googleUrl.trim(), source: 'google' }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Extraction failed' }))
        throw new Error(err.error || 'Extraction failed')
      }

      const data = await res.json()
      setGoogleResult({ success: true, data: data.data ?? data })

      setImportHistory((prev) => [
        {
          id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          fileName: new URL(googleUrl).hostname,
          targetModule: 'Google',
          status: 'success',
          timestamp: new Date().toISOString(),
          rows: Array.isArray(data.data) ? data.data.length : 1,
        },
        ...prev,
      ])

      toast.success('Content extracted successfully from Google.')
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

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileUp className="h-6 w-6 text-rose-500" />
          Import Files
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Import guest lists, budgets, tasks, and more from Excel, Word, or PowerPoint files
        </p>
      </motion.div>

      {/* File Upload Zone */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4 text-rose-500" />
              Upload File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop Zone */}
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
                accept=".xlsx,.docx,.pptx"
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
                Supports .xlsx, .docx, .pptx
              </p>
            </div>

            {/* Selected File Info */}
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

            {/* Target Module + Preview Button */}
            {selectedFile && !previewData && (
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
            )}

            {/* Preview Table */}
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

      {/* Google Docs/Sheets Import */}
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

            {/* Google Result */}
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

      {/* Import History */}
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