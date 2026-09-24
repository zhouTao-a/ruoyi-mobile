import request from '@/utils/request.js'

export const listMsgUser = (query) =>
  request({ url: '/msg/msgUser/list', method: 'GET', params: query })

export const getMsgUser = (id) =>
  request({ url: '/msg/msgUser/' + id, method: 'GET' })

export const addMsgUser = (data) =>
  request({ url: '/msg/msgUser', method: 'POST', data })

export const updateMsgUser = (data) =>
  request({ url: '/msg/msgUser', method: 'PUT', data })

export const delMsgUser = (id) =>
  request({ url: '/msg/msgUser/' + id, method: 'DELETE' })
