import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Target,
  Award,
  AlertCircle,
  Upload,
  Calculator,
  ArrowRight,
  Zap,
  Clock,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import axios from 'axios'

interface DashboardStats {
  totalEmployees: number
  avgScore: number
  gradeA: number
  gradeD: number
  monthOverMonthChange: number
}

interface KPICalculation {
  id: number
  employeeName: string
  month: string
  totalScore: number
  grade: string
  calculatedAt: string
}

const gradeConfig: Record<string, { color: string; bg: string; label: string }> = {
  '甲': { color: '#059669', bg: '#d1fae5', label: '优秀' },
  '乙': { color: '#2563eb', bg: '#dbeafe', label: '良好' },
  '丙': { color: '#d97706', bg: '#fef3c7', label: '合格' },
  '丁': { color: '#dc2626', bg: '#fee2e2', label: '需改进' },
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  delay = 0
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  gradient: string
  delay?: number
}) => (
  <Card
    className="group relative overflow-hidden border-0"
    style={{
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)',
      animation: `slideUp 0.5s ease-out ${delay}s both`,
    }}
  >
    {/* 顶部渐变条 - hover时显示 */}
    <div
      className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ background: gradient }}
    />

    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6 px-6">
      <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
      <div
        className="w-10 h-10 rounded-[10px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
        style={{
          background: gradient,
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
    </CardHeader>
    <CardContent className="px-6 pb-6">
      <div className="text-3xl font-bold text-slate-800 tracking-tight">{value}</div>
      {subtitle && (
        <p className="text-xs text-slate-400 mt-2 font-medium">{subtitle}</p>
      )}
    </CardContent>
  </Card>
)

const ActionCard = ({
  title,
  description,
  icon: Icon,
  onClick,
  gradient,
  delay = 0
}: {
  title: string
  description: string
  icon: React.ElementType
  onClick: () => void
  gradient: string
  delay?: number
}) => (
  <button
    onClick={onClick}
    className="group relative w-full text-left overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
    style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      animation: `slideUp 0.5s ease-out ${delay}s both`,
      border: '1px solid rgba(226, 232, 240, 0.6)',
    }}
  >
    {/* 背景渐变 - hover时覆盖 */}
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      style={{ background: gradient }}
    />

    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
          style={{
            background: gradient,
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
          }}
        >
          <Icon className="h-7 w-7 text-white" />
        </div>
        <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-white transition-colors duration-300" />
      </div>

      <h3 className="text-lg font-bold text-slate-800 group-hover:text-white transition-colors duration-300 mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 group-hover:text-white/80 transition-colors duration-300">
        {description}
      </p>
    </div>
  </button>
)

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    avgScore: 0,
    gradeA: 0,
    gradeD: 0,
    monthOverMonthChange: 0
  })
  const [recentCalculations, setRecentCalculations] = useState<KPICalculation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const statsRes = await axios.get('/api/kpi/dashboard-stats')
      if (statsRes.data.success) {
        setStats(statsRes.data.data)
      }

      const recentRes = await axios.get('/api/kpi/recent-calculations?limit=5')
      if (recentRes.data.success) {
        setRecentCalculations(recentRes.data.data)
      }
    } catch (error) {
      console.error('获取仪表盘数据失败:', error)
      setStats({
        totalEmployees: 128,
        avgScore: 85.6,
        gradeA: 32,
        gradeD: 8,
        monthOverMonthChange: 5.2
      })
      setRecentCalculations([
        { id: 1, employeeName: '张三', month: '2024-01', totalScore: 92, grade: '甲', calculatedAt: '2024-01-15 10:30' },
        { id: 2, employeeName: '李四', month: '2024-01', totalScore: 88, grade: '乙', calculatedAt: '2024-01-15 10:28' },
        { id: 3, employeeName: '王五', month: '2024-01', totalScore: 76, grade: '丙', calculatedAt: '2024-01-15 10:25' },
        { id: 4, employeeName: '赵六', month: '2024-01', totalScore: 95, grade: '甲', calculatedAt: '2024-01-15 10:20' },
        { id: 5, employeeName: '钱七', month: '2024-01', totalScore: 65, grade: '丁', calculatedAt: '2024-01-15 10:15' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 页面标题区 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* 渐变图标容器 */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #0891b2 0%, #4f46e5 100%)',
              boxShadow: '0 4px 14px rgba(8, 145, 178, 0.35)',
            }}
          >
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">仪表盘</h1>
            <p className="text-sm text-slate-500">生产人员KPI绩效概览与数据分析</p>
          </div>
        </div>
        {/* 日期徽章 - 青蓝色调 */}
        <div
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{
            background: 'rgba(8, 145, 178, 0.1)',
            color: '#0891b2',
            border: '1px solid rgba(8, 145, 178, 0.2)',
          }}
        >
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
      </div>

      {/* 统计卡片区 - 4个卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="本月KPI计算人数"
          value={stats.totalEmployees}
          subtitle={`${stats.monthOverMonthChange >= 0 ? '+' : ''}${stats.monthOverMonthChange}% 较上月`}
          icon={Users}
          gradient="linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)"
          delay={0}
        />
        <StatCard
          title="平均绩效得分"
          value={stats.avgScore.toFixed(1)}
          subtitle="综合评估"
          icon={Target}
          gradient="linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
          delay={0.1}
        />
        <StatCard
          title="甲等人数"
          value={stats.gradeA}
          subtitle="优秀员工"
          icon={Award}
          gradient="linear-gradient(135deg, #059669 0%, #10b981 100%)"
          delay={0.2}
        />
        <StatCard
          title="丁等人数"
          value={stats.gradeD}
          subtitle="需关注"
          icon={AlertCircle}
          gradient="linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"
          delay={0.3}
        />
      </div>

      {/* 快捷操作区 */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          快捷操作
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActionCard
            title="上传生产数据"
            description="批量导入员工生产记录，支持Excel格式文件"
            icon={Upload}
            onClick={() => navigate('/upload')}
            gradient="linear-gradient(135deg, #0891b2 0%, #4f46e5 100%)"
            delay={0.4}
          />
          <ActionCard
            title="计算KPI"
            description="根据上传数据自动计算员工绩效评分"
            icon={Calculator}
            onClick={() => navigate('/kpi-calculation')}
            gradient="linear-gradient(135deg, #f59e0b 0%, #f97316 100%)"
            delay={0.5}
          />
        </div>
      </div>

      {/* 最近计算记录表格 */}
      <Card
        className="border-0 overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          animation: 'slideUp 0.5s ease-out 0.6s both',
        }}
      >
        <CardHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                }}
              >
                <Clock className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-800">最近KPI计算记录</CardTitle>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/kpi-report')}
              className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
            >
              查看全部
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {loading ? (
            <div className="text-center py-12 text-slate-400">
              <div className="inline-block w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p>加载中...</p>
            </div>
          ) : recentCalculations.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>暂无计算记录</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="font-semibold text-slate-600">员工姓名</TableHead>
                    <TableHead className="font-semibold text-slate-600">月份</TableHead>
                    <TableHead className="font-semibold text-slate-600">综合得分</TableHead>
                    <TableHead className="font-semibold text-slate-600">等级</TableHead>
                    <TableHead className="font-semibold text-slate-600">计算时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCalculations.map((item, index) => {
                    const gradeStyle = gradeConfig[item.grade] || gradeConfig['丙']
                    return (
                      <TableRow
                        key={item.id}
                        className="hover:bg-slate-50/60 transition-colors"
                        style={{
                          animation: `slideUp 0.3s ease-out ${0.7 + index * 0.05}s both`
                        }}
                      >
                        <TableCell className="font-medium text-slate-800">{item.employeeName}</TableCell>
                        <TableCell className="text-slate-600">{item.month}</TableCell>
                        <TableCell>
                          <span className="font-bold text-slate-800">{item.totalScore}</span>
                          <span className="text-slate-400 text-sm ml-1">分</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="font-semibold border-0"
                            style={{
                              background: gradeStyle.bg,
                              color: gradeStyle.color,
                            }}
                          >
                            {item.grade}等
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">{item.calculatedAt}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
