import api from './api'

export const uploadApi = {
  uploadProductionRecords: (file: File, month?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (month) {
      formData.append('month', month)
    }
    return api.post('/upload/production-records', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}
