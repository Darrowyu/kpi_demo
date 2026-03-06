import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { Select, SelectItem } from '../components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import {
  standardParamApi,
  factoryApi,
  StandardParam,
  StandardParamCreate,
  StandardParamByFactory,
  Factory
} from '../services/standardParam'
import { productApi } from '../services/api'
import { deviceApi } from '../services/api'
import { stationApi } from '../services/api'
import { cn } from '../lib/utils'

// 产品、设备、工站接口
interface Product { id: number; model: string; category?: string }
interface Device { id: number; name: string; device_type?: string }
interface Station { id: number; name: string; description?: string }

// KPI算法定义数据
const kpiAlgorithms = [
  {
    seq: 1,
    name: '工时达成率',
    weight: '10%',
    formula: '实际总工时÷月度标准工时\n（标准工时=应出勤天数×8h）',
    dataSource: '生产日报表「生产时数」求和',
    target: '≥100%',
    grades: { jia: '≥100%', yi: '95%~99%', bing: '90%~94%', ding: '<90%' }
  },
  {
    seq: 2,
    name: '良品达成率',
    weight: '30%',
    formula: 'Σ[(实际良品率÷标准良品率)×工时占比]\n标准见下方参数库',
    dataSource: '生产日报表：良品数÷总产量',
    target: '≥100%',
    grades: { jia: '≥100%', yi: '98%~99%', bing: '95%~97%', ding: '<95%' }
  },
  {
    seq: 3,
    name: '人时产出达成率',
    weight: '30%',
    formula: 'Σ[(实际人时产出÷标准人时产出)×工时占比]\n标准见下方参数库',
    dataSource: '生产日报表：良品数÷生产时数',
    target: '≥100%',
    grades: { jia: '≥100%', yi: '90%~99%', bing: '80%~89%', ding: '<80%' }
  },
  {
    seq: 4,
    name: '返工率控制',
    weight: '15%',
    formula: 'Σ(各产品返工率×产量占比)',
    dataSource: '生产日报表「返工品数量」',
    target: '≤0.5%',
    grades: { jia: '≤0.5%', yi: '0.6%~1%', bing: '1.1%~2%', ding: '>2%' }
  },
  {
    seq: 5,
    name: '报废率控制',
    weight: '15%',
    formula: 'Σ(各产品报废率×产量占比)',
    dataSource: '生产日报表「报废品数量」',
    target: '≤0.1%',
    grades: { jia: '≤0.1%', yi: '0.11%~0.3%', bing: '0.31%~0.5%', ding: '>0.5%' }
  }
]

// 图标组件
const CalculatorIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
)

const DatabaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
)

const FactoryIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const EditIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const EmptyStateIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

