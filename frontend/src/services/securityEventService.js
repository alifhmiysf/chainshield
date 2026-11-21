
import api from './api'

export const securityEventService = {
  async getEvents(params = {}) {
    const response = await api.get('/security/events', { params })
    return response.data.data
  },

  async getEvent(id) {
    const response = await api.get(`/security/events/${id}`)
    return response.data.data
  },
}
