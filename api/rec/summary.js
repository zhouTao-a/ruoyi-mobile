import request from '@/utils/request.js'

export const getRecSummary = (params) =>
  request({ url: '/rec/summary', method: 'GET', params })
