import { useState, useRef, useCallback } from 'react'
import {
  UploadCloud,
  X,
  CalendarIcon,
  FileSpreadsheet,
  Calculator,
  CheckCircle2,
  FileUp,
  ArrowRight,
  Database
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { uploadApi } from '../services/upload'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Calendar } from '../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { cn } from '../lib/utils'

interface UploadResult {
  sheet: string
  employee: string
  imported: number
}

const FileDropZone = ({
  file,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  fileInputRef,
  onFileSelect,
}: {
  file: File | null
  isDragging: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onClick: () => void
  fileInputRef: React.RefObject<HTMLInputElement>
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => (
  <div
    onClick={onClick}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
    className={cn(
      "relative flex flex-col items-center justify-center w-full h-64 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200",
      isDragging
        ? "border-blue-400 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
        : file
          ? "border-emerald-500/50 bg-emerald-500/5"
          : "border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/50"
    )}
  >
    <input
      ref={fileInputRef}
      type="file"
      accept=".xlsx,.xls"
      onChange={onFileSelect}
      className="hidden"
    />

    <div className="relative z-10 flex flex-col items-center justify-center">
      <div
        className={cn(
          "w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-all duration-200",
          isDragging && "scale-105"
        )}
      >
        {file ? (
          <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center dark:bg-emerald-500/10">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
        ) : (
          <div className={cn(
            "w-16 h-16 rounded-xl flex items-center justify-center transition-colors duration-200",
            isDragging ? "bg-blue-100 dark:bg-blue-900/30" : "bg-zinc-100 dark:bg-zinc-800"
          )}>
            <UploadCloud className={cn(
              "w-8 h-8 transition-colors duration-200",
              isDragging ? "text-blue-600 dark:text-blue-400" : "text-zinc-500 dark:text-zinc-400"
            )} />
          </div>
        )}
      </div>

      <p className="text-sm text-zinc-700 font-medium mb-1 dark:text-zinc-300">
        {file ? '文件已选择' : (
          <>
            <span className="text-zinc-900 dark:text-zinc-100">点击上传</span>
            <span className="text-zinc-500 dark:text-zinc-500"> 或拖拽文件到此处</span>
          </>
        )}
      </p>
      <p className="text-xs text-zinc-400 dark:text-zinc-600">
        支持 Excel 格式 (.xlsx, .xls)
      </p>
    </div>
  </div>
)

const FilePreview = ({
  file,
  onRemove
}: {
  file: File
  onRemove: () => void
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/20">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center dark:bg-emerald-500/10">
          <FileSpreadsheet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{file.name}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">{formatFileSize(file.size)}</p>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-100 transition-all duration-200 dark:hover:text-rose-400 dark:hover:bg-rose-500/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function DataUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [month, setMonth] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<UploadResult[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile)
      setResults([])
      setUploadSuccess(false)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResults([])
      setUploadSuccess(false)
    }
  }, [])

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    try {
      const monthStr = format(month, 'yyyy-MM')
      const response = await uploadApi.uploadProductionRecords(file, monthStr)
      setResults(response.data.results || [])
      setUploadSuccess(true)
    } catch (error) {
      console.error('上传失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoToKPI = () => {
    const monthStr = format(month, 'yyyy-MM')
    navigate(`/kpi-calculation?month=${monthStr}`)
  }

  const removeFile = () => {
    setFile(null)
    setResults([])
    setUploadSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center dark:bg-zinc-800">
          <FileUp className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">数据上传</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">上传Excel生产记录文件，支持批量导入</p>
        </div>
      </div>

      {/* 上传配置区 */}
      <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <CardHeader className="px-4 pt-4 pb-3">
          <CardTitle className="text-base font-medium text-zinc-800 dark:text-zinc-200">上传配置</CardTitle>
          <CardDescription className="text-zinc-500 text-sm dark:text-zinc-500">
            选择数据所属月份并上传生产记录文件
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          {/* 月份选择器 */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-zinc-500 min-w-[60px] dark:text-zinc-400">数据月份</label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal rounded-lg h-10 bg-white border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 text-zinc-800 dark:bg-zinc-950 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:text-zinc-200",
                    !month && "text-zinc-500 dark:text-zinc-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-zinc-500 dark:text-zinc-500" />
                  {month ? format(month, 'yyyy年MM月', { locale: zhCN }) : '选择月份'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-lg bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800" align="start">
                <Calendar
                  mode="single"
                  selected={month}
                  onSelect={(date: Date | undefined) => {
                    if (date) {
                      setMonth(date)
                      setCalendarOpen(false)
                    }
                  }}
                  initialFocus
                  defaultMonth={month}
                  className="bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 拖拽上传区 */}
          <FileDropZone
            file={file}
            isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
          />

          {/* 已选文件显示 */}
          {file && <FilePreview file={file} onRemove={removeFile} />}

          {/* 上传按钮 */}
          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            className={cn(
              "w-full h-11 text-sm font-medium rounded-lg transition-all duration-200",
              !file
                ? "bg-zinc-200 text-zinc-500 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-500"
                : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            )}
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-900 dark:border-t-transparent" />
                正在导入数据...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                {uploadSuccess ? '重新上传' : '开始导入'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 上传结果表格 */}
      {results.length > 0 && (
        <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="px-4 pt-4 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center dark:bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base font-medium text-zinc-800 dark:text-zinc-200">导入成功</CardTitle>
                <CardDescription className="text-zinc-500 text-sm dark:text-zinc-500">
                  共导入 <span className="font-medium text-emerald-600 dark:text-emerald-400">{results.reduce((sum, r) => sum + r.imported, 0)}</span> 条记录
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleGoToKPI}
              size="sm"
              className="rounded-lg h-9 px-4 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Calculator className="h-4 w-4 mr-2" />
              去计算KPI
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-100 border-b border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-800 dark:hover:bg-zinc-800">
                    <TableHead className="font-medium text-zinc-600 dark:text-zinc-400">Sheet名称</TableHead>
                    <TableHead className="font-medium text-zinc-600 dark:text-zinc-400">员工</TableHead>
                    <TableHead className="font-medium text-zinc-600 dark:text-zinc-400 text-right">导入记录数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index} className="border-b border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                      <TableCell className="font-medium text-zinc-800 dark:text-zinc-200">{result.sheet}</TableCell>
                      <TableCell className="text-zinc-500 dark:text-zinc-400">{result.employee}</TableCell>
                      <TableCell className="text-right">
                        <span className="badge-status-success">
                          {result.imported}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
