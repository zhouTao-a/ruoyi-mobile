import { ref } from 'vue'
import { getDicts } from '@/api/system/dict.js'
import { findOption } from '@/utils/labels.js'

const TONE = {
  primary: { color: '#2f6fed', bg: '#e8f0ff' },
  success: { color: '#389e0d', bg: '#f6ffed' },
  warning: { color: '#d46b08', bg: '#fff7e6' },
  danger: { color: '#e34d59', bg: '#fff1f0' },
  info: { color: '#8a8a8a', bg: '#f5f5f5' },
  default: { color: '#4e5969', bg: '#f3f4f6' }
}

const cache = new Map()

function mapRow(row, fallback) {
  const value = row.dictValue
  const local = findOption(fallback, value)
  const tone = TONE[row.listClass] || (local.color ? { color: local.color, bg: local.bg } : TONE.default)
  return {
    value,
    label: row.dictLabel,
    color: tone.color,
    bg: tone.bg
  }
}

/**
 * 优先用后端字典；失败或为空时用本地兜底，保证中文还能显示。
 */
export function useDict(dictType, fallback = []) {
  const options = ref(fallback.slice())
  if (!cache.has(dictType)) {
    cache.set(
      dictType,
      getDicts(dictType)
        .then((res) => {
          const rows = res.data || []
          return rows.length ? rows.map((row) => mapRow(row, fallback)) : fallback.slice()
        })
        .catch(() => fallback.slice())
    )
  }
  cache.get(dictType).then((list) => {
    options.value = list
  })
  return options
}
