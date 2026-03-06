import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Calculator, User, Calendar, TrendingUp, Clock, Package, RotateCcw, Trash2 } from 'lucide-react'
import { employeeApi, Employee } from '../services/employee'
import { kpiApi, KPIResult } from '../services/kpi'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectItem } from '../components/ui/select'
import { Progress } from '../components/ui/progress'

// 等级徽章样式映射 - 支持亮色/暗色双主题
const gradeClassMap: Record<string, string> = {
  '甲': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400',
  '乙': 'bg-zinc-100 text-zinc-700 dark:bg-zinc-400/10 dark:text-zinc-400',
  '丙': 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400',
  '丁': 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-400',
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

  useEffect(() => {
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

  const getGradeClass = (grade: string): string => {
    return gradeClassMap[grade] || 'badge-grade-c'
  }

  return (
    <div className="space-y-5">
      {/* 页面标题区 */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <Calculator className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">KPI计算</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">计算员工月度绩效得分</p>
        </div>
      </div>

      {/* 操作卡片 */}
      <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Calculator className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            计算配置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3 w-3" />
                选择员工
              </label>
              <Select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="h-9 rounded-lg bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
              >
                <SelectItem value="">请选择员工</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name} ({e.employee_no})
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                月份
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus-visible:outline-none focus-visible:border-zinc-400 dark:focus-visible:border-zinc-600"
              />
            </div>
            <Button
              onClick={handleCalculate}
              disabled={loading}
              className="h-9 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {loading ? '计算中...' : '计算KPI'}
            </Button>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-3 border ${
              message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' :
              message.type === 'error' ? 'bg-rose-50 dark:bg-rose-400/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' :
              'bg-amber-50 dark:bg-amber-400/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
            }`}>
              <span className="font-mono-data">
                {message.type === 'success' ? '✓' : message.type === 'error' ? '✕' : '!'}
              </span>
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 计算结果区 */}
      {calculatedResult && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            本次计算结果
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {/* 工时达成率 */}
            <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Clock className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-500">工时达成率</span>
                  </div>
                  <span className={getGradeClass(calculatedResult.working_hours_grade)}>
                    {calculatedResult.working_hours_grade}
                  </span>
                </div>
                <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 font-mono-data mb-2">
                  {calculatedResult.working_hours_rate.toFixed(1)}%
                </div>
                <Progress
                  value={calculatedResult.working_hours_rate}
                  max={100}
                  className="h-1 bg-zinc-200 dark:bg-zinc-800"
                />
              </CardContent>
            </Card>

            {/* 良品达成率 */}
            <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Package className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-500">良品达成率</span>
                  </div>
                  <span className={getGradeClass(calculatedResult.quality_grade)}>
                    {calculatedResult.quality_grade}
                  </span>
                </div>
                <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 font-mono-data mb-2">
                  {calculatedResult.quality_rate.toFixed(1)}%
                </div>
                <Progress
                  value={calculatedResult.quality_rate}
                  max={100}
                  className="h-1 bg-zinc-200 dark:bg-zinc-800"
                />
              </CardContent>
            </Card>

            {/* 人时产出达成率 */}
            <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <TrendingUp className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-500">人时产出达成率</span>
                  </div>
                  <span className={getGradeClass(calculatedResult.productivity_grade)}>
                    {calculatedResult.productivity_grade}
                  </span>
                </div>
                <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 font-mono-data mb-2">
                  {calculatedResult.productivity_rate.toFixed(1)}%
                </div>
                <Progress
                  value={calculatedResult.productivity_rate}
                  max={100}
                  className="h-1 bg-zinc-200 dark:bg-zinc-800"
                />
              </CardContent>
            </Card>

            {/* 返工率控制 */}
            <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <RotateCcw className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-500">返工率控制</span>
                  </div>
                  <span className={getGradeClass(calculatedResult.rework_grade)}>
                    {calculatedResult.rework_grade}
                  </span>
                </div>
                <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 font-mono-data mb-2">
                  {calculatedResult.rework_rate.toFixed(2)}%
                </div>
                <Progress
                  value={100 - calculatedResult.rework_rate}
                  max={100}
                  className="h-1 bg-zinc-200 dark:bg-zinc-800"
                />
              </CardContent>
            </Card>

            {/* 报废率控制 */}
            <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Trash2 className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-500">报废率控制</span>
                  </div>
                  <span className={getGradeClass(calculatedResult.scrap_grade)}>
                    {calculatedResult.scrap_grade}
                  </span>
                </div>
                <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 font-mono-data mb-2">
                  {calculatedResult.scrap_rate.toFixed(2)}%
                </div>
                <Progress
                  value={100 - calculatedResult.scrap_rate}
                  max={100}
                  className="h-1 bg-zinc-200 dark:bg-zinc-800"
                />
              </CardContent>
            </Card>

            {/* 综合得分 */}
            <Card className="terminal-card bg-white dark:bg-zinc-900 border-emerald-200 dark:border-emerald-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">综合得分</span>
                  <span className={getGradeClass(calculatedResult.final_grade?.[0] || '丙')}>
                    {calculatedResult.final_grade}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-semibold text-emerald-600 dark:text-emerald-400 font-mono-data">
                    {calculatedResult.total_score.toFixed(2)}
                  </div>
                  <div className="w-14 h-14 rounded-full border-4 border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 font-mono-data">
                      {((calculatedResult.total_score / 10) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 历史结果表格 */}
      <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            KPI计算结果
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-800">
                <tr>
                  <th className="h-10 px-3 text-left font-medium text-zinc-500 dark:text-zinc-400">工号</th>
                  <th className="h-10 px-3 text-left font-medium text-zinc-500 dark:text-zinc-400">姓名</th>
                  <th className="h-10 px-3 text-left font-medium text-zinc-500 dark:text-zinc-400">月份</th>
                  <th className="h-10 px-3 text-left font-medium text-zinc-500 dark:text-zinc-400">工时达成率</th>
                  <th className="h-10 px-3 text-left font-medium text-zinc-500 dark:text-zinc-400">良品达成率</th>
                  <th className="h-10 px-3 text-left font-medium text-zinc-500 dark:text-zinc-400">人时产出</th>
                  <th className="h-10 px-3 text-left font-medium text-zinc-500 dark:text-zinc-400">返工率</th>
                  <th className="h-10 px-3 text-left font-medium text-zinc-500 dark:text-zinc-400">报废率</th>
                  <th className="h-10 px-3 text-left font-medium text-zinc-500 dark:text-zinc-400">综合得分</th>
                  <th className="h-10 px-3 text-left font-medium text-zinc-500 dark:text-zinc-400">等级</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="p-3 text-zinc-500 dark:text-zinc-500 font-mono-data text-xs">{r.employee_no}</td>
                    <td className="p-3 font-medium text-zinc-800 dark:text-zinc-200">{r.employee_name}</td>
                    <td className="p-3 text-zinc-500 dark:text-zinc-400 font-mono-data">{r.month}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-700 dark:text-zinc-300 font-mono-data">{r.working_hours_rate.toFixed(1)}%</span>
                        <span className={getGradeClass(r.working_hours_grade)}>{r.working_hours_grade}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-700 dark:text-zinc-300 font-mono-data">{r.quality_rate.toFixed(1)}%</span>
                        <span className={getGradeClass(r.quality_grade)}>{r.quality_grade}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-700 dark:text-zinc-300 font-mono-data">{r.productivity_rate.toFixed(1)}%</span>
                        <span className={getGradeClass(r.productivity_grade)}>{r.productivity_grade}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-700 dark:text-zinc-300 font-mono-data">{r.rework_rate.toFixed(2)}%</span>
                        <span className={getGradeClass(r.rework_grade)}>{r.rework_grade}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-700 dark:text-zinc-300 font-mono-data">{r.scrap_rate.toFixed(2)}%</span>
                        <span className={getGradeClass(r.scrap_grade)}>{r.scrap_grade}</span>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400 font-mono-data">{r.total_score.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={getGradeClass(r.final_grade?.[0] || '丙')}>{r.final_grade}</span>
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
