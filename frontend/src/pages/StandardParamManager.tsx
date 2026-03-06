import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { Select, SelectItem } from '../components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Badge } from '../components/ui/badge'
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

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-zinc-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 页面标题区 */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">KPI算法与标准库</h1>
          <p className="text-sm text-zinc-500 mt-2">按厂区管理产品-设备-工站标准参数</p>
        </div>

        {/* Tab切换区 - Pill样式 */}
        <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="inline-flex bg-zinc-100/80 p-1.5 rounded-full shadow-sm">
            <button
              onClick={() => setActiveTab('algorithm')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === 'algorithm'
                  ? 'bg-white text-orange-600 shadow-md ring-1 ring-orange-100'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <CalculatorIcon className="w-4 h-4" />
              KPI核心算法
            </button>
            <button
              onClick={() => setActiveTab('params')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === 'params'
                  ? 'bg-white text-orange-600 shadow-md ring-1 ring-orange-100'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <DatabaseIcon className="w-4 h-4" />
              厂区标准参数库
            </button>
          </div>
        </div>

        {/* Tab 1: KPI核心算法 */}
        {activeTab === 'algorithm' && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {/* 玻璃态卡片容器 */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-orange-100/50 bg-gradient-to-r from-orange-50/30 to-transparent pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-200">
                    <CalculatorIcon className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-zinc-800">KPI指标算法定义</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-orange-50/50 hover:bg-orange-50/50 border-b border-orange-100">
                        <TableHead className="w-[60px] text-center text-zinc-700 font-semibold">序号</TableHead>
                        <TableHead className="w-[120px] text-zinc-700 font-semibold">KPI指标</TableHead>
                        <TableHead className="w-[80px] text-center text-zinc-700 font-semibold">权重</TableHead>
                        <TableHead className="w-[220px] text-zinc-700 font-semibold">计算公式</TableHead>
                        <TableHead className="w-[160px] text-zinc-700 font-semibold">数据来源</TableHead>
                        <TableHead className="w-[80px] text-center text-zinc-700 font-semibold">目标值</TableHead>
                        <TableHead className="w-[280px] text-zinc-700 font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-xs font-bold">甲</span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-bold">乙</span>
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-xs font-bold">丙</span>
                            <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-bold">丁</span>
                            <span className="text-xs text-zinc-400 ml-1">等级标准</span>
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kpiAlgorithms.map((algo, index) => (
                        <TableRow
                          key={algo.seq}
                          className="hover:bg-orange-50/30 transition-colors border-b border-zinc-100 last:border-b-0"
                          style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                        >
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-100 text-zinc-600 text-sm font-semibold">
                              {algo.seq}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold text-zinc-800">{algo.name}</TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border-orange-200 font-semibold px-3 py-1">
                              {algo.weight}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="whitespace-pre-line text-sm text-zinc-600 leading-relaxed">{algo.formula}</div>
                          </TableCell>
                          <TableCell className="text-sm text-zinc-500">{algo.dataSource}</TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-bold text-orange-600">{algo.target}</span>
                          </TableCell>
                          <TableCell>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1.5 bg-green-50/50 rounded-lg px-2 py-1.5">
                                <span className="w-5 h-5 rounded-md bg-green-100 text-green-700 flex items-center justify-center text-[10px] font-bold">甲</span>
                                <span className="text-zinc-600 font-medium">{algo.grades.jia}</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-blue-50/50 rounded-lg px-2 py-1.5">
                                <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">乙</span>
                                <span className="text-zinc-600 font-medium">{algo.grades.yi}</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-amber-50/50 rounded-lg px-2 py-1.5">
                                <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold">丙</span>
                                <span className="text-zinc-600 font-medium">{algo.grades.bing}</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-red-50/50 rounded-lg px-2 py-1.5">
                                <span className="w-5 h-5 rounded-md bg-red-100 text-red-700 flex items-center justify-center text-[10px] font-bold">丁</span>
                                <span className="text-zinc-600 font-medium">{algo.grades.ding}</span>
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
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {/* 厂区选择卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {factories.map((factory, index) => {
                const stats = getFactoryStats(factory.id)
                const isSelected = selectedFactory === factory.id.toString()
                return (
                  <Card
                    key={factory.id}
                    onClick={() => setSelectedFactory(isSelected ? '' : factory.id.toString())}
                    className={`cursor-pointer transition-all duration-300 border-2 overflow-hidden group ${
                      isSelected
                        ? 'border-orange-400 shadow-lg shadow-orange-100 ring-2 ring-orange-100'
                        : 'border-transparent hover:border-orange-200 hover:shadow-md'
                    }`}
                    style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-gradient-to-br from-orange-400 to-orange-500'
                              : 'bg-orange-100 group-hover:bg-orange-200'
                          }`}>
                            <FactoryIcon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-orange-600'}`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-zinc-800 text-lg">{factory.name}</h3>
                            <p className="text-sm text-zinc-500 font-medium">{factory.code}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${isSelected ? 'text-orange-600' : 'text-zinc-700'}`}>
                            {stats.paramCount}
                          </div>
                          <div className="text-xs text-zinc-400 font-medium">参数 / {stats.productCount}产品</div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-orange-100">
                          <div className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
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
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardContent className="p-5">
                <div className="flex flex-wrap gap-4 items-end justify-between">
                  <div className="flex flex-wrap gap-4 items-end">
                    {/* 产品型号下拉 */}
                    <div className="w-52">
                      <Label className="mb-2 block text-sm font-medium text-zinc-700">产品型号</Label>
                      <div className="relative">
                        <Select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
                          <SelectItem value="">全部产品</SelectItem>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>{p.model}</SelectItem>
                          ))}
                        </Select>
                        <ChevronDownIcon className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    {/* 搜索框 */}
                    <div className="w-72">
                      <Label className="mb-2 block text-sm font-medium text-zinc-700">搜索</Label>
                      <div className="relative">
                        <SearchIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          placeholder="搜索产品、工站、设备..."
                          value={searchKeyword}
                          onChange={(e) => setSearchKeyword(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    {/* 重置按钮 */}
                    <Button
                      variant="outline"
                      onClick={resetFilters}
                      className="border-zinc-200 hover:bg-zinc-50"
                    >
                      <RefreshIcon className="w-4 h-4 mr-2" />
                      重置
                    </Button>
                  </div>
                  {/* 新增参数按钮 */}
                  <Button
                    onClick={() => handleOpenDialog()}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-200"
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
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                  <span className="text-zinc-500 font-medium">加载中...</span>
                </div>
              </div>
            ) : filteredData.length === 0 ? (
              /* 空状态 */
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-zinc-100 flex items-center justify-center">
                    <EmptyStateIcon className="w-10 h-10 text-zinc-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-700 mb-2">暂无数据</h3>
                  <p className="text-sm text-zinc-500 mb-6">当前筛选条件下没有找到标准参数数据</p>
                  <Button
                    onClick={() => handleOpenDialog()}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    添加第一个参数
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredData.map((factoryData, factoryIndex) => (
                  <Card
                    key={factoryData.factory_id}
                    className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden animate-fade-in-up"
                    style={{ animationDelay: `${0.4 + factoryIndex * 0.1}s` }}
                  >
                    {/* 厂区标题 */}
                    <CardHeader className="bg-gradient-to-r from-zinc-50 to-white border-b border-zinc-100 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-sm">
                              {factoryData.factory_name.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold text-zinc-800">{factoryData.factory_name}</CardTitle>
                            <p className="text-sm text-zinc-500">{factoryData.factory_code}</p>
                          </div>
                        </div>
                        <Badge className="bg-zinc-100 text-zinc-600 border-0 px-3 py-1 font-medium">
                          {factoryData.products.reduce((sum, p) => sum + p.params.length, 0)} 条参数
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {factoryData.products.map((productData) => (
                        <div key={productData.product_id} className="border-b border-zinc-100 last:border-b-0">
                          {/* 产品型号标题 */}
                          <div className="px-5 py-3 bg-zinc-50/50 border-b border-zinc-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge className="bg-white text-zinc-700 border border-zinc-200 font-semibold px-3 py-1">
                                {productData.product_model}
                              </Badge>
                              <span className="text-sm text-zinc-500">
                                {productData.params.length} 个工站
                              </span>
                            </div>
                          </div>
                          {/* 参数表格 */}
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent border-b border-zinc-100">
                                <TableHead className="w-[100px] text-zinc-600 font-semibold">工站</TableHead>
                                <TableHead className="w-[120px] text-zinc-600 font-semibold">设备</TableHead>
                                <TableHead className="w-[100px] text-right text-zinc-600 font-semibold">标准产出</TableHead>
                                <TableHead className="w-[90px] text-right text-zinc-600 font-semibold">良品率</TableHead>
                                <TableHead className="w-[90px] text-right text-zinc-600 font-semibold">返工上限</TableHead>
                                <TableHead className="w-[90px] text-right text-zinc-600 font-semibold">报废上限</TableHead>
                                <TableHead className="text-zinc-600 font-semibold">备注</TableHead>
                                <TableHead className="w-[100px] text-center text-zinc-600 font-semibold">操作</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {productData.params.map((param) => (
                                <TableRow key={param.id} className="hover:bg-zinc-50/50 transition-colors">
                                  <TableCell className="font-semibold text-zinc-800">{param.station_name}</TableCell>
                                  <TableCell className="text-zinc-600">{param.device_name || '手工'}</TableCell>
                                  <TableCell className="text-right font-medium text-zinc-700">
                                    {param.standard_output.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="text-green-600 font-medium">
                                      {(param.standard_quality_rate * 100).toFixed(1)}%
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="text-amber-600 font-medium">
                                      {(param.standard_rework_limit * 100).toFixed(1)}%
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="text-red-600 font-medium">
                                      {(param.standard_scrap_limit * 100).toFixed(1)}%
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-zinc-500 text-sm max-w-[200px] truncate">
                                    {param.note || '-'}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex justify-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-orange-50 hover:text-orange-600"
                                        onClick={() => handleOpenDialog(param)}
                                      >
                                        <EditIcon className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => setDeleteConfirmId(param.id)}
                                      >
                                        <TrashIcon className="w-4 h-4" />
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
          <DialogContent className="max-w-xl border-0 shadow-2xl">
            <DialogHeader className="border-b border-zinc-100 pb-4">
              <DialogTitle className="text-xl font-bold text-zinc-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  {editingParam ? <EditIcon className="w-4 h-4 text-orange-600" /> : <PlusIcon className="w-4 h-4 text-orange-600" />}
                </div>
                {editingParam ? '编辑标准参数' : '新增标准参数'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-5">
              {/* 第一行：厂区 + 产品型号 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="factory" className="text-zinc-700 font-medium">
                    厂区 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    id="factory"
                    value={formData.factory_id?.toString() || ''}
                    onChange={(e) => handleInputChange('factory_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  >
                    <SelectItem value="">请选择厂区</SelectItem>
                    {factories.map((f) => (
                      <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product" className="text-zinc-700 font-medium">
                    产品型号 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    id="product"
                    value={formData.product_id?.toString() || ''}
                    onChange={(e) => handleInputChange('product_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  >
                    <SelectItem value="">请选择产品</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.model}</SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
              {/* 第二行：设备 + 工站 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="device" className="text-zinc-700 font-medium">设备</Label>
                  <Select
                    id="device"
                    value={formData.device_id?.toString() || 'null'}
                    onChange={(e) => handleInputChange('device_id', e.target.value === 'null' ? null : parseInt(e.target.value))}
                  >
                    <SelectItem value="null">手工</SelectItem>
                    {devices.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="station" className="text-zinc-700 font-medium">
                    工站 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    id="station"
                    value={formData.station_id?.toString() || ''}
                    onChange={(e) => handleInputChange('station_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  >
                    <SelectItem value="">请选择工站</SelectItem>
                    {stations.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
              {/* 第三行：标准产出 */}
              <div className="space-y-2">
                <Label htmlFor="output" className="text-zinc-700 font-medium">
                  标准产出 <span className="text-zinc-400 font-normal">(件/h)</span> <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="output"
                  type="number"
                  min={0}
                  value={formData.standard_output || ''}
                  onChange={(e) => handleInputChange('standard_output', parseFloat(e.target.value) || undefined)}
                  placeholder="请输入标准产出"
                  className="h-10"
                />
              </div>
              {/* 第四行：良品率 + 返工上限 + 报废上限 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quality" className="text-zinc-700 font-medium">良品率</Label>
                  <Input
                    id="quality"
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={formData.standard_quality_rate ?? ''}
                    onChange={(e) => handleInputChange('standard_quality_rate', parseFloat(e.target.value))}
                    placeholder="0.99"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rework" className="text-zinc-700 font-medium">返工上限</Label>
                  <Input
                    id="rework"
                    type="number"
                    min={0}
                    max={1}
                    step={0.001}
                    value={formData.standard_rework_limit ?? ''}
                    onChange={(e) => handleInputChange('standard_rework_limit', parseFloat(e.target.value))}
                    placeholder="0.005"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scrap" className="text-zinc-700 font-medium">报废上限</Label>
                  <Input
                    id="scrap"
                    type="number"
                    min={0}
                    max={1}
                    step={0.001}
                    value={formData.standard_scrap_limit ?? ''}
                    onChange={(e) => handleInputChange('standard_scrap_limit', parseFloat(e.target.value))}
                    placeholder="0.001"
                    className="h-10"
                  />
                </div>
              </div>
              {/* 第五行：备注 */}
              <div className="space-y-2">
                <Label htmlFor="note" className="text-zinc-700 font-medium">备注</Label>
                <Textarea
                  id="note"
                  value={formData.note || ''}
                  onChange={(e) => handleInputChange('note', e.target.value)}
                  placeholder="请输入备注信息"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter className="border-t border-zinc-100 pt-4 gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="px-6">
                取消
              </Button>
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6"
              >
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 删除确认弹窗 */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent className="max-w-md border-0 shadow-2xl">
            <DialogHeader className="border-b border-zinc-100 pb-4">
              <DialogTitle className="text-xl font-bold text-zinc-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <TrashIcon className="w-4 h-4 text-red-600" />
                </div>
                确认删除
              </DialogTitle>
            </DialogHeader>
            <div className="py-6">
              <p className="text-zinc-600 text-center">
                确定要删除这条标准参数吗？<br />
                <span className="text-sm text-zinc-400">此操作不可撤销</span>
              </p>
            </div>
            <DialogFooter className="border-t border-zinc-100 pt-4 gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="px-6">
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                className="px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                删除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
