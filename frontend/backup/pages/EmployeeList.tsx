import { useState, useEffect } from 'react'
import { Table, Button, Card, Modal, Form, Input, message, Space, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { employeeApi, Employee, EmployeeCreate } from '../services/employee'

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [form] = Form.useForm()

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const response = await employeeApi.getAll()
      setEmployees(response.data)
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const handleSave = async (values: EmployeeCreate) => {
    try {
      if (editingEmployee) {
        await employeeApi.update(editingEmployee.id, values)
        message.success('更新成功')
      } else {
        await employeeApi.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchEmployees()
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await employeeApi.delete(id)
      message.success('删除成功')
      fetchEmployees()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const columns = [
    { title: '工号', dataIndex: 'employee_no' },
    { title: '姓名', dataIndex: 'name' },
    { title: '部门', dataIndex: 'department' },
    {
      title: '操作',
      render: (_: any, record: Employee) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditingEmployee(record)
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
        title="员工管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingEmployee(null)
              form.resetFields()
              setModalVisible(true)
            }}
          >
            新增员工
          </Button>
        }
      >
        <Table
          dataSource={employees}
          columns={columns}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingEmployee ? '编辑员工' : '新增员工'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Form.Item
            name="employee_no"
            label="工号"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="department" label="部门">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
