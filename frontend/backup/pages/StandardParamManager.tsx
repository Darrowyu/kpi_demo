import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Card,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Space,
  Popconfirm,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { standardParamApi, StandardParam, StandardParamCreate } from '../services/standardParam'

export default function StandardParamManager() {
  const [params, setParams] = useState<StandardParam[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingParam, setEditingParam] = useState<StandardParam | null>(null)
  const [form] = Form.useForm()

  const fetchParams = async () => {
    setLoading(true)
    try {
      const response = await standardParamApi.getAll()
      setParams(response.data)
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParams()
  }, [])

  const handleSave = async (values: any) => {
    try {
      if (editingParam) {
        await standardParamApi.update(editingParam.id, values)
        message.success('更新成功')
      } else {
        await standardParamApi.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchParams()
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await standardParamApi.delete(id)
      message.success('删除成功')
      fetchParams()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const columns = [
    { title: '产品型号', dataIndex: 'product_model', width: 120 },
    { title: '设备', dataIndex: 'device_name', width: 150 },
    { title: '工站', dataIndex: 'station_name', width: 150 },
    {
      title: '标准产出(件/h)',
      dataIndex: 'standard_output',
      width: 120,
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: '标准良品率',
      dataIndex: 'standard_quality_rate',
      width: 100,
      render: (v: number) => `${(v * 100).toFixed(1)}%`,
    },
    {
      title: '返工率上限',
      dataIndex: 'standard_rework_limit',
      width: 100,
      render: (v: number) => `${(v * 100).toFixed(1)}%`,
    },
    {
      title: '报废率上限',
      dataIndex: 'standard_scrap_limit',
      width: 100,
      render: (v: number) => `${(v * 100).toFixed(1)}%`,
    },
    { title: '备注', dataIndex: 'note', ellipsis: true },
    {
      title: '操作',
      width: 150,
      render: (_: any, record: StandardParam) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditingParam(record)
              form.setFieldsValue(record)
              setModalVisible(true)
            }}
          />
          <Popconfirm
            title="确认删除？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card
        title="标准参数管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingParam(null)
              form.resetFields()
              setModalVisible(true)
            }}
          >
            新增参数
          </Button>
        }
      >
        <Table
          dataSource={params}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingParam ? '编辑标准参数' : '新增标准参数'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Form.Item
            name="product_id"
            label="产品型号ID"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="device_id" label="设备ID">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="station_id"
            label="工站ID"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="standard_output"
            label="标准产出(件/h)"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item
            name="standard_quality_rate"
            label="标准良品率(0-1)"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} max={1} step={0.01} />
          </Form.Item>
          <Form.Item
            name="standard_rework_limit"
            label="返工率上限(0-1)"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} max={1} step={0.001} />
          </Form.Item>
          <Form.Item
            name="standard_scrap_limit"
            label="报废率上限(0-1)"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} max={1} step={0.001} />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
