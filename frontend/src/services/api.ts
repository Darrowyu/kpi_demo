import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api

// 产品API
export const productApi = {
  getAll: () => api.get('/products/'),
  create: (data: { model: string; category?: string; description?: string }) => 
    api.post('/products/', data),
  delete: (id: number) => api.delete(`/products/${id}`),
}

// 设备API
export const deviceApi = {
  getAll: () => api.get('/stations/devices/'),
  create: (data: { name: string; device_type?: string }) => 
    api.post('/stations/devices/', data),
  delete: (id: number) => api.delete(`/stations/devices/${id}`),
}

// 工站API
export const stationApi = {
  getAll: () => api.get('/stations/'),
  create: (data: { name: string; description?: string }) => 
    api.post('/stations/', data),
  delete: (id: number) => api.delete(`/stations/${id}`),
}
