import request from '@/utils/request.js'

export const listMsgDayMatter = (query) =>
  request({ url: '/msg/msgDayMatter/list', method: 'GET', params: query })

export const getMsgDayMatter = (id) =>
  request({ url: '/msg/msgDayMatter/' + id, method: 'GET' })

export const addMsgDayMatter = (data) =>
  request({ url: '/msg/msgDayMatter', method: 'POST', data })

export const updateMsgDayMatter = (data) =>
  request({ url: '/msg/msgDayMatter', method: 'PUT', data })

export const delMsgDayMatter = (id) =>
  request({ url: '/msg/msgDayMatter/' + id, method: 'DELETE' })

/** 首页日历用：按年月拉取事件提醒 */
export const dayMatterList = (params) =>
  request({ url: '/msg/msgDayMatter/dayMatterList', method: 'GET', params })

/** 手机闹钟：当前用户待通知事件的原始时间和下次提醒时间 */
export const phoneAlarms = () =>
  request({ url: '/msg/msgDayMatter/phoneAlarms', method: 'GET' })
