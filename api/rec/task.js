import request from '@/utils/request.js'

export const listRecTask = (query) =>
  request({ url: '/rec/recTask/list', method: 'GET', params: query })

export const getRecTask = (id) =>
  request({ url: '/rec/recTask/' + id, method: 'GET' })

export const addRecTask = (data) =>
  request({ url: '/rec/recTask', method: 'POST', data })

export const updateRecTask = (data) =>
  request({ url: '/rec/recTask', method: 'PUT', data })

export const delRecTask = (id) =>
  request({ url: '/rec/recTask/' + id, method: 'DELETE' })
