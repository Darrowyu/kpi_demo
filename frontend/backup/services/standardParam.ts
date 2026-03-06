import api from './api'

export interface StandardParam {
  id: number
  product_id: number
  device_id: number | null
  station_id: number
  product_model: string
  device_name: string
  station_name: string
  standard_output: number
  standard_quality_rate: number
  standard_rework_limit: number
  standard_scrap_limit: number
  note: string
  created_at: string
  updated_at: string
}

export interface StandardParamCreate {
  product_id: number
  device_id?: number | null
  station_id: number
  standard_output: number
  standard_quality_rate: number
  standard_rework_limit: number
  standard_scrap_limit: number
  note?: string
}

export const standardParamApi = {
  getAll: (params?: { product_id?: number; device_id?: number; station_id?: number }) =>
    api.get<StandardParam[]>('/standard-params/', { params }),
  create: (data: StandardParamCreate) => api.post<StandardParam>('/standard-params/', data),
  update: (id: number, data: Partial<StandardParamCreate>) =>
    api.put<StandardParam>(`/standard-params/${id}`, data),
  delete: (id: number) => api.delete(`/standard-params/${id}`),
  batchImport: (data: StandardParamCreate[]) =>
    api.post('/standard-params/batch-import', data),
}
