<template>
  <view class="page tab-page">
    <view class="card profile">
      <view class="profile-avatar">{{ avatarText }}</view>
      <view class="profile-info">
        <text class="name">{{ displayName }}</text>
        <text class="muted">涵涵通知 · 移动端</text>
      </view>
    </view>

    <view class="card">
      <view class="type-row">
        <text
          v-for="item in types"
          :key="item.value"
          class="type-chip"
          :class="{ on: periodType === item.value }"
          @click="changeType(item.value)"
        >{{ item.label }}</text>
      </view>
      <view class="period-row">
        <text class="month-btn" @click="shift(-1)">上一{{ typeUnit }}</text>
        <text class="period-label">{{ periodLabel }}</text>
        <text class="month-btn" @click="shift(1)">下一{{ typeUnit }}</text>
      </view>
      <view class="sum-grid">
        <view v-for="row in rows" :key="row.key" class="sum-cell">
          <text class="sum-num">{{ summary[row.key] ?? 0 }}</text>
          <text class="sum-name">{{ row.name }}</text>
        </view>
      </view>
    </view>

    <button class="btn-primary logout" @click="handleLogout">退出登录</button>
    <custom-tab-bar current="pages/mine/index" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { logout } from '@/api/login.js'
import { getRecSummary } from '@/api/rec/summary.js'
import { clearAuth, getToken, getUser } from '@/utils/auth.js'
import { resetPhoneRemind } from '@/utils/phone-remind.js'
import CustomTabBar from '@/components/custom-tab-bar.vue'

const types = [
  { value: 'month', label: '月' },
  { value: 'quarter', label: '季' },
  { value: 'year', label: '年' }
]
const rows = [
  { key: 'taskCount', name: '新增任务' },
  { key: 'reportCount', name: '新增报告' },
  { key: 'reflectionCount', name: '新增感想' },
  { key: 'goalCount', name: '新增目标' },
  { key: 'introspectCount', name: '新增自省' },
  { key: 'introspectItemCount', name: '自省记录' }
]

const user = computed(() => getUser() || {})
const displayName = computed(() => user.value.nickName || user.value.userName || '已登录用户')
const avatarText = computed(() => {
  const name = displayName.value
  return name ? String(name).charAt(0).toUpperCase() : 'U'
})

const now = new Date()
const periodType = ref('month')
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const summary = ref({})

const typeUnit = computed(() => types.find((item) => item.value === periodType.value).label)
const quarter = computed(() => Math.floor((month.value - 1) / 3) + 1)

const period = computed(() => {
  if (periodType.value === 'year') return String(year.value)
  if (periodType.value === 'quarter') return `${year.value}-Q${quarter.value}`
  return `${year.value}-${String(month.value).padStart(2, '0')}`
})

const periodLabel = computed(() => {
  if (periodType.value === 'year') return `${year.value}年`
  if (periodType.value === 'quarter') return `${year.value}年第${quarter.value}季度`
  return `${year.value}年${month.value}月`
})

const changeType = (value) => {
  periodType.value = value
  loadSummary()
}

const shift = (delta) => {
  if (periodType.value === 'year') {
    year.value += delta
  } else if (periodType.value === 'quarter') {
    let q = quarter.value + delta
    let y = year.value
    while (q < 1) {
      q += 4
      y -= 1
    }
    while (q > 4) {
      q -= 4
      y += 1
    }
    year.value = y
    month.value = (q - 1) * 3 + 1
  } else {
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
  }
  loadSummary()
}

const loadSummary = async () => {
  if (!getToken()) return
  try {
    const res = await getRecSummary({ periodType: periodType.value, period: period.value })
    summary.value = res.data || {}
  } catch (e) {
    summary.value = {}
  }
}

onShow(() => {
  uni.hideTabBar({ animation: false })
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/login/index' })
    return
  }
  loadSummary()
})

const handleLogout = async () => {
  try {
    await logout()
  } catch (e) {
    // 即使接口失败也清本地登录态
  }
  clearAuth()
  resetPhoneRemind()
  uni.reLaunch({ url: '/pages/login/index' })
}
</script>

<style scoped>
.tab-page {
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
}
/* 个人卡：渐变背景 + 圆形头像 + 信息行 */
.profile {
  display: flex;
  align-items: center;
  padding: 36rpx 28rpx;
  background: linear-gradient(135deg, #eef3ff 0%, #ffffff 70%);
}
.profile-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #4d8bff 0%, #2f6fed 100%);
  color: #fff;
  font-size: 40rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  flex-shrink: 0;
  box-shadow: 0 8rpx 20rpx rgba(47, 111, 237, 0.28);
}
.profile-info {
  flex: 1;
  min-width: 0;
}
.name {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
  letter-spacing: 1rpx;
}
.type-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}
.type-chip {
  padding: 8rpx 28rpx;
  border-radius: 999rpx;
  background: #f3f4f6;
  color: #4e5969;
  font-size: 26rpx;
  transition: transform 0.12s ease;
}
.type-chip:active {
  transform: scale(0.94);
}
.type-chip.on {
  background: #e8f0ff;
  color: #2f6fed;
  font-weight: 600;
  box-shadow: 0 2rpx 8rpx rgba(47, 111, 237, 0.18);
}
.period-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}
.period-label {
  font-size: 30rpx;
  font-weight: 600;
  letter-spacing: 0.5rpx;
}
.month-btn {
  font-size: 24rpx;
  color: #2f6fed;
  background: #e8f0ff;
  border-radius: 24rpx;
  padding: 10rpx 18rpx;
}
.sum-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 8rpx;
}
.sum-cell {
  width: calc(50% - 8rpx);
  box-sizing: border-box;
  background: #f7f8fb;
  border-radius: 20rpx;
  padding: 24rpx 22rpx;
}
.sum-num {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #2f6fed;
  line-height: 1.2;
  letter-spacing: 0.5rpx;
}
.sum-name {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #8a8a8a;
}
.logout {
  margin-top: 12rpx;
  background: #fff;
  color: #e34d59;
  box-shadow: 0 4rpx 16rpx rgba(31, 35, 41, 0.05);
}
</style>
