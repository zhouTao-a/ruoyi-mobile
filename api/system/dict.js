import request from '@/utils/request.js'

/** 按字典类型取字典项，返回值在 data */
export function getDicts(dictType) {
  return request({
    url: '/system/dict/data/type/' + dictType,
    method: 'get'
  })
}
