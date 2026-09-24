import {
  BASE_URL,
  CLIENT_ID,
  ENCRYPT_ENABLED
} from '@/config/index.js'
import { getToken, clearAuth } from '@/utils/auth.js'
import { encrypt, decrypt } from '@/utils/jsencrypt.js'
import {
  decryptBase64,
  decryptWithAes,
  encryptBase64,
  encryptWithAes,
  generateAesKey
} from '@/utils/crypto.js'

const ENCRYPT_HEADER = 'encrypt-key'

/**
 * 将对象拼成 query 字符串
 */
function tansParams(params = {}) {
  let result = ''
  Object.keys(params).forEach((key) => {
    const value = params[key]
    if (value !== null && value !== undefined && value !== '') {
      result += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`
    }
  })
  return result
}

/**
 * 统一请求封装（对齐 PC 端鉴权 / 加密约定）
 * @param {object} options
 * @param {string} options.url
 * @param {string} [options.method]
 * @param {object} [options.data]
 * @param {object} [options.params]
 * @param {boolean} [options.isToken] 默认 true；登录等接口传 false
 * @param {boolean} [options.isEncrypt] 是否加密请求体
 */
export function request(options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  let url = BASE_URL + options.url
  let data = options.data

  if (method === 'GET' && options.params) {
    const qs = tansParams(options.params)
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs.slice(0, -1)
    }
  }

  const header = {
    'Content-Type': 'application/json;charset=utf-8',
    clientid: CLIENT_ID,
    'Client-Id': CLIENT_ID,
    ...(options.header || {})
  }

  const needToken = options.isToken !== false
  const token = getToken()
  if (needToken && token) {
    header.Authorization = 'Bearer ' + token
  }

  // 登录等敏感接口：AES 加密 body，RSA 加密 AES 密钥放入请求头
  const needEncrypt = ENCRYPT_ENABLED && options.isEncrypt === true && (method === 'POST' || method === 'PUT')
  if (needEncrypt && data) {
    const aesKey = generateAesKey()
    header[ENCRYPT_HEADER] = encrypt(encryptBase64(aesKey))
    data = encryptWithAes(typeof data === 'object' ? JSON.stringify(data) : String(data), aesKey)
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method,
      data,
      header,
      timeout: 50000,
      success: (res) => {
        let body = res.data
        // 响应体可能被加密
        try {
          const keyStr = res.header && (res.header[ENCRYPT_HEADER] || res.header['Encrypt-Key'] || res.header['encrypt-key'])
          if (ENCRYPT_ENABLED && keyStr && typeof body === 'string') {
            const base64Str = decrypt(keyStr)
            const aesKey = decryptBase64(base64Str.toString())
            body = JSON.parse(decryptWithAes(body, aesKey))
          }
        } catch (e) {
          console.warn('响应解密失败', e)
        }

        const code = (body && body.code) || 200
        const msg = (body && body.msg) || '请求失败'

        if (code === 401) {
          clearAuth()
          uni.showToast({ title: '请重新登录', icon: 'none' })
          setTimeout(() => {
            uni.reLaunch({ url: '/pages/login/index' })
          }, 500)
          reject(new Error(msg))
          return
        }

        if (code !== 200) {
          uni.showToast({ title: msg, icon: 'none' })
          reject(new Error(msg))
          return
        }

        resolve(body)
      },
      fail: (err) => {
        uni.showToast({ title: '网络异常，请检查 BASE_URL', icon: 'none' })
        reject(err)
      }
    })
  })
}

export default request
