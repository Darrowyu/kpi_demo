import { useState, useEffect } from 'react'
import { Card, Select, DatePicker, Button, Table, message, Tag } from 'antd'
import { CalculatorOutlined } from '@ant-design/icons'
import { employeeApi, Employee } from '../services/employee'
import { kpiApi, KPIResult } from '../services/kpi'
import dayjs from 'dayjs'

const { Option } = Select

const gradeColors: Record<string, string> = {
  '甲': 'green',
  '乙': 'blue',
  '丙': 'orange',
  '丁': 'red',
}

export default function KPICalculation() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null)
  const [month, setMonth] = useState(dayjs())
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<KPIResult[]>([])

  useEffect(() => {
    employeeApi.getAll().then((res) => setEmployees(res.data))
    fetchResults()
  }, [])

  const fetchResults = async () => {
    const monthStr = month.format('YYYY-MM')
    const response = await kpiApi.getResults({ month: monthStr })
    setResults(response.data)
  }

  const handleCalculate = async () => {
    if (!selectedEmployee) {
      message.warning('请选择员工')
      return
    }

    setLoading(true)
    try {
      const monthStr = month.format('YYYY-MM')
      const response = await kpiApi.calculate({
        employee_id: selectedEmployee,
        month: monthStr,
      })

      if (response.data.success) {
        message.success(response.data.message)
        fetchResults()
      } else {
        message.warning(response.data.message)
      }
    } catch (error) {
      message.error('计算失败')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { title: '工号', dataIndex: 'employee_no', width: 100 },
    { title: '姓名', dataIndex: 'employee_name', width: 100 },
    { title: '月份', dataIndex: 'month', width: 100 },
    {
      title: '工时达成率',
      children: [
        { title: '数值', dataIndex: 'working_hours_rate', width: 80, render: (v: number) => `${v.toFixed(1)}%` },
        { title: '等级', dataIndex: 'working_hours_grade', width: 60, render: (v: string) => <Tag color={gradeColors[v]}>{v}</Tag> },
      ],
    },
    {
      title: '良品达成率',
      children: [
        { title: '数值', dataIndex: 'quality_rate', width: 80, render: (v: number) => `${v.toFixed(1)}%` },
        { title: '等级', dataIndex: 'quality_grade', width: 60, render: (v: string) => <Tag color={gradeColors[v]}>{v}</Tag> },
      ],
    },
    {
      title: '人时产出',
      children: [
        { title: '数值', dataIndex: 'productivity_rate', width: 80, render: (v: number) => `${v.toFixed(1)}%` },
        { title: '等级', dataIndex: 'productivity_grade', width: 60, render: (v: string) => <Tag color={gradeColors[v]}>{v}</Tag> },
      ],
    },
    {
      title: '返工率',
      children: [
        { title: '数值', dataIndex: 'rework_rate', width: 80, render: (v: number) => `${v.toFixed(2)}%` },
        { title: '等级', dataIndex: 'rework_grade', width: 60, render: (v: string) => <Tag color={gradeColors[v]}>{v}</Tag> },
      ],
    },
    {
      title: '报废率',
      children: [
        { title: '数值', dataIndex: 'scrap_rate', width: 80, render: (v: number) => `${v.toFixed(2)}%` },
        { title: '等级', dataIndex: 'scrap_grade', width: 60, render: (v: string) => <Tag color={gradeColors[v]}>{v}</Tag> },
      ],
    },
    {
      title: '综合',
      children: [
        { title: '得分', dataIndex: 'total_score', width: 70, render: (v: number) => <strong>{v.toFixed(2)}</strong> },
        { title: '等级', dataIndex: 'final_grade', width: 70, render: (v: string) => <Tag color={gradeColors[v?.[0]]}>{v}</Tag> },
      ],
    },
  ]

  return (
    <div>
      <Card title="KPI计算" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>选择员工</label>
            <Select
              style={{ width: 200 }}
              placeholder="请选择员工"
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              allowClear
            >
              {employees.map((e) => (
                <Option key={e.id} value={e.id}>
                  {e.name} ({e.employee_no})
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>月份</label>
            <DatePicker
              picker="month"
              value={month}
              onChange={(date) => date && setMonth(date)}
            />
          </div>
          <Button
            type="primary"
            icon={<CalculatorOutlined />}
            loading={loading}
            onClick={handleCalculate}
          >
            计算KPI
          </Button>
        </div>
      </Card>

      <Card title="KPI计算结果">
        <Table
          dataSource={results}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>
    </div>
  )
}
