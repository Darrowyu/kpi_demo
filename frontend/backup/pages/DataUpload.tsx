import { useState } from 'react'
import { Upload, Button, message, Card, Table, DatePicker } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { uploadApi } from '../services/upload'
import dayjs from 'dayjs'

interface UploadResult {
  sheet: string
  employee: string
  imported: number
}

export default function DataUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [month, setMonth] = useState(dayjs())
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<UploadResult[]>([])

  const handleUpload = async () => {
    if (!file) {
      message.warning('请选择文件')
      return
    }

    setLoading(true)
    try {
      const monthStr = month.format('YYYY-MM')
      const response = await uploadApi.uploadProductionRecords(file, monthStr)
      message.success('上传成功')
      setResults(response.data.results)
    } catch (error) {
      message.error('上传失败')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { title: 'Sheet名称', dataIndex: 'sheet' },
    { title: '员工', dataIndex: 'employee' },
    { title: '导入记录数', dataIndex: 'imported' },
  ]

  return (
    <div>
      <Card title="生产记录数据上传" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ marginRight: 8 }}>月份：</label>
          <DatePicker
            picker="month"
            value={month}
            onChange={(date) => date && setMonth(date)}
            style={{ marginRight: 16 }}
          />
        </div>
        <Upload
          accept=".xlsx,.xls"
          beforeUpload={(f) => {
            setFile(f)
            return false
          }}
          onRemove={() => setFile(null)}
        >
          <Button icon={<UploadOutlined />}>选择Excel文件</Button>
        </Upload>
        <Button
          type="primary"
          onClick={handleUpload}
          loading={loading}
          style={{ marginTop: 16 }}
          disabled={!file}
        >
          上传并导入
        </Button>
      </Card>

      {results.length > 0 && (
        <Card title="导入结果">
          <Table dataSource={results} columns={columns} rowKey="sheet" />
        </Card>
      )}
    </div>
  )
}
