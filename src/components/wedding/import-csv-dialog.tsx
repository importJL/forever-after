'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { client } from '@/lib/amplify-client'
import * as XLSX from 'xlsx'
import { Upload, FileUp, CheckCircle, X, Table2 } from 'lucide-react'

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
  const str = typeof value === 'string' ? value.trim() : String(value ?? '')
  if (!str) return 0
  const match = str.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

function parseString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  return ''
}

interface PreviewData {
  headers: string[]
  rows: string[][]
}

interface ImportCsvDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetModule: string
  onImport: (data: unknown[]) => void
  title: string
}

export function ImportCsvDialog({ open, onOpenChange, targetModule, onImport, title }: ImportCsvDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file')
      return
    }
    setFile(f)
    setPreviewData(null)
  }

  const clearFile = () => {
    setFile(null)
    setPreviewData(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePreview = async () => {
    if (!file) return
    setIsUploading(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)
      const workbook = XLSX.read(data, { type: 'array', raw: true })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, unknown>[]

      if (jsonData.length === 0) {
        toast.error('File is empty')
        return
      }

      const headers = Object.keys(jsonData[0])
      const rows = jsonData.map((item) => headers.map((h) => String(item[h] ?? '')))
      setPreviewData({ headers, rows })
      toast.success(`Parsed ${rows.length} rows`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to parse file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleConfirmImport = async () => {
    if (!file) return
    setIsUploading(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)
      const workbook = XLSX.read(data, { type: 'array', raw: true })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, unknown>[]

      let created: unknown[] = []

      if (targetModule === 'vendors') {
        const vendors = jsonData.map((row) => ({
          name: parseString(row.Company || row.Name || row.name),
          category: parseString(row.Categories || row.Category || row.category),
          contactPerson: '',
          email: '',
          phone: '',
          website: '',
          address: '',
          district: '',
          city: 'Hong Kong',
          price: parsePrice(row['Reference Rate'] || row.Price || row.price),
          depositPaid: 0,
          status: 'considering' as const,
          rating: 0,
          notes: [parseString(row.Content || row.Notes || row.notes), parseString(row.Remark || row.Remarks)].filter(Boolean).join(' - '),
          contractDate: '',
        }))
        const results = await Promise.allSettled(
          vendors.map((v) => client.models.Vendor.create(v))
        )
        created = results.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<{ data: unknown }>).value.data)
      } else if (targetModule === 'tasks') {
        const tasks = jsonData.map((row, i) => ({
          title: parseString(row.Task || row.Title || row.title),
          description: '',
          category: parseString(row.Topic || row.Category || row.category) || 'Other',
          priority: 'medium' as const,
          status: 'todo' as const,
          dueDate: parseTimelineToDueDate(parseString(row.Timeline || row['Due Date'] || row.dueDate)),
          assignee: '',
          notes: '',
          sortOrder: i,
        }))
        const results = await Promise.allSettled(
          tasks.map((t) => client.models.Task.create(t))
        )
        created = results.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<{ data: unknown }>).value.data)
      }

      if (created.length > 0) {
        onImport(created)
      }

      toast.success(`Successfully imported ${created.length} item(s).`)
      onOpenChange(false)
      clearFile()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to import')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-rose-500" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose CSV File
            </Button>
            {file && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Table2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-foreground">{file.name}</span>
                  <span>({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={clearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {file && !previewData && (
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
                  Preview
                </span>
              )}
            </Button>
          )}

          {previewData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Preview ({previewData.rows.length} rows)
                </h3>
                <Button
                  variant="ghost"
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
