/**
 * 计算手机闹钟时刻。
 * 日期取下次提醒日；钟点取事件自己的时分秒。
 * 时分秒是 00:00:00 时不跟邮件的 06:00，改为当天上午 10:00。
 * 已经过点的不返回，避免一打开 App 就补响。
 */

const SKEW_MS = 5000

function parseDate(val) {
  if (val == null || val === '') return null
  if (typeof val === 'number') return new Date(val)
  if (typeof val === 'string' && /^\d+$/.test(val.trim())) return new Date(Number(val.trim()))
  const matched = String(val).trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/)
  if (!matched) return null
  return new Date(
    Number(matched[1]),
    Number(matched[2]) - 1,
    Number(matched[3]),
    Number(matched[4] || 0),
    Number(matched[5] || 0),
    Number(matched[6] || 0)
  )
}

function isZeroClock(date) {
  return date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0
}

/**
 * @param {string|Date} dayTarget 事件原始时间
 * @param {string|Date} nextNotifyTime 下次提醒时间
 * @param {number} [now] 当前毫秒，便于测试
 * @returns {number|null} 未来的响铃时间戳
 */
export function phoneAlarmAt(dayTarget, nextNotifyTime, now = Date.now()) {
  const next = parseDate(nextNotifyTime)
  if (!next) return null
  const target = parseDate(dayTarget)
  const at = target && isZeroClock(target)
    ? new Date(next.getFullYear(), next.getMonth(), next.getDate(), 10, 0, 0, 0)
    : next
  if (at.getTime() <= now + SKEW_MS) return null
  return at.getTime()
}

/**
 * 从现在到今晚 24:00 还会响的条数。明天及以后、已经过点的都不计。
 * @param {Array<{dayTarget?: string, nextNotifyTime?: string}>} items
 * @param {number} [now]
 */
export function countUntilMidnight(items, now = Date.now()) {
  const end = new Date(now)
  end.setHours(24, 0, 0, 0)
  const endMs = end.getTime()
  let count = 0
  ;(items || []).forEach((item) => {
    const at = phoneAlarmAt(item.dayTarget, item.nextNotifyTime, now)
    if (at != null && at < endMs) count += 1
  })
  return count
}
