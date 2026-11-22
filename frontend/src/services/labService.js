
import api from './api'

export const labService = {
  // ==========================================
  // TARGETS
  // ==========================================

  async getTargets(params = {}) {
    const response = await api.get('/lab/targets', { params })
    return response.data.data
  },

  async getPendingTargets(params = {}) {
    const response = await api.get('/lab/targets/pending', { params })
    return response.data.data
  },

  async getTarget(id) {
    const response = await api.get(`/lab/targets/${id}`)
    return response.data.data
  },

  async createTarget(payload) {
    const response = await api.post('/lab/targets', payload)
    return response.data
  },

  async approveTarget(id) {
    const response = await api.patch(`/lab/targets/${id}/approve`)
    return response.data
  },

  async rejectTarget(id) {
    const response = await api.patch(`/lab/targets/${id}/reject`)
    return response.data
  },

  // ==========================================
  // LAB SESSIONS
  // ==========================================

  async getSessions(params = {}) {
    const response = await api.get('/lab/sessions', { params })
    return response.data.data
  },

  async getSession(id) {
    const response = await api.get(`/lab/sessions/${id}`)
    return response.data.data
  },

  async createSession(payload) {
    const response = await api.post('/lab/sessions', payload)
    return response.data
  },

  async startSession(id) {
    const response = await api.patch(`/lab/sessions/${id}/start`)
    return response.data
  },

  async completeSession(id, payload = {}) {
    const response = await api.patch(
      `/lab/sessions/${id}/complete`,
      payload
    )
    return response.data
  },

  async cancelSession(id) {
    const response = await api.patch(`/lab/sessions/${id}/cancel`)
    return response.data
  },

  // ==========================================
  // SCANNER EXECUTION
  // ==========================================

  async executeScanner(sessionId, payload) {
    const response = await api.post(
      `/lab/sessions/${sessionId}/execute`,
      payload
    )
    return response.data
  },

  // ==========================================
  // SECURITY FINDINGS
  // ==========================================

  async getFindings(sessionId, params = {}) {
    const response = await api.get(
      `/lab/sessions/${sessionId}/findings`,
      { params }
    )
    return response.data.data
  },

  async getFinding(sessionId, findingId) {
    const response = await api.get(
      `/lab/sessions/${sessionId}/findings/${findingId}`
    )
    return response.data.data
  },

  async createFinding(sessionId, payload) {
    const response = await api.post(
      `/lab/sessions/${sessionId}/findings`,
      payload
    )
    return response.data
  },

  async updateFinding(sessionId, findingId, payload) {
    const response = await api.put(
      `/lab/sessions/${sessionId}/findings/${findingId}`,
      payload
    )
    return response.data
  },

  async updateFindingStatus(sessionId, findingId, status) {
    const response = await api.patch(
      `/lab/sessions/${sessionId}/findings/${findingId}/status`,
      { status }
    )
    return response.data
  },

  async deleteFinding(sessionId, findingId) {
    const response = await api.delete(
      `/lab/sessions/${sessionId}/findings/${findingId}`
    )
    return response.data
  },
}
