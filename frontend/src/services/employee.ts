import api from './api'

export interface Employee {
  id: number
  employee_no: string
  name: string
  department: string
  position: string
  phone: string
  email: string
  factory_id: number | null
  factory_name: string
  status: 'active' | 'inactive'
  hire_date: string | null
  created_at: string
  updated_at: string
}

export interface EmployeeCreate {
  employee_no: string
  name: string
  department?: string
  position?: string
  phone?: string
  email?: string
  factory_id?: number | null
  status?: 'active' | 'inactive'
  hire_date?: string | null
}

export interface EmployeeListResponse {
  total: number
  items: Employee[]
  page: number
  page_size: number
}

export interface EmployeeQueryParams {
  skip?: number
  limit?: number
  factory_id?: number
  status?: 'active' | 'inactive'
  search?: string
}

export const employeeApi = {
  // 获取员工列表（支持分页、筛选、搜索）
  getList: (params?: EmployeeQueryParams) => 
    api.get<EmployeeListResponse>('/employees/', { params }),
  
  // 获取所有员工（不分页）
  getAll: () => api.get<Employee[]>('/employees/?limit=1000'),
  
  // 获取单个员工
  getById: (id: number) => api.get<Employee>(`/employees/${id}`),
  
  // 创建员工
  create: (data: EmployeeCreate) => api.post<Employee>('/employees/', data),
  
  // 更新员工
  update: (id: number, data: EmployeeCreate) => 
    api.put<Employee>(`/employees/${id}`, data),
  
  // 删除员工
  delete: (id: number) => api.delete(`/employees/${id}`),
  
  // 批量导入
  batchImport: (data: EmployeeCreate[]) => 
    api.post('/employees/batch-import', data),
  
  // 获取统计信息
  getStats: () => api.get<{
    total: number
    active: number
    inactive: number
    by_factory: { factory_id: number; count: number }[]
  }>('/employees/stats/summary'),
}
