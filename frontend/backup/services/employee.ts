import api from './api'

export interface Employee {
  id: number
  employee_no: string
  name: string
  department: string
  created_at: string
  updated_at: string
}

export interface EmployeeCreate {
  employee_no: string
  name: string
  department?: string
}

export const employeeApi = {
  getAll: () => api.get<Employee[]>('/employees/'),
  getById: (id: number) => api.get<Employee>(`/employees/${id}`),
  create: (data: EmployeeCreate) => api.post<Employee>('/employees/', data),
  update: (id: number, data: EmployeeCreate) => api.put<Employee>(`/employees/${id}`, data),
  delete: (id: number) => api.delete(`/employees/${id}`),
}
