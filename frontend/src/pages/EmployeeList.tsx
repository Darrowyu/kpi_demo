import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  employeeApi,
  Employee,
  EmployeeCreate,
  EmployeeQueryParams
} from '../services/employee'
import { factoryApi, Factory } from '../services/standardParam'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '../components/ui/dialog'
import {
  Select,
  SelectItem
} from '../components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Users,
  UserCheck,
  UserX,
  Building2,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import { cn } from '../lib/utils'

const getInitials = (name: string): string => name.slice(0, 2).toUpperCase()

// 状态徽章（终端风格）# 支持亮色/暗色双主题
const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'active') {
    return (
      <span className="badge-status-success">
        <span className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mr-1.5" />
        在职
      </span>
    )
  }
  return (
    <span className="badge-status-neutral">
      <span className="w-1 h-1 rounded-full bg-zinc-600 dark:bg-zinc-400 mr-1.5" />
      离职
    </span>
  )
}

const StatCard = ({
  title,
  value,
  icon: Icon
}: {
  title: string
  value: number
  icon: React.ElementType
}) => (
  <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
    <CardContent className="pt-4 pb-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
      </div>
      <div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{title}</p>
        <p className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 font-mono-data mt-1">{value}</p>
      </div>
    </CardContent>
  </Card>
)

