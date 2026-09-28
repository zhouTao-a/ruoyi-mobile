<template>
  <view class="custom-tab-bar" :style="{ paddingBottom: 'calc(8rpx + env(safe-area-inset-bottom))' }">
    <view
      v-for="item in tabs"
      :key="item.path"
      class="tab-item"
      :class="{ active: current === item.path }"
      @click="switchTo(item.path)"
    >
      <view class="tab-indicator"></view>
      <text class="tab-icon">{{ current === item.path ? item.activeIcon : item.icon }}</text>
      <text class="tab-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  current: { type: String, default: '' }
})

const tabs = [
  { path: 'pages/index/index', text: '首页', icon: '🏠', activeIcon: '🏠' },
  { path: 'pages/rec/index', text: '记录', icon: '📝', activeIcon: '📝' },
  { path: 'pages/msg/index', text: '通知', icon: '🔔', activeIcon: '🔔' },
  { path: 'pages/mine/index', text: '我的', icon: '👤', activeIcon: '👤' }
]

const switchTo = (path) => {
  if (!path) return
  uni.switchTab({ url: '/' + path })
}
</script>

<style scoped>
/* 自定义 tabBar：底部固定 + 毛玻璃 + 顶部细线 */
.custom-tab-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  display: flex;
  align-items: stretch;
  height: 112rpx;
  padding-top: 8rpx;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24rpx);
  -webkit-backdrop-filter: blur(24rpx);
  border-top: 1px solid rgba(31, 35, 41, 0.06);
  box-shadow: 0 -4rpx 24rpx rgba(31, 35, 41, 0.06);
  box-sizing: border-box;
}
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 8rpx 0;
  transition: transform 0.12s ease;
}
.tab-item:active {
  transform: scale(0.92);
}
/* 选中态顶部小圆点指示器 */
.tab-indicator {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 32rpx;
  height: 6rpx;
  border-radius: 999rpx;
  background: transparent;
  transition: background 0.18s ease;
}
.tab-item.active .tab-indicator {
  background: linear-gradient(90deg, #4d8bff 0%, #2f6fed 100%);
}
.tab-icon {
  font-size: 40rpx;
  line-height: 1;
  margin-bottom: 6rpx;
  filter: grayscale(0.7);
  opacity: 0.7;
  transition: filter 0.18s ease, opacity 0.18s ease, transform 0.18s ease;
}
.tab-item.active .tab-icon {
  filter: grayscale(0);
  opacity: 1;
  transform: scale(1.08);
}
.tab-text {
  font-size: 20rpx;
  line-height: 1.2;
  color: #9aa0a6;
  letter-spacing: 0.5rpx;
  transition: color 0.18s ease, font-weight 0.18s ease;
}
.tab-item.active .tab-text {
  color: #2f6fed;
  font-weight: 700;
}
</style>
