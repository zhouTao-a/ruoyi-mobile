import request from '@/utils/request.js'

export const listRecReport = (query) =>
  request({ url: '/rec/recReport/list', method: 'GET', params: query })

export const getRecReport = (id) =>
  request({ url: '/rec/recReport/' + id, method: 'GET' })

export const addRecReport = (data) =>
  request({ url: '/rec/recReport', method: 'POST', data })

export const updateRecReport = (data) =>
  request({ url: '/rec/recReport', method: 'PUT', data })

export const delRecReport = (id) =>
  request({ url: '/rec/recReport/' + id, method: 'DELETE' })
