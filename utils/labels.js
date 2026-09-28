/**
 * 记录 / 通知里的枚举中文。未知值原样展示，避免把库里的码弄丢。
 */

const EMPTY = { value: '', label: '-', color: '#8a8a8a', bg: '#f3f4f6' }

export const TASK_STATUS = [
  { value: 'pending', label: '待处理', color: '#d46b08', bg: '#fff7e6' },
  { value: 'in_progress', label: '进行中', color: '#2f6fed', bg: '#e8f0ff', alias: ['in-progress'] },
  { value: 'completed', label: '已完成', color: '#389e0d', bg: '#f6ffed', alias: ['done'] },
  { value: 'paused', label: '暂停中', color: '#8a8a8a', bg: '#f5f5f5' },
  { value: 'cancel', label: '已取消', color: '#e34d59', bg: '#fff1f0' }
]

export const PRIORITY = [
  { value: 'high', label: '高', color: '#e34d59', bg: '#fff1f0' },
  { value: 'medium', label: '中', color: '#d46b08', bg: '#fff7e6' },
  { value: 'low', label: '低', color: '#2f6fed', bg: '#e8f0ff' }
]

export const REPORT_TYPE = [
  { value: 'daily', label: '日报', color: '#2f6fed', bg: '#e8f0ff', alias: ['日', 'day'] },
  { value: 'weekly', label: '周报', color: '#13a8a8', bg: '#e6fffb', alias: ['周', 'week'] },
  { value: 'monthly', label: '月报', color: '#722ed1', bg: '#f9f0ff', alias: ['月', 'month'] }
]

export const INTROSPECT_STATUS = [
  { value: 'active', label: '生效', color: '#389e0d', bg: '#f6ffed' },
  { value: 'inactive', label: '未生效', color: '#8a8a8a', bg: '#f5f5f5' }
]

export const DAY_TYPE = [
  { value: 'birthday', label: '生日', color: '#e34d59', bg: '#ffe8e8' },
  { value: 'anniversary', label: '纪念日', color: '#13a8a8', bg: '#e6fffb' },
  { value: 'work', label: '工作', color: '#2f6fed', bg: '#e8f0ff' },
  { value: 'life', label: '生活', color: '#722ed1', bg: '#f3e8f7' }
]

export const DAY_LUNAR = [
  { value: 'solar', label: '公历', color: '#2f6fed', bg: '#e8f0ff' },
  { value: 'lunar', label: '农历', color: '#b46aff', bg: '#f3ebff' }
]

export const REMIND_TYPE = [
  { value: 'minutely', label: '每分', color: '#8a8a8a', bg: '#f5f5f5' },
  { value: 'hourly', label: '每时', color: '#8a8a8a', bg: '#f5f5f5' },
  { value: 'daily', label: '每天', color: '#2f6fed', bg: '#e8f0ff' },
  { value: 'weekly', label: '每周', color: '#13a8a8', bg: '#e6fffb' },
  { value: 'monthly', label: '每月', color: '#722ed1', bg: '#f9f0ff' },
  { value: 'yearly', label: '每年', color: '#d46b08', bg: '#fff7e6' }
]

export const YES_NO = [
  { value: 'T', label: '是', color: '#389e0d', bg: '#f6ffed', alias: ['Y', 'true', '1'] },
  { value: 'F', label: '否', color: '#8a8a8a', bg: '#f5f5f5', alias: ['N', 'false', '0'] }
]

export const NOTIFY_STATUS = [
  { value: 'pending', label: '待通知', color: '#d46b08', bg: '#fff7e6' },
  { value: 'notified', label: '已通知', color: '#389e0d', bg: '#f6ffed' },
  { value: 'expired', label: '已过期', color: '#8a8a8a', bg: '#f5f5f5' },
  { value: 'disabled', label: '已停用', color: '#e34d59', bg: '#fff1f0' }
]

export const GENDER = [
  { value: '0', label: '男', color: '#2f6fed', bg: '#e8f0ff', alias: ['男', 'male'] },
  { value: '1', label: '女', color: '#eb2f96', bg: '#fff0f6', alias: ['女', 'female'] },
  { value: '2', label: '未知', color: '#8a8a8a', bg: '#f5f5f5', alias: ['未知'] }
]

export function findOption(list, value) {
  const options = Array.isArray(list) ? list : []
  if (value === undefined || value === null || String(value).trim() === '') return EMPTY
  const key = String(value).trim()
  const hit = options.find((item) => item.value === key || (item.alias || []).includes(key))
  if (hit) return hit
  return { value: key, label: key, color: '#4e5969', bg: '#f3f4f6' }
}

/** 编辑时把别名收成标准值，例如「日」→ daily */
export function canonical(list, value) {
  if (value === undefined || value === null || String(value).trim() === '') return ''
  return findOption(list, value).value
}

/** 当前值不在选项里时补一颗，避免编辑把原值冲掉 */
export function withCurrent(list, value) {
  const key = canonical(list, value)
  if (!key || list.some((item) => item.value === key)) return list
  return list.concat([{ value: key, label: key }])
}

export function shortText(val) {
  if (!val) return ''
  const text = String(val).replace(/\s+/g, ' ').trim()
  return text.length > 42 ? `${text.slice(0, 42)}…` : text
}
