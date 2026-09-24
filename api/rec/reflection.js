import request from '@/utils/request.js'

export const listRecReflection = (query) =>
  request({ url: '/rec/recReflection/list', method: 'GET', params: query })

export const getRecReflection = (id) =>
  request({ url: '/rec/recReflection/' + id, method: 'GET' })

export const addRecReflection = (data) =>
  request({ url: '/rec/recReflection', method: 'POST', data })

export const updateRecReflection = (data) =>
  request({ url: '/rec/recReflection', method: 'PUT', data })

export const delRecReflection = (id) =>
  request({ url: '/rec/recReflection/' + id, method: 'DELETE' })
