import { useState, useEffect } from 'react'
import { Trophy, Users, TrendingUp, Award, AlertCircle, Download, Calendar, RefreshCw, FileText } from 'lucide-react'
import { kpiApi, KPIResult } from '../services/kpi'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { cn } from '../lib/utils'

// 等级徽章样式映射 - 支持亮色/暗色双主题
const gradeClassMap: Record<string, string> = {
  '甲': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400',
  '乙': 'bg-zinc-100 text-zinc-700 dark:bg-zinc-400/10 dark:text-zinc-400',
  '丙': 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400',
  '丁': 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-400',
}

export default function KPIReport() {
  const [month, setMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [results, setResults] = useState<KPIResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [month])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await kpiApi.getResults({ month })
      setResults(response.data)
    } finally {
      setLoading(false)
    }
  }

  // 统计数据
  const totalEmployees = results.length
  const avgScore = totalEmployees > 0
    ? results.reduce((sum, r) => sum + r.total_score, 0) / totalEmployees
    : 0
  const gradeCounts = results.reduce((acc, r) => {
    const grade = r.final_grade?.[0] || '丁'
    acc[grade] = (acc[grade] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // 排名数据（按综合得分降序）
  const rankedResults = [...results].sort((a, b) => b.total_score - a.total_score)

  const getGradeClass = (grade: string): string => {
    return gradeClassMap[grade] || 'badge-grade-c'
  }

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-emerald-600 dark:text-emerald-400'
    if (score >= 6) return 'text-zinc-600 dark:text-zinc-200'
    if (score >= 4) return 'text-amber-600 dark:text-amber-400'
    return 'text-rose-600 dark:text-rose-400'
  }

  const getRankDisplay = (index: number) => {
    if (index === 0) return <span className="text-amber-500 dark:text-amber-400 font-mono-data font-semibold">#1</span>
    if (index === 1) return <span className="text-zinc-400 dark:text-zinc-400 font-mono-data font-semibold">#2</span>
    if (index === 2) return <span className="text-orange-400 dark:text-orange-400 font-mono-data font-semibold">#3</span>
    return <span className="text-zinc-500 dark:text-zinc-500 font-mono-data">#{index + 1}</span>
  }

  const handleExport = () => {
    const headers = ['排名', '工号', '姓名', '月份', '工时达成率', '工时等级', '良品达成率', '良品等级', '综合得分', '综合等级']
    const rows = rankedResults.map((r, index) => [
      index + 1,
      r.employee_no,
      r.employee_name,
      r.month,
      `${r.working_hours_rate.toFixed(1)}%`,
      r.working_hours_grade,
      `${r.quality_rate.toFixed(1)}%`,
      r.quality_grade,
      r.total_score.toFixed(2),
      r.final_grade,
    ])

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `KPI报告_${month}.csv`
    link.click()
  }

  return (
    <div className="space-y-5">
      {/* 页面标题区 */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <FileText className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">KPI报告</h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">查看员工绩效排名和统计分析</p>
        </div>
      </div>

      {/* 月份筛选区 */}
      <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <label className="text-sm text-zinc-500 dark:text-zinc-400">选择月份：</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="flex h-9 w-40 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1 text-sm text-zinc-800 dark:text-zinc-200 focus-visible:outline-none focus-visible:border-zinc-400 dark:focus-visible:border-zinc-600"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计概览 */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">计算人数</p>
                <p className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 font-mono-data mt-1">{totalEmployees}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Users className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">平均得分</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className={cn("text-2xl font-semibold font-mono-data", getScoreColor(avgScore))}>
                    {avgScore.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">甲等人数</p>
                <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 font-mono-data mt-1">{gradeCounts['甲'] || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">丁等人数</p>
                <p className="text-2xl font-semibold text-rose-600 dark:text-rose-400 font-mono-data mt-1">{gradeCounts['丁'] || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 排名表格 */}
      <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-medium text-zinc-700 dark:text-zinc-200">绩效排名</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport} className="border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
        </CardHeader>
        <CardContent>
          {rankedResults.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 dark:text-zinc-500">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">暂无数据，请选择其他月份</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <TableHead className="w-12 font-medium text-zinc-500 dark:text-zinc-400">排名</TableHead>
                  <TableHead className="font-medium text-zinc-500 dark:text-zinc-400">工号</TableHead>
                  <TableHead className="font-medium text-zinc-500 dark:text-zinc-400">姓名</TableHead>
                  <TableHead className="font-medium text-zinc-500 dark:text-zinc-400">工时达成率</TableHead>
                  <TableHead className="font-medium text-zinc-500 dark:text-zinc-400">良品达成率</TableHead>
                  <TableHead className="font-medium text-zinc-500 dark:text-zinc-400">综合得分</TableHead>
                  <TableHead className="font-medium text-zinc-500 dark:text-zinc-400">等级</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedResults.map((r, index) => (
                  <TableRow key={r.id} className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {getRankDisplay(index)}
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-500 dark:text-zinc-400 font-mono-data text-xs">{r.employee_no}</TableCell>
                    <TableCell className="font-medium text-zinc-800 dark:text-zinc-200">{r.employee_name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-700 dark:text-zinc-300 font-mono-data">{r.working_hours_rate.toFixed(1)}%</span>
                          <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", getGradeClass(r.working_hours_grade))}>
                            {r.working_hours_grade}
                          </span>
                        </div>
                        <Progress
                          value={r.working_hours_rate}
                          max={100}
                          className="w-20 h-1 bg-zinc-200 dark:bg-zinc-800"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-700 dark:text-zinc-300 font-mono-data">{r.quality_rate.toFixed(1)}%</span>
                          <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", getGradeClass(r.quality_grade))}>
                            {r.quality_grade}
                          </span>
                        </div>
                        <Progress
                          value={r.quality_rate}
                          max={100}
                          className="w-20 h-1 bg-zinc-200 dark:bg-zinc-800"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className={cn("font-semibold font-mono-data", getScoreColor(r.total_score))}>
                          {r.total_score.toFixed(2)}
                        </span>
                        <Progress
                          value={r.total_score}
                          max={10}
                          className="w-20 h-1 bg-zinc-200 dark:bg-zinc-800"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", getGradeClass(r.final_grade?.[0] || '丙'))}>
                        {r.final_grade}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
