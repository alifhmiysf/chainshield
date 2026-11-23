import api from './api'

export const reportService = {
  async downloadCsv(filters = {}) {
    const response = await api.get('/reports/csv', {
      params: filters,
      responseType: 'blob',
    })

    return response.data
  },

  async downloadPdf(filters = {}) {
    const response = await api.get('/reports/pdf', {
      params: filters,
      responseType: 'blob',
    })

    return response.data
  },
}
