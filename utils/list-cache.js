/**
 * 列表本地缓存：入口页预加载 / 子页面缓存优先用。
 * 30 分钟 TTL，避免长期陈旧数据。
 */
const PREFIX = 'list_cache_'
const TTL = 30 * 60 * 1000

export function readCache(key) {
  if (!key) return []
  try {
    const raw = uni.getStorageSync(PREFIX + key)
    if (!raw) return []
    const { ts, rows } = raw || {}
    if (typeof ts !== 'number' || Date.now() - ts > TTL) return []
    return Array.isArray(rows) ? rows : []
  } catch (e) {
    return []
  }
}

export function writeCache(key, rows) {
  if (!key) return
  try {
    uni.setStorageSync(PREFIX + key, { ts: Date.now(), rows: rows || [] })
  } catch (e) {}
}

export function clearCache(key) {
  if (!key) return
  try {
    uni.removeStorageSync(PREFIX + key)
  } catch (e) {}
}
