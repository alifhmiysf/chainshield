import api from './api'

export const auditBatchService = {
  async getBatches(params = {}) {
    const response = await api.get('/blockchain/batches', { params })
    return response.data.data
  },

  async getBatch(id) {
    const response = await api.get(`/blockchain/batches/${id}`)
    return response.data.data
  },

  async createBatch() {
    const response = await api.post('/blockchain/batches')
    return response.data
  },

  async anchorBatch(id) {
    const response = await api.post(`/blockchain/batches/${id}/anchor`)
    return response.data
  },

  async verifyBatch(id) {
    const response = await api.get(`/blockchain/batches/${id}/verify`)
    return response.data
  },
}
