<template>
  <view class="page">
    <view class="card profile">
      <text class="name">{{ displayName }}</text>
      <text class="muted">涵涵通知 · 移动端</text>
    </view>
    <button class="btn-primary logout" @click="handleLogout">退出登录</button>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { logout } from '@/api/login.js'
import { clearAuth, getToken, getUser } from '@/utils/auth.js'

const user = computed(() => getUser() || {})
const displayName = computed(() => user.value.nickName || user.value.userName || '已登录用户')

onShow(() => {
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/login/index' })
  }
})

const handleLogout = async () => {
  try {
    await logout()
  } catch (e) {
    // 即使接口失败也清本地登录态
  }
  clearAuth()
  uni.reLaunch({ url: '/pages/login/index' })
}
</script>

<style scoped>
.profile {
  padding: 40rpx 24rpx;
}
.name {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}
.logout {
  margin-top: 40rpx;
  height: 88rpx;
  line-height: 88rpx;
}
</style>
