import { useState, useEffect } from 'react'
import { Trophy, Users, TrendingUp, Award, AlertCircle, Download, Calendar, RefreshCw, FileText } from 'lucide-react'
import { kpiApi, KPIResult } from '../services/kpi'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

const gradeColors: Record<string, 'green' | 'blue' | 'orange' | 'red'> = {
  '甲': 'green',
  '乙': 'blue',
  '丙': 'orange',
  '丁': 'red',
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

  const getGradeVariant = (grade: string): 'green' | 'blue' | 'orange' | 'red' => {
    return gradeColors[grade] || 'orange'
  }

  const getScoreVariant = (score: number): 'green' | 'blue' | 'orange' | 'red' => {
    if (score >= 8) return 'green'
    if (score >= 6) return 'blue'
    if (score >= 4) return 'orange'
    return 'red'
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />  // 金色
    if (index === 1) return <Trophy className="h-5 w-5 text-gray-400" />   // 银色
    if (index === 2) return <Trophy className="h-5 w-5 text-amber-600" />  // 铜色
    return <span className="text-zinc-500 font-medium w-5 text-center">{index + 1}</span>
  }

  const handleExport = () => {
    // CSV导出功能
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
    <div className="space-y-6 animate-fadeIn">
      {/* 页面标题区 */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <FileText className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">KPI报告</h1>
          <p className="text-sm text-zinc-500">查看员工绩效排名和统计分析</p>
        </div>
      </div>

      {/* 月份筛选区 */}
      <Card className="backdrop-blur-sm bg-white/80 border-white/50 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-500" />
              <label className="text-sm font-medium">选择月份：</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="flex h-9 w-40 rounded-md border border-zinc-200 bg-white/50 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="bg-white/50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计概览 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="backdrop-blur-sm bg-white/80 border-white/50 shadow-lg animate-slideUp" style={{ animationDelay: '0.05s' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">计算人数</p>
                <p className="text-3xl font-bold mt-1">{totalEmployees}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/80 border-white/50 shadow-lg animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">平均得分</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-3xl font-bold">{avgScore.toFixed(2)}</p>
                  <TrendingUp className={`h-5 w-5 ${avgScore >= 6 ? 'text-green-500' : 'text-orange-500'}`} />
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/80 border-white/50 shadow-lg animate-slideUp" style={{ animationDelay: '0.15s' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">甲等人数</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{gradeCounts['甲'] || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                <Award className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/80 border-white/50 shadow-lg animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">丁等人数</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{gradeCounts['丁'] || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 排名表格 */}
      <Card className="backdrop-blur-sm bg-white/80 border-white/50 shadow-lg animate-slideUp" style={{ animationDelay: '0.25s' }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>绩效排名</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport} className="bg-white/50">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
        </CardHeader>
        <CardContent>
          {rankedResults.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
              <p>暂无数据，请选择其他月份</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">排名</TableHead>
                  <TableHead>工号</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>工时达成率</TableHead>
                  <TableHead>良品达成率</TableHead>
                  <TableHead>综合得分</TableHead>
                  <TableHead>等级</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedResults.map((r, index) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {getRankIcon(index)}
                      </div>
                    </TableCell>
                    <TableCell>{r.employee_no}</TableCell>
                    <TableCell className="font-medium">{r.employee_name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{r.working_hours_rate.toFixed(1)}%</span>
                          <Badge variant={getGradeVariant(r.working_hours_grade)}>
                            {r.working_hours_grade}
                          </Badge>
                        </div>
                        <Progress
                          value={r.working_hours_rate}
                          max={100}
                          variant={getGradeVariant(r.working_hours_grade)}
                          className="w-24"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{r.quality_rate.toFixed(1)}%</span>
                          <Badge variant={getGradeVariant(r.quality_grade)}>
                            {r.quality_grade}
                          </Badge>
                        </div>
                        <Progress
                          value={r.quality_rate}
                          max={100}
                          variant={getGradeVariant(r.quality_grade)}
                          className="w-24"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="font-semibold">{r.total_score.toFixed(2)}</span>
                        <Progress
                          value={r.total_score}
                          max={10}
                          variant={getScoreVariant(r.total_score)}
                          className="w-24"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getGradeVariant(r.final_grade?.[0] || '丙')}>
                        {r.final_grade}
                      </Badge>
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
