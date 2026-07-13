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
import { Upload, FileUp, CheckCircle, X, Table2 } from 'lucide-react'

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
      const formData = new FormData()
      formData.append('file', file)
      formData.append('targetModule', targetModule)

      const res = await fetch('/api/import', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to parse file' }))
        throw new Error(err.error || 'Failed to parse file')
      }

      const data = await res.json()
      if (data.headers && data.rows) {
        setPreviewData({ headers: data.headers, rows: data.rows })
        toast.success(`Parsed ${data.rows.length} rows`)
      }
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
      const formData = new FormData()
      formData.append('file', file)
      formData.append('targetModule', targetModule)
      formData.append('confirm', 'true')

      const res = await fetch('/api/import', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to import' }))
        throw new Error(err.error || 'Failed to import')
      }

      const data = await res.json()
      if (data.data && Array.isArray(data.data)) {
        onImport(data.data)
      }

      toast.success(`Successfully imported ${data.count ?? previewData?.rows.length ?? 0} item(s).`)
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
          {/* File input */}
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

          {/* Preview button */}
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

          {/* Preview table */}
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
