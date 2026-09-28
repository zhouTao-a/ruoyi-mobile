<template>
  <view v-if="total > 0" class="list-more">
    <view class="list-more-line"></view>
    <text class="list-more-text">{{ text }}</text>
    <view class="list-more-line"></view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  finished: { type: Boolean, default: false }
})

const text = computed(() => {
  if (props.loading) return '加载中'
  if (props.finished) return '已经到底啦'
  return '上拉加载更多'
})
</script>

<style>
.list-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  color: #9aa0a6;
  font-size: 22rpx;
  padding: 16rpx 0 28rpx;
}
.list-more-line {
  width: 48rpx;
  height: 1px;
  background: #d8dce3;
}
.list-more-text {
  letter-spacing: 0.5rpx;
}
</style>
