
import api from './api'

export const userService = {
  async getUsers(params = {}) {
    const response = await api.get('/users', { params })
    return response.data.data
  },

  async getRoles() {
    const response = await api.get('/users/roles')
    return response.data.data
  },

  async createUser(payload) {
    const response = await api.post('/users', payload)
    return response.data
  },

  async updateRole(userId, role) {
    const response = await api.patch(`/users/${userId}/role`, { role })
    return response.data
  },
}
