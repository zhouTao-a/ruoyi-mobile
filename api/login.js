import request from '@/utils/request.js'
import { CLIENT_ID } from '@/config/index.js'

/** 账号密码登录 */
export function login(data) {
  const params = {
    ...data,
    clientId: data.clientId || CLIENT_ID,
    grantType: data.grantType || 'password'
  }
  return request({
    url: '/auth/login',
    method: 'POST',
    data: params,
    isToken: false,
    isEncrypt: true
  })
}

/** 退出登录 */
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'POST'
  })
}

/** 当前登录用户信息 */
export function getInfo() {
  return request({
    url: '/system/user/getInfo',
    method: 'GET'
  })
}
