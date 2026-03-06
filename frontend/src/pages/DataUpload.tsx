import { useState, useRef, useCallback } from 'react'
import {
  UploadCloud,
  X,
  CalendarIcon,
  FileSpreadsheet,
  Calculator,
  CheckCircle2,
  FileUp,
  Sparkles,
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
import '../styles/animations.css'

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
      "relative flex flex-col items-center justify-center w-full h-72 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 overflow-hidden",
      isDragging
        ? "border-cyan-500 bg-cyan-50/50"
        : file
          ? "border-emerald-400 bg-emerald-50/30"
          : "border-slate-200 bg-white hover:border-cyan-400 hover:bg-slate-50/50"
    )}
    style={{
      boxShadow: isDragging
        ? '0 0 40px rgba(8, 145, 178, 0.15), inset 0 0 20px rgba(8, 145, 178, 0.05)'
        : 'inset 0 2px 4px rgba(0, 0, 0, 0.02)',
    }}
  >
    <input
      ref={fileInputRef}
      type="file"
      accept=".xlsx,.xls"
      onChange={onFileSelect}
      className="hidden"
    />

    {/* 背景装饰 */}
    <div className="absolute inset-0 opacity-30">
      <div
        className="absolute top-10 left-10 w-32 h-32 rounded-full blur-3xl"
        style={{ background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.2), rgba(79, 70, 229, 0.1))' }}
      />
      <div
        className="absolute bottom-10 right-10 w-40 h-40 rounded-full blur-3xl"
        style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(249, 115, 22, 0.1))' }}
      />
    </div>

    <div className="relative z-10 flex flex-col items-center justify-center">
      <div
        className={cn(
          "w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300",
          isDragging && "scale-110"
        )}
        style={{
          background: isDragging
            ? 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)'
            : file
              ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
              : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
          boxShadow: isDragging || file
            ? '0 8px 30px rgba(0, 0, 0, 0.2)'
            : '0 4px 14px rgba(0, 0, 0, 0.08)',
        }}
      >
        {file ? (
          <CheckCircle2 className="w-10 h-10 text-white" />
        ) : (
          <UploadCloud className={cn(
            "w-10 h-10 transition-colors duration-300",
            isDragging ? "text-white" : "text-slate-400"
          )} />
        )}
      </div>

      <p className="text-base text-slate-700 font-medium mb-2">
        {file ? '文件已选择' : (
          <>
            <span className="text-cyan-600 font-semibold">点击上传</span> 或拖拽文件到此处
          </>
        )}
      </p>
      <p className="text-sm text-slate-400">
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
    <div
      className="flex items-center justify-between p-5 rounded-2xl animate-scale-in"
      style={{
        background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)',
        border: '1px solid rgba(5, 150, 105, 0.2)',
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
          }}
        >
          <FileSpreadsheet className="h-7 w-7 text-white" />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-800">{file.name}</p>
          <p className="text-sm text-slate-400">{formatFileSize(file.size)}</p>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
      >
        <X className="h-5 w-5" />
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
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #0891b2 0%, #4f46e5 100%)',
            boxShadow: '0 4px 14px rgba(8, 145, 178, 0.35)',
          }}
        >
          <FileUp className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">数据上传</h1>
          <p className="text-slate-500">上传Excel生产记录文件，支持批量导入</p>
        </div>
      </div>

      {/* 上传配置区 */}
      <Card
        className="border-0 overflow-hidden animate-slide-up relative"
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.05)',
          animationDelay: '100ms',
        }}
      >
        <CardHeader className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg font-bold text-slate-800">上传配置</CardTitle>
          </div>
          <CardDescription className="text-slate-500 ml-8">
            选择数据所属月份并上传生产记录文件
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 space-y-6">
          {/* 月份选择器 */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-slate-700 min-w-[60px]">数据月份</label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal rounded-xl h-12 border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/30",
                    !month && "text-slate-400"
                  )}
                >
                  <CalendarIcon className="mr-3 h-4 w-4 text-cyan-600" />
                  {month ? format(month, 'yyyy年MM月', { locale: zhCN }) : '选择月份'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
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
            className="w-full h-14 text-base font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
            style={{
              background: !file
                ? '#e2e8f0'
                : loading
                  ? 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)'
                  : 'linear-gradient(135deg, #0891b2 0%, #4f46e5 100%)',
              boxShadow: file && !loading ? '0 8px 30px rgba(8, 145, 178, 0.35)' : 'none',
            }}
          >
            {loading ? (
              <>
                <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                正在导入数据...
              </>
            ) : (
              <>
                <Database className="mr-3 h-5 w-5" />
                {uploadSuccess ? '重新上传' : '开始导入'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 上传结果表格 */}
      {results.length > 0 && (
        <Card
          className="border-0 overflow-hidden animate-slide-up relative"
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.05)',
            animationDelay: '200ms',
          }}
        >
          <CardHeader className="px-8 pt-8 pb-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
                }}
              >
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">导入成功</CardTitle>
                <CardDescription className="text-slate-500">
                  共导入 <span className="font-semibold text-emerald-600">{results.reduce((sum, r) => sum + r.imported, 0)}</span> 条记录
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleGoToKPI}
              className="rounded-xl h-11 px-6 font-semibold"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
              }}
            >
              <Calculator className="h-4 w-4 mr-2" />
              去计算KPI
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="font-semibold text-slate-600">Sheet名称</TableHead>
                    <TableHead className="font-semibold text-slate-600">员工</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-right">导入记录数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index} className="hover:bg-slate-50/60">
                      <TableCell className="font-medium text-slate-700">{result.sheet}</TableCell>
                      <TableCell className="text-slate-600">{result.employee}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                          style={{
                            background: 'rgba(5, 150, 105, 0.1)',
                            color: '#059669',
                          }}
                        >
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
