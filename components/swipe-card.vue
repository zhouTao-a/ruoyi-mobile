<template>
  <view class="swipe-wrap">
    <view class="swipe-del" @click.stop="emit('delete')">
      <text class="del-icon">🗑</text>
      <text class="del-text">删除</text>
    </view>
    <view class="swipe-main" :class="{ 'swipe-main-open': open }" @touchstart="onStart" @touchend="onEnd" @click="onClick">
      <slot />
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  open: { type: Boolean, default: false }
})
const emit = defineEmits(['update:open', 'delete', 'click'])

let startX = 0
let startY = 0
let swiped = false

const point = (e) => (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0])

const onStart = (e) => {
  const t = point(e)
  if (!t) return
  startX = t.clientX
  startY = t.clientY
  swiped = false
}

const stop = (e) => {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
}

const onEnd = (e) => {
  const t = e.changedTouches && e.changedTouches[0]
  if (!t) return
  const dx = t.clientX - startX
  const dy = t.clientY - startY
  if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return
  swiped = true
  if (dx < 0) {
    emit('update:open', true)
    stop(e)
    return
  }
  if (props.open) {
    emit('update:open', false)
    stop(e)
  }
}

const onClick = (e) => {
  if (swiped) {
    swiped = false
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
    return
  }
  if (props.open) {
    emit('update:open', false)
    return
  }
  emit('click')
}
</script>

<style>
.swipe-wrap {
  position: relative;
  margin-bottom: 20rpx;
  overflow: hidden;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(31, 35, 41, 0.05);
}
.swipe-wrap .record-card {
  margin-bottom: 0;
}
/* 删除区：红色渐变 + 斜纹纹理 + 图标文字 */
.swipe-del {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 140rpx;
  background: linear-gradient(135deg, #ff6b6b 0%, #e34d59 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  letter-spacing: 1rpx;
  background-image:
    linear-gradient(135deg, #ff6b6b 0%, #e34d59 100%),
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.08) 0, rgba(255, 255, 255, 0.08) 8rpx, transparent 8rpx, transparent 16rpx);
  background-blend-mode: overlay;
}
.del-icon {
  font-size: 36rpx;
  line-height: 1;
  margin-bottom: 6rpx;
}
.del-text {
  font-size: 22rpx;
  line-height: 1.2;
}
.swipe-main {
  position: relative;
  z-index: 1;
  background: #f5f6f8;
  transform: translateX(0);
  transition: transform 0.18s ease;
}
.swipe-main-open {
  transform: translateX(-140rpx);
}
</style>
