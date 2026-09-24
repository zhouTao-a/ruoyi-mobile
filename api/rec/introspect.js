import request from '@/utils/request.js'

export const listRecIntrospect = (query) =>
  request({ url: '/rec/recIntrospect/list', method: 'GET', params: query })

export const getRecIntrospect = (id) =>
  request({ url: '/rec/recIntrospect/' + id, method: 'GET' })

export const addRecIntrospect = (data) =>
  request({ url: '/rec/recIntrospect', method: 'POST', data })

export const updateRecIntrospect = (data) =>
  request({ url: '/rec/recIntrospect', method: 'PUT', data })

export const delRecIntrospect = (id) =>
  request({ url: '/rec/recIntrospect/' + id, method: 'DELETE' })

export const listRecIntrospectItem = (query) =>
  request({ url: '/rec/recIntrospectItem/list', method: 'GET', params: query })

export const addRecIntrospectItem = (data) =>
  request({ url: '/rec/recIntrospectItem', method: 'POST', data })

export const updateRecIntrospectItem = (data) =>
  request({ url: '/rec/recIntrospectItem', method: 'PUT', data })

export const delRecIntrospectItem = (id) =>
  request({ url: '/rec/recIntrospectItem/' + id, method: 'DELETE' })
