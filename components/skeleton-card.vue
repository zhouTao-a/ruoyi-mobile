<template>
  <view class="skel-card">
    <view class="skel-bar"></view>
    <view class="skel-body">
      <view class="skel-line w70"></view>
      <view class="skel-line w40"></view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  count: { type: Number, default: 4 }
})
</script>

<style scoped>
.skel-card {
  display: flex;
  background: #fff;
  border-radius: 24rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(31, 35, 41, 0.05);
}
.skel-bar {
  width: 8rpx;
  flex-shrink: 0;
  background: #eef0f4;
}
.skel-body {
  flex: 1;
  padding: 24rpx;
  box-sizing: border-box;
}
.skel-line {
  height: 28rpx;
  border-radius: 8rpx;
  background: #eef0f4;
  margin-bottom: 16rpx;
  animation: skel-pulse 1.4s ease-in-out infinite;
}
.skel-line:last-child {
  margin-bottom: 0;
}
.w70 {
  width: 70%;
}
.w40 {
  width: 40%;
}
@keyframes skel-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}
</style>
