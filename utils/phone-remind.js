import { clearPhoneRemind, setTodayCount, syncAlarms } from '@/uni_modules/hanhan-remind'
import { listMsgDayMatter, phoneAlarms } from '@/api/msg/matter.js'
import { getToken } from '@/utils/auth.js'
import { countUntilMidnight, phoneAlarmAt } from '@/utils/alarm-time.js'

const PERM_KEY = 'hanhan_remind_perm_asked'
let generation = 0
let timer = null

/**
 * 登录后、回到前台、事件变更后调用。
 * 拉取失败时保留手机上已有闹钟，避免一次断网把提醒清掉。
 */
export function syncPhoneRemind() {
  if (typeof plus === 'undefined' || !plus.android) return
  if (!getToken()) return
  const current = ++generation
  clearTimeout(timer)
  timer = setTimeout(() => runSync(current), 400)
}

/** 退出登录：取消闹钟和桌面数字。 */
export function resetPhoneRemind() {
  generation += 1
  clearTimeout(timer)
  if (typeof plus === 'undefined' || !plus.android) return
  try {
    clearPhoneRemind()
    plus.runtime.setBadgeNumber(0)
  } catch (e) {}
}

async function runSync(current) {
  if (current !== generation || !getToken()) return
  askPermissionsOnce()
  ensureExactAlarm()
  try {
    const items = await loadPendingMatters()
    if (current !== generation) return
    const now = Date.now()
    const alarms = []
    items.forEach((item) => {
      const at = phoneAlarmAt(item.dayTarget, item.nextNotifyTime, now)
      if (!at || item.id == null) return
      alarms.push({
        id: String(item.id),
        title: item.dayName || '事件提醒',
        at
      })
    })
    // 只统计今晚 24:00 前还会响的；已经过点时必须写成 0，清掉上次留下的「今日 N 件」
    const count = countUntilMidnight(items, now)
    setTodayCount(count)
    try {
      plus.runtime.setBadgeNumber(count)
    } catch (e) {}
    syncAlarms(JSON.stringify(alarms))
  } catch (e) {}
}

const SKIP_STATUS = { disabled: true, notified: true, expired: true }

/**
 * 优先用手机闹钟接口；后端还没这个接口时，改用原来的事件列表，避免角标一直停在旧数字。
 */
async function loadPendingMatters() {
  try {
    const res = await phoneAlarms()
    const list = res.data || res.rows
    if (Array.isArray(list)) return list.filter((item) => !SKIP_STATUS[item.notifyStatus])
  } catch (e) {}
  const res = await listMsgDayMatter({ pageNum: 1, pageSize: 500 })
  const list = res.rows || res.data || []
  return list.filter((item) => !SKIP_STATUS[item.notifyStatus] && item.nextNotifyTime)
}

/** 第一次同步时说明通知和电池优化，用户拒绝也不阻断已能登记的闹钟。 */
function askPermissionsOnce() {
  if (uni.getStorageSync(PERM_KEY)) return
  uni.setStorageSync(PERM_KEY, '1')
  const main = plus.android.runtimeMainActivity()
  const sdk = sdkInt()
  if (sdk >= 33) {
    plus.android.requestPermissions(
      ['android.permission.POST_NOTIFICATIONS'],
      () => {},
      () => {}
    )
  }
  uni.showModal({
    title: '允许准时提醒',
    content: '请允许通知。下一步若出现电池优化，请选允许，否则锁屏后闹钟可能不准时。',
    confirmText: '去设置',
    success(res) {
      if (!res.confirm) return
      openBatterySetting(main)
    }
  })
}

function openBatterySetting(main) {
  try {
    const PowerManager = plus.android.importClass('android.os.PowerManager')
    const Context = plus.android.importClass('android.content.Context')
    const pm = main.getSystemService(Context.POWER_SERVICE)
    plus.android.importClass(pm)
    const pkg = main.getPackageName()
    if (pm.isIgnoringBatteryOptimizations(pkg)) return
    const Intent = plus.android.importClass('android.content.Intent')
    const Settings = plus.android.importClass('android.provider.Settings')
    const Uri = plus.android.importClass('android.net.Uri')
    const intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
    intent.setData(Uri.parse('package:' + pkg))
    main.startActivity(intent)
  } catch (e) {}
}

/** 精确闹钟被系统关掉时，到点不会响。只提示一次。 */
function ensureExactAlarm() {
  if (sdkInt() < 31) return
  try {
    const main = plus.android.runtimeMainActivity()
    const Context = plus.android.importClass('android.content.Context')
    const am = main.getSystemService(Context.ALARM_SERVICE)
    plus.android.importClass(am)
    if (am.canScheduleExactAlarms()) return
    if (uni.getStorageSync('hanhan_exact_alarm_asked')) return
    uni.setStorageSync('hanhan_exact_alarm_asked', '1')
    uni.showModal({
      title: '允许准时提醒',
      content: '请允许「闹钟和提醒」，否则到点不会响。',
      confirmText: '去设置',
      success(res) {
        if (!res.confirm) return
        try {
          const Intent = plus.android.importClass('android.content.Intent')
          const Uri = plus.android.importClass('android.net.Uri')
          const intent = new Intent('android.settings.REQUEST_SCHEDULE_EXACT_ALARM')
          intent.setData(Uri.parse('package:' + main.getPackageName()))
          main.startActivity(intent)
        } catch (e) {}
      }
    })
  } catch (e) {}
}

function sdkInt() {
  try {
    const Build = plus.android.importClass('android.os.Build')
    return Build.VERSION.SDK_INT || 0
  } catch (e) {
    return 0
  }
}
