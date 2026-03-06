import { Card, Statistic, Row, Col } from 'antd'
import { TeamOutlined, SettingOutlined, BarChartOutlined } from '@ant-design/icons'

export default function Dashboard() {
  return (
    <div>
      <h2>欢迎使用KPI生产人员绩效系统</h2>
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="员工总数"
              value={0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="标准参数配置"
              value={0}
              prefix={<SettingOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="本月KPI计算"
              value={0}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
