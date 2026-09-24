import request from '@/utils/request.js'

export const listRecGoal = (query) =>
  request({ url: '/rec/recGoal/list', method: 'GET', params: query })

export const getRecGoal = (id) =>
  request({ url: '/rec/recGoal/' + id, method: 'GET' })

export const addRecGoal = (data) =>
  request({ url: '/rec/recGoal', method: 'POST', data })

export const updateRecGoal = (data) =>
  request({ url: '/rec/recGoal', method: 'PUT', data })

export const delRecGoal = (id) =>
  request({ url: '/rec/recGoal/' + id, method: 'DELETE' })