export default function EmployeeList() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [employees, setEmployees] = useState<Employee[]>([])
  const [factories, setFactories] = useState<Factory[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFactory, setSelectedFactory] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const [formData, setFormData] = useState<EmployeeCreate>({
    employee_no: '',
    name: '',
    department: '',
    position: '',
    phone: '',
    email: '',
    factory_id: null,
    status: 'active',
    hire_date: null
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: EmployeeQueryParams = {
        skip: (page - 1) * pageSize,
        limit: pageSize,
        search: searchQuery || undefined,
        factory_id: selectedFactory ? parseInt(selectedFactory) : undefined,
        status: selectedStatus !== 'all' ? selectedStatus as 'active' | 'inactive' : undefined
      }

      const [listRes, factoriesRes, statsRes] = await Promise.all([
        employeeApi.getList(params),
        factoryApi.getAll(),
        employeeApi.getStats()
      ])

      setEmployees(listRes.data.items)
      setTotal(listRes.data.total)
      setFactories(factoriesRes.data)
      setStats(statsRes.data)
    } catch (error) {
      console.error('加载数据失败', error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchQuery, selectedFactory, selectedStatus])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalPages = Math.ceil(total / pageSize)

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.employee_no?.trim()) errors.employee_no = '工号不能为空'
    if (!formData.name?.trim()) errors.name = '姓名不能为空'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return
    try {
      if (editingEmployee) {
        await employeeApi.update(editingEmployee.id, formData)
      } else {
        await employeeApi.create(formData)
      }
      setModalOpen(false)
      resetForm()
      loadData()
    } catch (error: any) {
      const msg = error.response?.data?.detail || '保存失败'
      alert(msg)
    }
  }

  const handleDelete = async () => {
    if (!deletingEmployee) return
    setDeleteError('')
    try {
      await employeeApi.delete(deletingEmployee.id)
      setDeleteDialogOpen(false)
      setDeletingEmployee(null)
      loadData()
    } catch (error: any) {
      const msg = error.response?.data?.detail || '删除失败'
      setDeleteError(msg)
    }
  }

  const resetForm = () => {
    setFormData({
      employee_no: '',
      name: '',
      department: '',
      position: '',
      phone: '',
      email: '',
      factory_id: null,
      status: 'active',
      hire_date: null
    })
    setFormErrors({})
    setEditingEmployee(null)
  }

  const openAddModal = () => {
    resetForm()
    setModalOpen(true)
  }

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      employee_no: employee.employee_no,
      name: employee.name,
      department: employee.department || '',
      position: employee.position || '',
      phone: employee.phone || '',
      email: employee.email || '',
      factory_id: employee.factory_id,
      status: employee.status,
      hire_date: employee.hire_date
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const openDeleteDialog = (employee: Employee) => {
    setDeletingEmployee(employee)
    setDeleteError('')
    setDeleteDialogOpen(true)
  }

  const handleExport = () => {
    const headers = ['工号', '姓名', '部门', '职位', '电话', '邮箱', '厂区', '状态', '入职日期']
    const rows = employees.map(e => [
      e.employee_no, e.name, e.department, e.position, e.phone, e.email,
      e.factory_name, e.status === 'active' ? '在职' : '离职',
      e.hire_date ? new Date(e.hire_date).toLocaleDateString() : ''
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `员工列表_${new Date().toLocaleDateString()}.csv`
    link.click()
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedFactory('')
    setSelectedStatus('all')
    setPage(1)
  }

  return (
    <div className="space-y-5">
      {/* 页面标题区 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Users className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">员工管理</h1>
            <p className="text-sm text-zinc-400 dark:text-zinc-500">管理生产人员信息，支持按厂区、部门筛选</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="rounded-lg h-9 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
          >
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button
            size="sm"
            onClick={openAddModal}
            className="rounded-lg h-9 bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            新增员工
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard title="总员工数" value={stats.total} icon={Users} delay={0} />
        <StatCard title="在职员工" value={stats.active} icon={UserCheck} delay={100} />
        <StatCard title="离职员工" value={stats.inactive} icon={UserX} delay={200} />
        <StatCard title="厂区分布" value={factories.length} icon={Building2} delay={300} />
      </div>

      {/* 筛选工具栏 */}
      <Card className="terminal-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-64">
              <Label className="mb-1.5 block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                搜索
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <Input
                  placeholder="搜索工号、姓名、部门"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-lg h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-600"
                />
              </div>
            </div>
            <div className="w-40">
              <Label className="mb-1.5 block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                厂区
              </Label>
              <Select
                value={selectedFactory}
                onChange={(e) => setSelectedFactory(e.target.value)}
                className="rounded-lg h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
              >
                <SelectItem value="">全部厂区</SelectItem>
                {factories.map((f) => (
                  <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                ))}
              </Select>
            </div>
            <div className="w-48">
              <Label className="mb-1.5 block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                状态
              </Label>
              <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
                <TabsList className="grid w-full grid-cols-3 rounded-lg h-9 bg-zinc-100 dark:bg-zinc-800">
                  <TabsTrigger value="all" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-800 dark:data-[state=active]:text-zinc-100">全部</TabsTrigger>
                  <TabsTrigger value="active" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-800 dark:data-[state=active]:text-zinc-100">在职</TabsTrigger>
                  <TabsTrigger value="inactive" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-800 dark:data-[state=active]:text-zinc-100">离职</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="rounded-lg h-9 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 员工表格 */}
      <Card className="terminal-card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Users className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            员工列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-800">
                <tr>
                  <th className="h-10 px-3 text-left font-medium text-zinc-500 dark:text-zinc-400">工号</th>
                  <th className="h-10 px-3 text-left font-medium text-zinc-500 dark:text-zinc-400">姓名</th>
                  <th className="h-10 px-3 text-left font-medium text-zinc-500 dark:text-zinc-400">部门</th>
                  <th className="h-10 px-3 text-left font-medium text-zinc-500 dark:text-zinc-400">职位</th>
                  <th className="h-10 px-3 text-left font-medium text-zinc-500 dark:text-zinc-400">厂区</th>
                  <th className="h-10 px-3 text-left font-medium text-zinc-500 dark:text-zinc-400">状态</th>
                  <th className="h-10 px-3 text-left font-medium text-zinc-500 dark:text-zinc-400">入职日期</th>
                  <th className="h-10 px-3 text-right font-medium text-zinc-500 dark:text-zinc-400">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-3 text-center py-12">
                      <div className="flex items-center justify-center gap-2 text-zinc-400 dark:text-zinc-500">
                        <div className="animate-spin h-5 w-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-500 dark:border-t-zinc-400 rounded-full" />
                        加载中...
                      </div>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-3 text-center py-12 text-zinc-400 dark:text-zinc-500">
                      <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">暂无员工数据</p>
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="p-3 text-zinc-500 dark:text-zinc-500 font-mono-data text-xs">{employee.employee_no}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800">
                              {getInitials(employee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">{employee.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-zinc-700 dark:text-zinc-300 text-sm">{employee.department || '-'}</td>
                      <td className="p-3 text-zinc-700 dark:text-zinc-300 text-sm">{employee.position || '-'}</td>
                      <td className="p-3">
                        {employee.factory_name ? (
                          <span className="badge-status-neutral">
                            <Building2 className="h-3 w-3 mr-1" />
                            {employee.factory_name}
                          </span>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="p-3"><StatusBadge status={employee.status} /></td>
                      <td className="p-3 text-zinc-500 dark:text-zinc-400 text-sm font-mono-data">
                        {employee.hire_date
                          ? new Date(employee.hire_date).toLocaleDateString()
                          : '-'
                        }
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(employee)}
                            className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400"
                            onClick={() => openDeleteDialog(employee)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            共 <span className="font-medium text-zinc-700 dark:text-zinc-300">{total}</span> 条记录，第 <span className="font-medium text-zinc-700 dark:text-zinc-300">{page}</span> / {totalPages} 页
          </p>
          <div className="flex gap-1 p-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
              .map((p, i, arr) => (
                <div key={p} className="flex items-center">
                  {i > 0 && arr[i - 1] !== p - 1 && (
                    <span className="px-2 text-zinc-400 dark:text-zinc-600">...</span>
                  )}
                  <Button
                    variant={page === p ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPage(p)}
                    className={cn(
                      "rounded h-8 min-w-[32px] text-xs",
                      page === p
                        ? "bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                    )}
                  >
                    {p}
                  </Button>
                </div>
              ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 新增/编辑弹窗 */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                {editingEmployee ? <Edit2 className="h-4 w-4 text-zinc-500 dark:text-zinc-400" /> : <Plus className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />}
              </div>
              {editingEmployee ? '编辑员工' : '新增员工'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="employee_no" className="text-zinc-500 dark:text-zinc-400 text-sm">
                  工号 <span className="text-rose-500 dark:text-rose-400">*</span>
                </Label>
                <Input
                  id="employee_no"
                  value={formData.employee_no}
                  onChange={(e) => setFormData({ ...formData, employee_no: e.target.value })}
                  placeholder="请输入工号"
                  className="rounded-lg h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600"
                />
                {formErrors.employee_no && <p className="text-xs text-rose-500 dark:text-rose-400">{formErrors.employee_no}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-zinc-500 dark:text-zinc-400 text-sm">
                  姓名 <span className="text-rose-500 dark:text-rose-400">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入姓名"
                  className="rounded-lg h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600"
                />
                {formErrors.name && <p className="text-xs text-rose-500 dark:text-rose-400">{formErrors.name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="department" className="text-zinc-500 dark:text-zinc-400 text-sm">部门</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="请输入部门"
                  className="rounded-lg h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="position" className="text-zinc-500 dark:text-zinc-400 text-sm">职位</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="请输入职位"
                  className="rounded-lg h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-zinc-500 dark:text-zinc-400 text-sm">联系电话</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="请输入电话"
                  className="rounded-lg h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-zinc-500 dark:text-zinc-400 text-sm">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="请输入邮箱"
                  className="rounded-lg h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="factory" className="text-zinc-500 dark:text-zinc-400 text-sm">所属厂区</Label>
                <Select
                  value={formData.factory_id?.toString() || ''}
                  onChange={(e) => setFormData({ ...formData, factory_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="rounded-lg h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                >
                  <SelectItem value="">未分配</SelectItem>
                  {factories.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-zinc-500 dark:text-zinc-400 text-sm">状态</Label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="rounded-lg h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                >
                  <SelectItem value="active">在职</SelectItem>
                  <SelectItem value="inactive">离职</SelectItem>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hire_date" className="text-zinc-500 dark:text-zinc-400 text-sm">入职日期</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date ? formData.hire_date.split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="rounded-lg h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="rounded-lg h-9 px-4 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              className="rounded-lg h-9 px-4 bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200"
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </div>
              确认删除
            </DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-500 pt-2">
              确定要删除员工 <span className="font-medium text-zinc-700 dark:text-zinc-300">{deletingEmployee?.name}</span> 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-sm border border-rose-200 dark:border-rose-500/20">
              {deleteError}
            </div>
          )}
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-lg h-9 px-4 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
            >
              取消
            </Button>
            <Button
              onClick={handleDelete}
              className="rounded-lg h-9 px-4 bg-rose-600 dark:bg-rose-500 hover:bg-rose-700 dark:hover:bg-rose-600 text-white"
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
