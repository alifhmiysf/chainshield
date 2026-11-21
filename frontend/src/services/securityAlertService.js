
import api from './api'

export const securityAlertService = {
  async getAlerts(params = {}) {
    const response = await api.get('/security/alerts', { params })
    return response.data.data
  },

  async getAlert(id) {
    const response = await api.get(`/security/alerts/${id}`)
    return response.data.data
  },

  async updateAlert(id, payload) {
    const response = await api.patch(`/security/alerts/${id}`, payload)
    return response.data.data
  },
}