export default function StandardParamManager() {
  // 数据状态
  const [factories, setFactories] = useState<Factory[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [paramsByFactory, setParamsByFactory] = useState<StandardParamByFactory[]>([])

  // UI状态
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingParam, setEditingParam] = useState<StandardParam | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'algorithm' | 'params'>('params')

  // 筛选状态
  const [selectedFactory, setSelectedFactory] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [searchKeyword, setSearchKeyword] = useState('')

  // 表单状态
  const [formData, setFormData] = useState<Partial<StandardParamCreate>>({
    factory_id: undefined,
    product_id: undefined,
    device_id: null,
    station_id: undefined,
    standard_output: undefined,
    standard_quality_rate: 0.99,
    standard_rework_limit: 0.005,
    standard_scrap_limit: 0.001,
    note: '',
  })

  // 加载初始数据
  useEffect(() => {
    loadInitialData()
  }, [])

  // 加载标准参数
  useEffect(() => {
    loadParams()
  }, [selectedFactory])

  const loadInitialData = async () => {
    try {
      const [factoriesRes, productsRes, devicesRes, stationsRes] = await Promise.all([
        factoryApi.getAll(),
        productApi.getAll(),
        deviceApi.getAll(),
        stationApi.getAll(),
      ])
      setFactories(factoriesRes.data)
      setProducts(productsRes.data)
      setDevices(devicesRes.data)
      setStations(stationsRes.data)
    } catch (error) {
      console.error('加载基础数据失败', error)
    }
  }

  const loadParams = async () => {
    setLoading(true)
    try {
      const factoryId = selectedFactory ? parseInt(selectedFactory) : undefined
      const response = await standardParamApi.getByFactory(factoryId)
      setParamsByFactory(response.data)
    } catch (error) {
      console.error('加载标准参数失败', error)
    } finally {
      setLoading(false)
    }
  }

  // 筛选后的数据
  const filteredData = useMemo(() => {
    let data = paramsByFactory

    // 按厂区筛选
    if (selectedFactory) {
      data = data.filter(f => f.factory_id.toString() === selectedFactory)
    }

    // 按产品筛选
    if (selectedProduct) {
      data = data.map(f => ({
        ...f,
        products: f.products.filter(p => p.product_id.toString() === selectedProduct)
      })).filter(f => f.products.length > 0)
    }

    // 按关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      data = data.map(f => ({
        ...f,
        products: f.products.map(p => ({
          ...p,
          params: p.params.filter(param =>
            param.product_model.toLowerCase().includes(keyword) ||
            param.station_name.toLowerCase().includes(keyword) ||
            (param.device_name && param.device_name.toLowerCase().includes(keyword))
          )
        })).filter(p => p.params.length > 0)
      })).filter(f => f.products.length > 0)
    }

    return data
  }, [paramsByFactory, selectedFactory, selectedProduct, searchKeyword])

  const resetFilters = () => {
    setSelectedFactory('')
    setSelectedProduct('')
    setSearchKeyword('')
  }

  const handleInputChange = (field: keyof StandardParamCreate, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleOpenDialog = (param?: StandardParam, defaultFactoryId?: number) => {
    if (param) {
      setEditingParam(param)
      setFormData({
        factory_id: param.factory_id,
        product_id: param.product_id,
        device_id: param.device_id,
        station_id: param.station_id,
        standard_output: param.standard_output,
        standard_quality_rate: param.standard_quality_rate,
        standard_rework_limit: param.standard_rework_limit,
        standard_scrap_limit: param.standard_scrap_limit,
        note: param.note,
      })
    } else {
      setEditingParam(null)
      setFormData({
        factory_id: defaultFactoryId || (factories[0]?.id),
        product_id: undefined,
        device_id: null,
        station_id: undefined,
        standard_output: undefined,
        standard_quality_rate: 0.99,
        standard_rework_limit: 0.005,
        standard_scrap_limit: 0.001,
        note: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingParam) {
        await standardParamApi.update(editingParam.id, formData)
      } else {
        await standardParamApi.create(formData as StandardParamCreate)
      }
      setDialogOpen(false)
      loadParams()
    } catch (error) {
      console.error('保存失败', error)
      alert('保存失败，请检查表单数据')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await standardParamApi.delete(id)
      setDeleteConfirmId(null)
      loadParams()
    } catch (error) {
      console.error('删除失败', error)
      alert('删除失败')
    }
  }

  // 统计各厂区参数数量
  const getFactoryStats = (factoryId: number) => {
    const factory = paramsByFactory.find(f => f.factory_id === factoryId)
    if (!factory) return { productCount: 0, paramCount: 0 }
    const paramCount = factory.products.reduce((sum, p) => sum + p.params.length, 0)
    return { productCount: factory.products.length, paramCount }
  }

  return (
    <div className="space-y-5">
      {/* 页面标题区 */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <DatabaseIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">标准参数管理</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">按厂区管理产品-设备-工站标准参数</p>
        </div>
      </div>

      {/* Tab切换区 */}
      <div className="flex">
        <div className="inline-flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('algorithm')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
              activeTab === 'algorithm'
                ? 'bg-zinc-800 dark:bg-zinc-800 text-white dark:text-zinc-100'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
          >
            <CalculatorIcon className="w-4 h-4" />
            KPI核心算法
          </button>
          <button
            onClick={() => setActiveTab('params')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
              activeTab === 'params'
                ? 'bg-zinc-800 dark:bg-zinc-800 text-white dark:text-zinc-100'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
          >
            <DatabaseIcon className="w-4 h-4" />
            厂区标准参数库
          </button>
        </div>
      </div>

      {/* Tab 1: KPI核心算法 */}
      {activeTab === 'algorithm' && (
        <div>
          <Card className="terminal-card overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardHeader className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <CalculatorIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                </div>
                <CardTitle className="text-base font-medium text-zinc-700 dark:text-zinc-200">KPI指标算法定义</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <TableHead className="w-12 text-center text-zinc-500 dark:text-zinc-400 font-medium">序号</TableHead>
                      <TableHead className="w-[100px] text-zinc-500 dark:text-zinc-400 font-medium">KPI指标</TableHead>
                      <TableHead className="w-[60px] text-center text-zinc-500 dark:text-zinc-400 font-medium">权重</TableHead>
                      <TableHead className="w-[180px] text-zinc-500 dark:text-zinc-400 font-medium">计算公式</TableHead>
                      <TableHead className="w-[140px] text-zinc-500 dark:text-zinc-400 font-medium">数据来源</TableHead>
                      <TableHead className="w-[70px] text-center text-zinc-500 dark:text-zinc-400 font-medium">目标值</TableHead>
                      <TableHead className="w-[220px] text-zinc-500 dark:text-zinc-400 font-medium">
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium">甲</span>
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-400/10 text-zinc-700 dark:text-zinc-400 text-[10px] font-medium">乙</span>
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-amber-100 dark:bg-amber-400/10 text-amber-700 dark:text-amber-400 text-[10px] font-medium">丙</span>
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-rose-100 dark:bg-rose-400/10 text-rose-700 dark:text-rose-400 text-[10px] font-medium">丁</span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-500 ml-1">等级标准</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kpiAlgorithms.map((algo) => (
                      <TableRow
                        key={algo.seq}
                        className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      >
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-mono-data">
                            {algo.seq}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-zinc-800 dark:text-zinc-200">{algo.name}</TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-xs">
                            {algo.weight}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="whitespace-pre-line text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{algo.formula}</div>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-500 dark:text-zinc-500">{algo.dataSource}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{algo.target}</span>
                        </TableCell>
                        <TableCell>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-400/10 rounded px-1.5 py-1">
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium">甲</span>
                              <span className="text-zinc-600 dark:text-zinc-400">{algo.grades.jia}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-400/10 rounded px-1.5 py-1">
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-400/20 text-zinc-700 dark:text-zinc-400 text-[10px] font-medium">乙</span>
                              <span className="text-zinc-600 dark:text-zinc-400">{algo.grades.yi}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-400/10 rounded px-1.5 py-1">
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400 text-[10px] font-medium">丙</span>
                              <span className="text-zinc-600 dark:text-zinc-400">{algo.grades.bing}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-400/10 rounded px-1.5 py-1">
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-rose-100 dark:bg-rose-400/20 text-rose-700 dark:text-rose-400 text-[10px] font-medium">丁</span>
                              <span className="text-zinc-600 dark:text-zinc-400">{algo.grades.ding}</span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: 厂区标准参数库 */}
      {activeTab === 'params' && (
        <div className="space-y-5">
          {/* 厂区选择卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {factories.map((factory) => {
              const stats = getFactoryStats(factory.id)
              const isSelected = selectedFactory === factory.id.toString()
              return (
                <Card
                  key={factory.id}
                  onClick={() => setSelectedFactory(isSelected ? '' : factory.id.toString())}
                  className={cn(
                    "cursor-pointer transition-all duration-200 border overflow-hidden bg-white dark:bg-zinc-900",
                    isSelected
                      ? 'border-zinc-400 dark:border-zinc-500 bg-zinc-50 dark:bg-zinc-800/50'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                          isSelected ? 'bg-zinc-200 dark:bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-800'
                        )}>
                          <FactoryIcon className={cn("w-5 h-5", isSelected ? 'text-zinc-700 dark:text-zinc-200' : 'text-zinc-500 dark:text-zinc-400')} />
                        </div>
                        <div>
                          <h3 className="font-medium text-zinc-800 dark:text-zinc-200">{factory.name}</h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-500 font-mono-data">{factory.code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn("text-2xl font-semibold font-mono-data", isSelected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300')}>
                          {stats.paramCount}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-500">参数 / {stats.productCount}产品</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></div>
                          当前选中
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* 筛选工具栏 */}
          <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 items-end justify-between">
                <div className="flex flex-wrap gap-3 items-end">
                  {/* 产品型号下拉 */}
                  <div className="w-44">
                    <Label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">产品型号</Label>
                    <Select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="rounded-lg h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
                      <SelectItem value="">全部产品</SelectItem>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.model}</SelectItem>
                      ))}
                    </Select>
                  </div>
                  {/* 搜索框 */}
                  <div className="w-60">
                    <Label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">搜索</Label>
                    <div className="relative">
                      <SearchIcon className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        placeholder="搜索产品、工站、设备..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="pl-9 rounded-lg h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                      />
                    </div>
                  </div>
                  {/* 重置按钮 */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="rounded-lg h-9 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  >
                    <RefreshIcon className="w-4 h-4 mr-2" />
                    重置
                  </Button>
                </div>
                {/* 新增参数按钮 */}
                <Button
                  size="sm"
                  onClick={() => handleOpenDialog()}
                  className="rounded-lg h-9 bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  新增参数
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 参数列表 */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-500 dark:border-t-zinc-400 rounded-full animate-spin"></div>
                <span className="text-zinc-500 dark:text-zinc-500 text-sm">加载中...</span>
              </div>
            </div>
          ) : filteredData.length === 0 ? (
            /* 空状态 */
            <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <EmptyStateIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
                </div>
                <h3 className="text-base font-medium text-zinc-700 dark:text-zinc-300 mb-1">暂无数据</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-4">当前筛选条件下没有找到标准参数数据</p>
                <Button
                  size="sm"
                  onClick={() => handleOpenDialog()}
                  className="rounded-lg bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  添加第一个参数
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredData.map((factoryData) => (
                <Card
                  key={factoryData.factory_id}
                  className="terminal-card overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                >
                  {/* 厂区标题 */}
                  <CardHeader className="bg-zinc-100 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                          <span className="text-zinc-700 dark:text-zinc-300 font-bold text-xs">
                            {factoryData.factory_name.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{factoryData.factory_name}</CardTitle>
                          <p className="text-xs text-zinc-500 dark:text-zinc-500 font-mono-data">{factoryData.factory_code}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-xs">
                        {factoryData.products.reduce((sum, p) => sum + p.params.length, 0)} 条参数
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {factoryData.products.map((productData) => (
                      <div key={productData.product_id} className="border-b border-zinc-200 dark:border-zinc-800 last:border-b-0">
                        {/* 产品型号标题 */}
                        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-xs">
                              {productData.product_model}
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-500">
                              {productData.params.length} 个工站
                            </span>
                          </div>
                        </div>
                        {/* 参数表格 */}
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                              <TableHead className="w-[90px] text-zinc-500 dark:text-zinc-400 font-medium text-xs">工站</TableHead>
                              <TableHead className="w-[100px] text-zinc-500 dark:text-zinc-400 font-medium text-xs">设备</TableHead>
                              <TableHead className="w-[80px] text-right text-zinc-500 dark:text-zinc-400 font-medium text-xs">标准产出</TableHead>
                              <TableHead className="w-[70px] text-right text-zinc-500 dark:text-zinc-400 font-medium text-xs">良品率</TableHead>
                              <TableHead className="w-[70px] text-right text-zinc-500 dark:text-zinc-400 font-medium text-xs">返工上限</TableHead>
                              <TableHead className="w-[70px] text-right text-zinc-500 dark:text-zinc-400 font-medium text-xs">报废上限</TableHead>
                              <TableHead className="text-zinc-500 dark:text-zinc-400 font-medium text-xs">备注</TableHead>
                              <TableHead className="w-[80px] text-center text-zinc-500 dark:text-zinc-400 font-medium text-xs">操作</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {productData.params.map((param) => (
                              <TableRow key={param.id} className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                <TableCell className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">{param.station_name}</TableCell>
                                <TableCell className="text-zinc-500 dark:text-zinc-400 text-sm">{param.device_name || '手工'}</TableCell>
                                <TableCell className="text-right font-medium text-zinc-700 dark:text-zinc-300 font-mono-data text-sm">
                                  {param.standard_output.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="text-emerald-600 dark:text-emerald-400 font-mono-data text-sm">
                                    {(param.standard_quality_rate * 100).toFixed(1)}%
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="text-amber-600 dark:text-amber-400 font-mono-data text-sm">
                                    {(param.standard_rework_limit * 100).toFixed(1)}%
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="text-rose-600 dark:text-rose-400 font-mono-data text-sm">
                                    {(param.standard_scrap_limit * 100).toFixed(1)}%
                                  </span>
                                </TableCell>
                                <TableCell className="text-zinc-500 dark:text-zinc-500 text-xs max-w-[150px] truncate">
                                  {param.note || '-'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                                      onClick={() => handleOpenDialog(param)}
                                    >
                                      <EditIcon className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400"
                                      onClick={() => setDeleteConfirmId(param.id)}
                                    >
                                      <TrashIcon className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 新增/编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100">
          <DialogHeader className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <DialogTitle className="text-base font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                {editingParam ? <EditIcon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> : <PlusIcon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />}
              </div>
              {editingParam ? '编辑标准参数' : '新增标准参数'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* 第一行：厂区 + 产品型号 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="factory" className="text-zinc-500 dark:text-zinc-400 text-xs">
                  厂区 <span className="text-rose-500 dark:text-rose-400">*</span>
                </Label>
                <Select
                  id="factory"
                  value={formData.factory_id?.toString() || ''}
                  onChange={(e) => handleInputChange('factory_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="rounded-lg h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                >
                  <SelectItem value="">请选择厂区</SelectItem>
                  {factories.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product" className="text-zinc-500 dark:text-zinc-400 text-xs">
                  产品型号 <span className="text-rose-500 dark:text-rose-400">*</span>
                </Label>
                <Select
                  id="product"
                  value={formData.product_id?.toString() || ''}
                  onChange={(e) => handleInputChange('product_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="rounded-lg h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                >
                  <SelectItem value="">请选择产品</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.model}</SelectItem>
                  ))}
                </Select>
              </div>
            </div>
            {/* 第二行：设备 + 工站 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="device" className="text-zinc-500 dark:text-zinc-400 text-xs">设备</Label>
                <Select
                  id="device"
                  value={formData.device_id?.toString() || 'null'}
                  onChange={(e) => handleInputChange('device_id', e.target.value === 'null' ? null : parseInt(e.target.value))}
                  className="rounded-lg h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                >
                  <SelectItem value="null">手工</SelectItem>
                  {devices.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="station" className="text-zinc-500 dark:text-zinc-400 text-xs">
                  工站 <span className="text-rose-500 dark:text-rose-400">*</span>
                </Label>
                <Select
                  id="station"
                  value={formData.station_id?.toString() || ''}
                  onChange={(e) => handleInputChange('station_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="rounded-lg h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                >
                  <SelectItem value="">请选择工站</SelectItem>
                  {stations.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </Select>
              </div>
            </div>
            {/* 第三行：标准产出 */}
            <div className="space-y-1.5">
              <Label htmlFor="output" className="text-zinc-500 dark:text-zinc-400 text-xs">
                标准产出 <span className="text-zinc-500 dark:text-zinc-500">(件/h)</span> <span className="text-rose-500 dark:text-rose-400">*</span>
              </Label>
              <Input
                id="output"
                type="number"
                min={0}
                value={formData.standard_output || ''}
                onChange={(e) => handleInputChange('standard_output', parseFloat(e.target.value) || undefined)}
                placeholder="请输入标准产出"
                className="h-9 rounded-lg bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
              />
            </div>
            {/* 第四行：良品率 + 返工上限 + 报废上限 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="quality" className="text-zinc-500 dark:text-zinc-400 text-xs">良品率</Label>
                <Input
                  id="quality"
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={formData.standard_quality_rate ?? ''}
                  onChange={(e) => handleInputChange('standard_quality_rate', parseFloat(e.target.value))}
                  placeholder="0.99"
                  className="h-9 rounded-lg bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rework" className="text-zinc-500 dark:text-zinc-400 text-xs">返工上限</Label>
                <Input
                  id="rework"
                  type="number"
                  min={0}
                  max={1}
                  step={0.001}
                  value={formData.standard_rework_limit ?? ''}
                  onChange={(e) => handleInputChange('standard_rework_limit', parseFloat(e.target.value))}
                  placeholder="0.005"
                  className="h-9 rounded-lg bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="scrap" className="text-zinc-500 dark:text-zinc-400 text-xs">报废上限</Label>
                <Input
                  id="scrap"
                  type="number"
                  min={0}
                  max={1}
                  step={0.001}
                  value={formData.standard_scrap_limit ?? ''}
                  onChange={(e) => handleInputChange('standard_scrap_limit', parseFloat(e.target.value))}
                  placeholder="0.001"
                  className="h-9 rounded-lg bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>
            {/* 第五行：备注 */}
            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-zinc-500 dark:text-zinc-400 text-xs">备注</Label>
              <Textarea
                id="note"
                value={formData.note || ''}
                onChange={(e) => handleInputChange('note', e.target.value)}
                placeholder="请输入备注信息"
                rows={2}
                className="resize-none rounded-lg bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
          <DialogFooter className="border-t border-zinc-200 dark:border-zinc-800 pt-3 gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="rounded-lg h-8 px-4 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
              取消
            </Button>
            <Button size="sm" onClick={handleSave} className="rounded-lg h-8 px-4 bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200">
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100">
          <DialogHeader className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <DialogTitle className="text-base font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center">
                <TrashIcon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              </div>
              确认删除
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center">
              确定要删除这条标准参数吗？<br />
              <span className="text-xs text-zinc-500 dark:text-zinc-500">此操作不可撤销</span>
            </p>
          </div>
          <DialogFooter className="border-t border-zinc-200 dark:border-zinc-800 pt-3 gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)} className="rounded-lg h-8 px-4 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
              取消
            </Button>
            <Button size="sm" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} className="rounded-lg h-8 px-4 bg-rose-600 dark:bg-rose-500 hover:bg-rose-700 dark:hover:bg-rose-600 text-white">
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
