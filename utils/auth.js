import { TOKEN_KEY, USER_KEY } from '@/config/index.js'

export function getToken() {
  return uni.getStorageSync(TOKEN_KEY) || ''
}

export function setToken(token) {
  uni.setStorageSync(TOKEN_KEY, token || '')
}

export function removeToken() {
  uni.removeStorageSync(TOKEN_KEY)
}

export function getUser() {
  try {
    return uni.getStorageSync(USER_KEY) || null
  } catch (e) {
    return null
  }
}

export function setUser(user) {
  uni.setStorageSync(USER_KEY, user || null)
}

export function removeUser() {
  uni.removeStorageSync(USER_KEY)
}

export function clearAuth() {
  removeToken()
  removeUser()
}
