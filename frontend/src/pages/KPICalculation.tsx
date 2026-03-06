import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Calculator, User, Calendar, TrendingUp, Clock, Package, RotateCcw, Trash2 } from 'lucide-react'
import { employeeApi, Employee } from '../services/employee'
import { kpiApi, KPIResult } from '../services/kpi'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Select, SelectItem } from '../components/ui/select'
import { Progress, CircularProgress } from '../components/ui/progress'

const gradeColors: Record<string, 'green' | 'blue' | 'orange' | 'red'> = {
  '甲': 'green',
  '乙': 'blue',
  '丙': 'orange',
  '丁': 'red',
}

// 指标卡片颜色配置
const metricColors = {
  workingHours: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600', progress: 'cyan' as const, icon: 'cyan' },
  quality: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', progress: 'blue' as const, icon: 'blue' },
  productivity: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', progress: 'indigo' as const, icon: 'indigo' },
  rework: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', progress: 'orange' as const, icon: 'amber' },
  scrap: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', progress: 'red' as const, icon: 'rose' },
}

export default function KPICalculation() {
  const [searchParams] = useSearchParams()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [month, setMonth] = useState<string>(() => {
    const urlMonth = searchParams.get('month')
    if (urlMonth) return urlMonth
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<KPIResult[]>([])
  const [calculatedResult, setCalculatedResult] = useState<KPIResult | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    employeeApi.getAll().then((res) => {
      const data = res.data
      if (Array.isArray(data)) {
        setEmployees(data)
      } else if (data.items) {
        setEmployees(data.items)
      } else {
        setEmployees([])
      }
    })
    fetchResults()
  }, [])

  const fetchResults = async () => {
    const response = await kpiApi.getResults({ month })
    setResults(response.data)
  }

  const handleCalculate = async () => {
    if (!selectedEmployee) {
      setMessage({ type: 'warning', text: '请选择员工' })
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const response = await kpiApi.calculate({
        employee_id: parseInt(selectedEmployee),
        month: month,
      })

      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message })
        if (response.data.result) {
          setCalculatedResult(response.data.result)
        }
        fetchResults()
      } else {
        setMessage({ type: 'warning', text: response.data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '计算失败' })
    } finally {
      setLoading(false)
    }
  }

  const getGradeVariant = (grade: string): 'green' | 'blue' | 'orange' | 'red' => {
    return gradeColors[grade] || 'orange'
  }

  // 玻璃态卡片样式
  const glassCardClass = "bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg"

  return (
    <div className={`space-y-6 transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* 页面标题区 */}
      <div className={`flex items-center gap-4 transition-all duration-500 delay-100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200">
          <Calculator className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">KPI计算</h1>
          <p className="text-sm text-zinc-500 mt-0.5">计算员工月度绩效得分</p>
        </div>
      </div>

      {/* 操作卡片 */}
      <Card className={`${glassCardClass} transition-all duration-500 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
              <Calculator className="h-4 w-4 text-orange-600" />
            </div>
            计算配置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                <User className="h-4 w-4 text-zinc-400" />
                选择员工
              </label>
              <Select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="h-10"
              >
                <SelectItem value="">请选择员工</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name} ({e.employee_no})
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-zinc-400" />
                月份
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500"
              />
            </div>
            <Button
              onClick={handleCalculate}
              disabled={loading}
              className="h-10 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-200 transition-all duration-200 hover:shadow-xl hover:shadow-orange-200"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {loading ? '计算中...' : '计算KPI'}
            </Button>
          </div>

          {message && (
            <div className={`mt-6 p-4 rounded-xl text-sm flex items-center gap-3 transition-all duration-300 ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
              message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'success' ? 'bg-green-100' :
                message.type === 'error' ? 'bg-red-100' :
                'bg-amber-100'
              }`}>
                {message.type === 'success' ? '✓' : message.type === 'error' ? '✕' : '!'}
              </div>
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 计算结果区 */}
      {calculatedResult && (
        <div className={`space-y-4 transition-all duration-500 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h3 className="text-lg font-semibold text-zinc-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            本次计算结果
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {/* 工时达成率 - Cyan */}
            <Card className={`${glassCardClass} border-l-4 border-l-cyan-400 overflow-hidden`}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-cyan-600" />
                    </div>
                    <span className="text-sm font-medium text-zinc-600">工时达成率</span>
                  </div>
                  <Badge variant={getGradeVariant(calculatedResult.working_hours_grade)}>
                    {calculatedResult.working_hours_grade}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-zinc-800 mb-3">
                  {calculatedResult.working_hours_rate.toFixed(1)}%
                </div>
                <Progress
                  value={calculatedResult.working_hours_rate}
                  max={100}
                  variant={getGradeVariant(calculatedResult.working_hours_grade)}
                  className="h-1.5"
                />
              </CardContent>
            </Card>

            {/* 良品达成率 - Blue */}
            <Card className={`${glassCardClass} border-l-4 border-l-blue-400 overflow-hidden`}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-zinc-600">良品达成率</span>
                  </div>
                  <Badge variant={getGradeVariant(calculatedResult.quality_grade)}>
                    {calculatedResult.quality_grade}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-zinc-800 mb-3">
                  {calculatedResult.quality_rate.toFixed(1)}%
                </div>
                <Progress
                  value={calculatedResult.quality_rate}
                  max={100}
                  variant={getGradeVariant(calculatedResult.quality_grade)}
                  className="h-1.5"
                />
              </CardContent>
            </Card>

            {/* 人时产出达成率 - Indigo */}
            <Card className={`${glassCardClass} border-l-4 border-l-indigo-400 overflow-hidden`}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-zinc-600">人时产出达成率</span>
                  </div>
                  <Badge variant={getGradeVariant(calculatedResult.productivity_grade)}>
                    {calculatedResult.productivity_grade}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-zinc-800 mb-3">
                  {calculatedResult.productivity_rate.toFixed(1)}%
                </div>
                <Progress
                  value={calculatedResult.productivity_rate}
                  max={100}
                  variant={getGradeVariant(calculatedResult.productivity_grade)}
                  className="h-1.5"
                />
              </CardContent>
            </Card>

            {/* 返工率控制 - Amber */}
            <Card className={`${glassCardClass} border-l-4 border-l-amber-400 overflow-hidden`}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <RotateCcw className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="text-sm font-medium text-zinc-600">返工率控制</span>
                  </div>
                  <Badge variant={getGradeVariant(calculatedResult.rework_grade)}>
                    {calculatedResult.rework_grade}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-zinc-800 mb-3">
                  {calculatedResult.rework_rate.toFixed(2)}%
                </div>
                <Progress
                  value={100 - calculatedResult.rework_rate}
                  max={100}
                  variant={getGradeVariant(calculatedResult.rework_grade)}
                  className="h-1.5"
                />
              </CardContent>
            </Card>

            {/* 报废率控制 - Rose */}
            <Card className={`${glassCardClass} border-l-4 border-l-rose-400 overflow-hidden`}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </div>
                    <span className="text-sm font-medium text-zinc-600">报废率控制</span>
                  </div>
                  <Badge variant={getGradeVariant(calculatedResult.scrap_grade)}>
                    {calculatedResult.scrap_grade}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-zinc-800 mb-3">
                  {calculatedResult.scrap_rate.toFixed(2)}%
                </div>
                <Progress
                  value={100 - calculatedResult.scrap_rate}
                  max={100}
                  variant={getGradeVariant(calculatedResult.scrap_grade)}
                  className="h-1.5"
                />
              </CardContent>
            </Card>

            {/* 综合得分 - Orange 特殊样式 */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 shadow-lg overflow-hidden">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-zinc-700">综合得分</span>
                  <Badge variant={getGradeVariant(calculatedResult.final_grade?.[0] || '丙')}>
                    {calculatedResult.final_grade}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-orange-600">
                    {calculatedResult.total_score.toFixed(2)}
                  </div>
                  <CircularProgress
                    value={calculatedResult.total_score}
                    max={10}
                    size={70}
                    strokeWidth={6}
                    variant={getGradeVariant(calculatedResult.final_grade?.[0] || '丙')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 历史结果表格 */}
      <Card className={`${glassCardClass} transition-all duration-500 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-zinc-600" />
            </div>
            KPI计算结果
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100">
                <tr>
                  <th className="h-11 px-4 text-left font-semibold text-zinc-600">工号</th>
                  <th className="h-11 px-4 text-left font-semibold text-zinc-600">姓名</th>
                  <th className="h-11 px-4 text-left font-semibold text-zinc-600">月份</th>
                  <th className="h-11 px-4 text-left font-semibold text-zinc-600">工时达成率</th>
                  <th className="h-11 px-4 text-left font-semibold text-zinc-600">良品达成率</th>
                  <th className="h-11 px-4 text-left font-semibold text-zinc-600">人时产出</th>
                  <th className="h-11 px-4 text-left font-semibold text-zinc-600">返工率</th>
                  <th className="h-11 px-4 text-left font-semibold text-zinc-600">报废率</th>
                  <th className="h-11 px-4 text-left font-semibold text-zinc-600">综合得分</th>
                  <th className="h-11 px-4 text-left font-semibold text-zinc-600">等级</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {results.map((r, index) => (
                  <tr
                    key={r.id}
                    className="hover:bg-zinc-50/80 transition-colors"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="p-4 text-zinc-700">{r.employee_no}</td>
                    <td className="p-4 font-medium text-zinc-800">{r.employee_name}</td>
                    <td className="p-4 text-zinc-600">{r.month}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-700">{r.working_hours_rate.toFixed(1)}%</span>
                        <Badge variant={getGradeVariant(r.working_hours_grade)}>{r.working_hours_grade}</Badge>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-700">{r.quality_rate.toFixed(1)}%</span>
                        <Badge variant={getGradeVariant(r.quality_grade)}>{r.quality_grade}</Badge>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-700">{r.productivity_rate.toFixed(1)}%</span>
                        <Badge variant={getGradeVariant(r.productivity_grade)}>{r.productivity_grade}</Badge>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-700">{r.rework_rate.toFixed(2)}%</span>
                        <Badge variant={getGradeVariant(r.rework_grade)}>{r.rework_grade}</Badge>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-700">{r.scrap_rate.toFixed(2)}%</span>
                        <Badge variant={getGradeVariant(r.scrap_grade)}>{r.scrap_grade}</Badge>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-zinc-800">{r.total_score.toFixed(2)}</td>
                    <td className="p-4">
                      <Badge variant={getGradeVariant(r.final_grade?.[0] || '丙')}>{r.final_grade}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
