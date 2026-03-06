import { useState, useEffect } from 'react'
import { Card, DatePicker, Row, Col, Statistic, Table, Tag, Progress } from 'antd'
import { TrophyOutlined, TeamOutlined, RiseOutlined } from '@ant-design/icons'
import { kpiApi, KPIResult } from '../services/kpi'
import dayjs from 'dayjs'

const gradeColors: Record<string, string> = {
  '甲': 'green',
  '乙': 'blue',
  '丙': 'orange',
  '丁': 'red',
}

export default function KPIReport() {
  const [month, setMonth] = useState(dayjs())
  const [results, setResults] = useState<KPIResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [month])

  const fetchData = async () => {
    setLoading(true)
    try {
      const monthStr = month.format('YYYY-MM')
      const response = await kpiApi.getResults({ month: monthStr })
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

  // 排名数据
  const rankedResults = [...results].sort((a, b) => b.total_score - a.total_score)

  const columns = [
    {
      title: '排名',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <span>
          {index < 3 ? (
            <TrophyOutlined style={{ color: ['#FFD700', '#C0C0C0', '#CD7F32'][index] }} />
          ) : (
            index + 1
          )}
        </span>
      ),
    },
    { title: '工号', dataIndex: 'employee_no' },
    { title: '姓名', dataIndex: 'employee_name' },
    { title: '月份', dataIndex: 'month' },
    {
      title: '工时达成率',
      render: (r: KPIResult) => (
        <span>{r.working_hours_rate.toFixed(1)}% <Tag color={gradeColors[r.working_hours_grade]}>{r.working_hours_grade}</Tag></span>
      ),
    },
    {
      title: '良品达成率',
      render: (r: KPIResult) => (
        <span>{r.quality_rate.toFixed(1)}% <Tag color={gradeColors[r.quality_grade]}>{r.quality_grade}</Tag></span>
      ),
    },
    {
      title: '综合得分',
      render: (r: KPIResult) => (
        <Progress
          percent={r.total_score * 10}
          size="small"
          format={() => r.total_score.toFixed(2)}
          strokeColor={r.total_score >= 8 ? '#52c41a' : r.total_score >= 6 ? '#1890ff' : r.total_score >= 4 ? '#faad14' : '#f5222d'}
        />
      ),
    },
    {
      title: '综合等级',
      render: (r: KPIResult) => <Tag color={gradeColors[r.final_grade?.[0]]}>{r.final_grade}</Tag>,
    },
  ]

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ marginRight: 8 }}>选择月份：</label>
          <DatePicker
            picker="month"
            value={month}
            onChange={(date) => date && setMonth(date)}
          />
        </div>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="计算人数"
              value={totalEmployees}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均得分"
              value={avgScore.toFixed(2)}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="甲等人数"
              value={gradeCounts['甲'] || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="丁等人数"
              value={gradeCounts['丁'] || 0}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="绩效排名">
        <Table
          dataSource={rankedResults}
          columns={columns}
          rowKey="id"
          loading={loading}
        />
      </Card>
    </div>
  )
}
