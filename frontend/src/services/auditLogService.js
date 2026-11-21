
import api from './api'

export const auditLogService = {
  async getLogs(params = {}) {
    const response = await api.get('/audit/logs', { params })
    return response.data.data
  },

  async getLog(id) {
    const response = await api.get(`/audit/logs/${id}`)
    return response.data.data
  },

  async verifyIntegrity() {
    const response = await api.get('/audit/verify')
    return response.data.data
  },
}
