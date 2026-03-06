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
import { Badge } from '../components/ui/badge'
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '../components/ui/table'
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
  Filter,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  RefreshCw
} from 'lucide-react'

const getInitials = (name: string): string => name.slice(0, 2).toUpperCase()

const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
        style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#059669' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        在职
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{ background: 'rgba(100, 116, 139, 0.1)', color: '#64748b' }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      离职
    </span>
  )
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  gradient,
  delay = 0
}: {
  title: string
  value: number
  icon: React.ElementType
  gradient: string
  delay?: number
}) => (
  <Card
    className="border-0 overflow-hidden animate-slide-up"
    style={{
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      animationDelay: `${delay}ms`
    }}
  >
    <CardContent className="p-5 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: gradient,
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
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
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题区 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
            }}
          >
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">员工管理</h1>
            <p className="text-slate-500">管理生产人员信息，支持按厂区、部门筛选</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            className="rounded-xl h-11 border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/30"
          >
            <Download className="h-4 w-4 mr-2 text-cyan-600" />
            导出
          </Button>
          <Button
            onClick={openAddModal}
            className="rounded-xl h-11 font-semibold"
            style={{
              background: 'linear-gradient(135deg, #0891b2 0%, #4f46e5 100%)',
              boxShadow: '0 4px 14px rgba(8, 145, 178, 0.35)',
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            新增员工
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="总员工数" value={stats.total} icon={Users} gradient="linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" delay={0} />
        <StatCard title="在职员工" value={stats.active} icon={UserCheck} gradient="linear-gradient(135deg, #059669 0%, #10b981 100%)" delay={100} />
        <StatCard title="离职员工" value={stats.inactive} icon={UserX} gradient="linear-gradient(135deg, #64748b 0%, #94a3b8 100%)" delay={200} />
        <StatCard title="厂区分布" value={factories.length} icon={Building2} gradient="linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)" delay={300} />
      </div>

      {/* 筛选工具栏 */}
      <Card
        className="border-0 animate-slide-up"
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          animationDelay: '400ms'
        }}
      >
        <CardContent className="p-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-72">
              <Label className="mb-2 block text-sm font-semibold text-slate-700">
                <Search className="h-4 w-4 inline mr-1 text-cyan-600" />
                搜索
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="搜索工号、姓名、部门"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl h-11 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                />
              </div>
            </div>
            <div className="w-48">
              <Label className="mb-2 block text-sm font-semibold text-slate-700">
                <Building2 className="h-4 w-4 inline mr-1 text-cyan-600" />
                厂区
              </Label>
              <Select
                value={selectedFactory}
                onChange={(e) => setSelectedFactory(e.target.value)}
                className="rounded-xl h-11 border-slate-200"
              >
                <SelectItem value="">全部厂区</SelectItem>
                {factories.map((f) => (
                  <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                ))}
              </Select>
            </div>
            <div className="w-48">
              <Label className="mb-2 block text-sm font-semibold text-slate-700">
                <Filter className="h-4 w-4 inline mr-1 text-cyan-600" />
                状态
              </Label>
              <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
                <TabsList className="grid w-full grid-cols-3 rounded-xl h-11">
                  <TabsTrigger value="all">全部</TabsTrigger>
                  <TabsTrigger value="active">在职</TabsTrigger>
                  <TabsTrigger value="inactive">离职</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Button
              variant="outline"
              onClick={resetFilters}
              className="rounded-xl h-11 border-slate-200 hover:border-cyan-400"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 员工表格 */}
      <Card
        className="border-0 overflow-hidden animate-slide-up"
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          animationDelay: '500ms'
        }}
      >
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="font-semibold text-slate-600">员工信息</TableHead>
                <TableHead className="font-semibold text-slate-600">部门/职位</TableHead>
                <TableHead className="font-semibold text-slate-600">厂区</TableHead>
                <TableHead className="font-semibold text-slate-600">联系方式</TableHead>
                <TableHead className="font-semibold text-slate-600">状态</TableHead>
                <TableHead className="font-semibold text-slate-600">入职日期</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex items-center justify-center gap-3 text-slate-400">
                      <div className="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full" />
                      加载中...
                    </div>
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>暂无员工数据</p>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-slate-50/60">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11">
                          <AvatarFallback
                            className="text-white font-semibold"
                            style={{
                              background: 'linear-gradient(135deg, #0891b2 0%, #4f46e5 100%)',
                            }}
                          >
                            {getInitials(employee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-slate-800">{employee.name}</p>
                          <p className="text-sm text-slate-400">{employee.employee_no}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-slate-700">{employee.department || '-'}</p>
                        <p className="text-sm text-slate-400">{employee.position || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {employee.factory_name ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                          style={{ background: 'rgba(8, 145, 178, 0.1)', color: '#0891b2' }}
                        >
                          <Building2 className="h-3 w-3" />
                          {employee.factory_name}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {employee.phone && (
                          <p className="flex items-center gap-1 text-slate-600">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {employee.phone}
                          </p>
                        )}
                        {employee.email && (
                          <p className="flex items-center gap-1 text-slate-400 mt-0.5">
                            <Mail className="h-3 w-3" />
                            {employee.email}
                          </p>
                        )}
                        {!employee.phone && !employee.email && <span className="text-slate-400">-</span>}
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={employee.status} /></TableCell>
                    <TableCell>
                      {employee.hire_date
                        ? new Date(employee.hire_date).toLocaleDateString()
                        : <span className="text-slate-400">-</span>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(employee)}
                          className="h-9 w-9 rounded-lg hover:bg-cyan-50 hover:text-cyan-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg hover:bg-red-50 hover:text-red-500"
                          onClick={() => openDeleteDialog(employee)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页 */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between animate-slide-up"
          style={{
            animationDelay: '600ms'
          }}
        >
          <p className="text-sm text-slate-500">
            共 <span className="font-semibold text-slate-700">{total}</span> 条记录，第 <span className="font-semibold text-slate-700">{page}</span> / {totalPages} 页
          </p>
          <div
            className="flex gap-2 p-2 rounded-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg h-10 w-10 p-0 border-slate-200 hover:border-cyan-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
              .map((p, i, arr) => (
                <div key={p} className="flex items-center">
                  {i > 0 && arr[i - 1] !== p - 1 && (
                    <span className="px-2 text-slate-400">...</span>
                  )}
                  <Button
                    variant={page === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(p)}
                    className="rounded-lg h-10 min-w-[40px] font-medium"
                    style={page === p ? {
                      background: 'linear-gradient(135deg, #0891b2 0%, #4f46e5 100%)',
                      boxShadow: '0 4px 10px rgba(8, 145, 178, 0.3)',
                      border: 'none'
                    } : {}}
                  >
                    {p}
                  </Button>
                </div>
              ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg h-10 w-10 p-0 border-slate-200 hover:border-cyan-400"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 新增/编辑弹窗 */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-2xl border-0"
          style={{
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #0891b2 0%, #4f46e5 100%)',
                  boxShadow: '0 4px 14px rgba(8, 145, 178, 0.35)',
                }}
              >
                {editingEmployee ? <Edit2 className="h-5 w-5 text-white" /> : <Plus className="h-5 w-5 text-white" />}
              </div>
              {editingEmployee ? '编辑员工' : '新增员工'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_no" className="text-slate-700">
                  工号 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="employee_no"
                  value={formData.employee_no}
                  onChange={(e) => setFormData({ ...formData, employee_no: e.target.value })}
                  placeholder="请输入工号"
                  className="rounded-xl h-11 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                />
                {formErrors.employee_no && <p className="text-sm text-red-500">{formErrors.employee_no}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700">
                  姓名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入姓名"
                  className="rounded-xl h-11 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                />
                {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department" className="text-slate-700">部门</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="请输入部门"
                  className="rounded-xl h-11 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position" className="text-slate-700">职位</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="请输入职位"
                  className="rounded-xl h-11 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700">联系电话</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="请输入电话"
                  className="rounded-xl h-11 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="请输入邮箱"
                  className="rounded-xl h-11 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="factory" className="text-slate-700">所属厂区</Label>
                <Select
                  value={formData.factory_id?.toString() || ''}
                  onChange={(e) => setFormData({ ...formData, factory_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="rounded-xl h-11 border-slate-200"
                >
                  <SelectItem value="">未分配</SelectItem>
                  {factories.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-slate-700">状态</Label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="rounded-xl h-11 border-slate-200"
                >
                  <SelectItem value="active">在职</SelectItem>
                  <SelectItem value="inactive">离职</SelectItem>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hire_date" className="text-slate-700">入职日期</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date ? formData.hire_date.split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="rounded-xl h-11 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="rounded-xl h-11 px-6 border-slate-200 hover:border-slate-300"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              className="rounded-xl h-11 px-6 font-semibold"
              style={{
                background: 'linear-gradient(135deg, #0891b2 0%, #4f46e5 100%)',
                boxShadow: '0 4px 14px rgba(8, 145, 178, 0.35)',
              }}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent
          className="border-0"
          style={{
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                }}
              >
                <Trash2 className="h-5 w-5 text-white" />
              </div>
              确认删除
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-2">
              确定要删除员工 <span className="font-semibold text-slate-800">{deletingEmployee?.name}</span> 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
              {deleteError}
            </div>
          )}
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-xl h-11 px-6 border-slate-200 hover:border-slate-300"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="rounded-xl h-11 px-6"
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
              }}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
