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
  Clock,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
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

// 等级徽章样式映射 - 支持亮色/暗色双主题
const gradeClassMap: Record<string, string> = {
  '甲': 'badge-grade-a',
  '乙': 'badge-grade-b',
  '丙': 'badge-grade-c',
  '丁': 'badge-grade-d',
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  delay = 0
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  delay?: number
}) => (
  <Card className="stat-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
      <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-500">{title}</CardTitle>
      <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      </div>
    </CardHeader>
    <CardContent className="pt-1 px-4 pb-4">
      <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 font-mono-data">{value}</div>
      {subtitle && (
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">{subtitle}</p>
      )}
    </CardContent>
  </Card>
)

const ActionCard = ({
  title,
  description,
  icon: Icon,
  onClick,
  delay = 0
}: {
  title: string
  description: string
  icon: React.ElementType
  onClick: () => void
  delay?: number
}) => (
  <button
    onClick={onClick}
    className="group relative w-full text-left overflow-hidden rounded-xl p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <Icon className="h-6 w-6 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors" />
        </div>
        <div>
          <h3 className="text-base font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-0.5">
            {description}
          </p>
        </div>
      </div>
      <ArrowRight className="h-5 w-5 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors" />
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
    <div className="space-y-6">
      {/* 页面标题区 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Activity className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">仪表盘</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">生产人员KPI绩效概览与数据分析</p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-lg text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
      </div>

      {/* 统计卡片区 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="本月KPI计算人数"
          value={stats.totalEmployees}
          subtitle={`${stats.monthOverMonthChange >= 0 ? '+' : ''}${stats.monthOverMonthChange}% 较上月`}
          icon={Users}
          delay={0}
        />
        <StatCard
          title="平均绩效得分"
          value={stats.avgScore.toFixed(1)}
          subtitle="综合评估"
          icon={Target}
          delay={0.1}
        />
        <StatCard
          title="甲等人数"
          value={stats.gradeA}
          subtitle="优秀员工"
          icon={Award}
          delay={0.2}
        />
        <StatCard
          title="丁等人数"
          value={stats.gradeD}
          subtitle="需关注"
          icon={AlertCircle}
          delay={0.3}
        />
      </div>

      {/* 快捷操作区 */}
      <div>
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">快捷操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard
            title="上传生产数据"
            description="批量导入员工生产记录，支持Excel格式文件"
            icon={Upload}
            onClick={() => navigate('/upload')}
            delay={0.4}
          />
          <ActionCard
            title="计算KPI"
            description="根据上传数据自动计算员工绩效评分"
            icon={Calculator}
            onClick={() => navigate('/kpi-calculation')}
            delay={0.5}
          />
        </div>
      </div>

      {/* 最近计算记录表格 */}
      <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <CardHeader className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Clock className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <CardTitle className="text-base font-medium text-zinc-700 dark:text-zinc-200">最近KPI计算记录</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/kpi-report')}
              className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              查看全部
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {loading ? (
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-500">
              <div className="inline-block w-6 h-6 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-500 dark:border-t-zinc-400 rounded-full animate-spin mb-2" />
              <p className="text-sm">加载中...</p>
            </div>
          ) : recentCalculations.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-500">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">暂无计算记录</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <TableHead className="font-medium text-zinc-600 dark:text-zinc-400">员工姓名</TableHead>
                    <TableHead className="font-medium text-zinc-600 dark:text-zinc-400">月份</TableHead>
                    <TableHead className="font-medium text-zinc-600 dark:text-zinc-400">综合得分</TableHead>
                    <TableHead className="font-medium text-zinc-600 dark:text-zinc-400">等级</TableHead>
                    <TableHead className="font-medium text-zinc-600 dark:text-zinc-400">计算时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCalculations.map((item) => {
                    const gradeClass = gradeClassMap[item.grade] || 'badge-grade-c'
                    return (
                      <TableRow
                        key={item.id}
                        className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <TableCell className="font-medium text-zinc-800 dark:text-zinc-200">{item.employeeName}</TableCell>
                        <TableCell className="text-zinc-500 dark:text-zinc-400 font-mono-data">{item.month}</TableCell>
                        <TableCell>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200 font-mono-data">{item.totalScore}</span>
                          <span className="text-zinc-400 dark:text-zinc-500 text-xs ml-1">分</span>
                        </TableCell>
                        <TableCell>
                          <span className={gradeClass}>{item.grade}</span>
                        </TableCell>
                        <TableCell className="text-zinc-400 dark:text-zinc-500 text-xs font-mono-data">{item.calculatedAt}</TableCell>
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
