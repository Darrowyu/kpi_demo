import api from './api'

export interface StandardParam {
  id: number
  factory_id: number
  product_id: number
  device_id: number | null
  station_id: number
  factory_name: string
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
  factory_id: number
  product_id: number
  device_id?: number | null
  station_id: number
  standard_output: number
  standard_quality_rate: number
  standard_rework_limit: number
  standard_scrap_limit: number
  note?: string
}

// 按产品型号分组
export interface StandardParamByProduct {
  product_id: number
  product_model: string
  params: StandardParam[]
}

// 按厂区分组
export interface StandardParamByFactory {
  factory_id: number
  factory_name: string
  factory_code: string
  products: StandardParamByProduct[]
}

// 厂区
export interface Factory {
  id: number
  code: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export const standardParamApi = {
  // 获取标准参数列表
  getAll: (params?: { 
    factory_id?: number
    product_id?: number
    device_id?: number
    station_id?: number 
  }) => api.get<StandardParam[]>('/standard-params/', { params }),
  
  // 按厂区分组获取（支持按型号分类显示）
  getByFactory: (factory_id?: number) => 
    api.get<StandardParamByFactory[]>('/standard-params/by-factory', { params: { factory_id } }),
  
  create: (data: StandardParamCreate) => api.post<StandardParam>('/standard-params/', data),
  update: (id: number, data: Partial<StandardParamCreate>) =>
    api.put<StandardParam>(`/standard-params/${id}`, data),
  delete: (id: number) => api.delete(`/standard-params/${id}`),
  batchImport: (data: StandardParamCreate[]) =>
    api.post('/standard-params/batch-import', data),
}

export const factoryApi = {
  getAll: () => api.get<Factory[]>('/factories/'),
  create: (data: Omit<Factory, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<Factory>('/factories/', data),
  update: (id: number, data: Partial<Factory>) => 
    api.put<Factory>(`/factories/${id}`, data),
  delete: (id: number) => api.delete(`/factories/${id}`),
}
