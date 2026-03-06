import api from './api'

export interface KPIResult {
  id: number
  employee_id: number
  employee_name: string
  employee_no: string
  month: string
  working_hours_rate: number
  quality_rate: number
  productivity_rate: number
  rework_rate: number
  scrap_rate: number
  working_hours_grade: string
  quality_grade: string
  productivity_grade: string
  rework_grade: string
  scrap_grade: string
  total_score: number
  final_grade: string
  created_at: string
}

export interface KPICalculationRequest {
  employee_id: number
  month: string
}

export interface KPICalculationResponse {
  success: boolean
  message: string
  result?: KPIResult
}

export const kpiApi = {
  calculate: (data: KPICalculationRequest) =>
    api.post<KPICalculationResponse>('/kpi/calculate', data),
  getResults: (params?: { employee_id?: number; month?: string }) =>
    api.get<KPIResult[]>('/kpi/results', { params }),
  getResultById: (id: number) => api.get<KPIResult>(`/kpi/results/${id}`),
}
