<template>
  <view class="page home-page">
    <view class="toolbar card">
      <text class="month-btn" @click="shiftMonth(-1)">上月</text>
      <text class="title" @click="openPicker">{{ year }}年{{ month }}月</text>
      <text class="today-btn" @click="goToday">今天</text>
      <text class="month-btn" @click="shiftMonth(1)">下月</text>
    </view>

    <view class="calendar card">
      <view class="week-row">
        <text v-for="w in weeks" :key="w" class="week">{{ w }}</text>
      </view>
      <view class="day-grid">
        <view
          v-for="(d, idx) in days"
          :key="idx"
          class="day-cell"
          :class="{ muted: !d.current, today: d.isToday, active: d.full === selected }"
          @click="onSelect(d)"
        >
          <view class="solar-wrap" :class="{ 'today-mark': d.isToday }">
            <text class="solar" :class="{ 'today-text': d.isToday }">{{ d.day || '' }}</text>
          </view>
          <text v-if="d.lunar" class="lunar">{{ d.lunar }}</text>
          <view v-if="d.icons.length" class="icon-row">
            <text
              v-for="(ic, i) in d.icons"
              :key="i"
              class="evt-icon"
              :style="{ color: ic.color }"
            >{{ ic.emoji }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 本月提醒：仅展示，点击不弹框 -->
    <view class="card">
      <view class="section-title">本月提醒</view>
      <view v-if="!monthReminders.length" class="empty">暂无提醒</view>
      <view v-for="(item, i) in monthReminders" :key="i" class="reminder-item">
        <text class="evt-icon list-icon" :style="{ color: typeMeta(item).color }">{{ typeMeta(item).emoji }}</text>
        <text class="tag" :style="{ color: typeMeta(item).color, background: typeMeta(item).bg }">
          {{ typeMeta(item).label }}
        </text>
        <text class="content">{{ item.content }}</text>
      </view>
    </view>

    <!-- 点击有事件的日期：居中弹框 -->
    <view v-if="detailVisible" class="mask mask-center" @click="detailVisible = false">
      <view class="detail-sheet card" @click.stop>
        <view class="detail-title">{{ detailTitle }}</view>
        <view v-for="(item, i) in detailList" :key="i" class="reminder-item">
          <text class="evt-icon list-icon" :style="{ color: typeMeta(item).color }">{{ typeMeta(item).emoji }}</text>
          <text class="tag" :style="{ color: typeMeta(item).color, background: typeMeta(item).bg }">
            {{ typeMeta(item).label }}
          </text>
          <text class="content">{{ item.content }}</text>
        </view>
        <button class="btn-primary detail-close" @click="detailVisible = false">关闭</button>
      </view>
    </view>

    <!-- 年月选择：底部完整弹出 -->
    <view v-if="pickerVisible" class="mask mask-bottom" @click="pickerVisible = false">
      <view class="picker-sheet card" @click.stop>
        <view class="picker-hd">
          <text @click="pickerVisible = false">取消</text>
          <text class="picker-ok" @click="confirmPicker">确定</text>
        </view>
        <picker-view class="picker-view" :value="pickerValue" @change="onPickerChange">
          <picker-view-column>
            <view v-for="y in yearOptions" :key="y" class="picker-item">{{ y }}年</view>
          </picker-view-column>
          <picker-view-column>
            <view v-for="m in 12" :key="m" class="picker-item">{{ m }}月</view>
          </picker-view-column>
        </picker-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { Lunar } from 'lunar-javascript'
import { dayMatterList } from '@/api/msg/matter.js'
import { getToken } from '@/utils/auth.js'

const weeks = ['日', '一', '二', '三', '四', '五', '六']
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const selected = ref('')
const reminders = ref([])

const detailVisible = ref(false)
const detailTitle = ref('')
const detailList = ref([])

const pickerVisible = ref(false)
const pickerValue = ref([0, 0])
const yearOptions = computed(() => {
  const cur = now.getFullYear()
  const list = []
  for (let y = cur - 10; y <= cur + 10; y++) list.push(y)
  return list
})

/** 事件类型 → 中文 + 图标色 */
const TYPE_MAP = {
  birthday: { label: '生日', emoji: '🎂', color: '#FF6B6B', bg: '#FFE8E8' },
  anniversary: { label: '纪念日', emoji: '💝', color: '#4ECDC4', bg: '#E6F9F7' },
  work: { label: '工作', emoji: '💼', color: '#2F6FED', bg: '#E8F0FF' },
  life: { label: '生活', emoji: '🏠', color: '#6A0572', bg: '#F3E8F7' }
}
const DEFAULT_TYPE = { label: '事件', emoji: '🔔', color: '#6A0572', bg: '#F3E8F7' }

const typeMeta = (item) => {
  const key = item && item.type
  const base = TYPE_MAP[key] || DEFAULT_TYPE
  if (item && item.isLunar) {
    return { ...base, color: '#B46AFF', bg: '#F3EBFF' }
  }
  return base
}

const pad = (n) => String(n).padStart(2, '0')
const formatDate = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`

/** 统一成 yyyy-MM-dd，兼容接口可能返回的带时间串 */
const toDateKey = (val) => {
  if (!val) return ''
  const s = String(val).trim().replace(/\//g, '-')
  return s.length >= 10 ? s.slice(0, 10) : s
}

const getReminders = (dateStr) => {
  if (!dateStr) return []
  const key = toDateKey(dateStr)
  const date = new Date(key.replace(/-/g, '/'))
  if (isNaN(date.getTime())) return []
  const lunar = Lunar.fromDate(date)
  return reminders.value.filter((r) => {
    if (r.isLunar) {
      return Number(r.lunarMonth) === lunar.getMonth() && Number(r.lunarDay) === lunar.getDay()
    }
    return toDateKey(r.date) === key
  })
}

const days = computed(() => {
  const first = new Date(year.value, month.value - 1, 1)
  const startWeek = first.getDay()
  const daysInMonth = new Date(year.value, month.value, 0).getDate()
  const prevDays = new Date(year.value, month.value - 1, 0).getDate()
  const list = []
  const todayStr = formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate())

  for (let i = 0; i < startWeek; i++) {
    const day = prevDays - startWeek + i + 1
    list.push({ day, current: false, full: '', lunar: '', icons: [], isToday: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const full = formatDate(year.value, month.value, d)
    const lunar = Lunar.fromDate(new Date(year.value, month.value - 1, d))
    const lunarText = lunar.getDay() === 1 ? lunar.getMonthInChinese() + '月' : lunar.getDayInChinese()
    const dayItems = getReminders(full)
    const icons = dayItems.slice(0, 1).map((it) => typeMeta(it))
    list.push({
      day: d,
      current: true,
      full,
      lunar: lunarText,
      icons,
      isToday: full === todayStr
    })
  }
  while (list.length % 7 !== 0) {
    list.push({ day: '', current: false, full: '', lunar: '', icons: [], isToday: false })
  }
  return list
})

/** 下方列表固定展示本月全部提醒 */
const monthReminders = computed(() => {
  const result = []
  reminders.value.forEach((item) => {
    if (item.isLunar) {
      try {
        const lunar = Lunar.fromYmd(year.value, item.lunarMonth, item.lunarDay)
        const solar = lunar.getSolar()
        if (solar.getMonth() === month.value) result.push(item)
      } catch (e) {}
    } else if (toDateKey(item.date).startsWith(`${year.value}-${pad(month.value)}`)) {
      result.push(item)
    }
  })
  return result
})

const loadReminders = async () => {
  try {
    const res = await dayMatterList({ year: year.value, month: month.value })
    reminders.value = res.data || []
  } catch (e) {
    reminders.value = []
  }
}

const shiftMonth = (delta) => {
  let m = month.value + delta
  let y = year.value
  if (m < 1) {
    m = 12
    y -= 1
  } else if (m > 12) {
    m = 1
    y += 1
  }
  year.value = y
  month.value = m
  selected.value = ''
  detailVisible.value = false
}

/** 回到当前月并高亮今天（不自动弹框） */
const goToday = () => {
  const t = new Date()
  year.value = t.getFullYear()
  month.value = t.getMonth() + 1
  selected.value = formatDate(t.getFullYear(), t.getMonth() + 1, t.getDate())
  detailVisible.value = false
}

const openPicker = () => {
  const yi = yearOptions.value.indexOf(year.value)
  pickerValue.value = [yi >= 0 ? yi : 10, month.value - 1]
  pickerVisible.value = true
}

const onPickerChange = (e) => {
  pickerValue.value = e.detail.value
}

const confirmPicker = () => {
  const [yi, mi] = pickerValue.value
  year.value = yearOptions.value[yi]
  month.value = mi + 1
  selected.value = ''
  detailVisible.value = false
  pickerVisible.value = false
}

/**
 * 点击日期：仅有事件时弹框；无事件不提示、不弹框
 */
const onSelect = (d) => {
  if (!d.current || !d.full) return
  selected.value = d.full
  const list = getReminders(d.full)
  if (!list.length) {
    detailVisible.value = false
    return
  }
  const [, m, day] = d.full.split('-')
  detailTitle.value = `${Number(m)}月${Number(day)}日`
  detailList.value = list
  detailVisible.value = true
}

watch([year, month], () => {
  loadReminders()
})

onShow(() => {
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/login/index' })
    return
  }
  loadReminders()
})
</script>

<style scoped>
.home-page {
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}
.home-page::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}
.month-btn {
  flex-shrink: 0;
  font-size: 24rpx;
  color: #2f6fed;
  background: #e8f0ff;
  border-radius: 24rpx;
  padding: 10rpx 18rpx;
  line-height: 1.2;
}
.title {
  flex: 1;
  text-align: center;
  font-size: 30rpx;
  font-weight: 600;
  padding: 8rpx 4rpx;
}
.today-btn {
  flex-shrink: 0;
  font-size: 24rpx;
  color: #ff7a45;
  background: #fff3eb;
  border: 1px solid #ffd0b5;
  border-radius: 24rpx;
  padding: 8rpx 18rpx;
  line-height: 1.2;
}
.week-row,
.day-grid {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  overflow: hidden;
}
.calendar {
  overflow: hidden;
}
.week,
.day-cell {
  width: 14.28%;
  text-align: center;
  box-sizing: border-box;
}
.week {
  color: #8a8a8a;
  padding: 12rpx 0;
  font-size: 24rpx;
}
.day-cell {
  position: relative;
  padding: 10rpx 0 14rpx;
  min-height: 110rpx;
}
.day-cell.muted {
  opacity: 0.35;
}
.day-cell.active:not(.today) {
  background: #e8f0ff;
  border-radius: 12rpx;
}
.solar-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
  margin: 0 auto;
}
.solar-wrap.today-mark {
  background: #ff7a45;
  border-radius: 50%;
}
.solar {
  font-size: 28rpx;
  line-height: 1;
}
.today-text {
  color: #fff;
  font-weight: 700;
}
.lunar {
  display: block;
  font-size: 18rpx;
  color: #999;
  margin-top: 4rpx;
}
.icon-row {
  display: flex;
  justify-content: center;
  gap: 4rpx;
  margin-top: 4rpx;
  min-height: 28rpx;
}
.evt-icon {
  font-size: 22rpx;
  line-height: 1;
}
.list-icon {
  font-size: 28rpx;
  margin-right: 8rpx;
  flex-shrink: 0;
}
.section-title {
  font-weight: 600;
  margin-bottom: 16rpx;
}
.reminder-item {
  display: flex;
  align-items: flex-start;
  padding: 16rpx 0;
  border-bottom: 1px solid #f0f0f0;
}
.tag {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-right: 16rpx;
  flex-shrink: 0;
}
.content {
  flex: 1;
  line-height: 1.5;
}
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 99;
  box-sizing: border-box;
}
.mask-center {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
}
.mask-bottom {
  display: flex;
  align-items: flex-end;
  justify-content: stretch;
  padding: 0;
}
/* 事件详情：居中卡片 */
.detail-sheet {
  width: 100%;
  max-width: 640rpx;
  border-radius: 20rpx;
  padding: 28rpx 24rpx 24rpx;
  max-height: 70vh;
  overflow-y: auto;
  box-sizing: border-box;
}
.detail-sheet::-webkit-scrollbar {
  width: 0;
  display: none;
}
/* 年月选择：贴底完整展示，避免被裁切 */
.picker-sheet {
  width: 100%;
  border-radius: 24rpx 24rpx 0 0;
  padding: 16rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  background: #fff;
}
.detail-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
}
.detail-close {
  margin-top: 24rpx;
  height: 80rpx;
  line-height: 80rpx;
}
.picker-hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 8rpx 20rpx;
  color: #666;
  font-size: 28rpx;
}
.picker-ok {
  color: #2f6fed;
  font-weight: 600;
}
.picker-view {
  height: 440rpx;
  width: 100%;
}
.picker-item {
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  font-size: 30rpx;
}
</style>
