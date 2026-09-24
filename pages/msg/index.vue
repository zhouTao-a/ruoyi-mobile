<template>
  <view class="page">
    <view v-for="item in menus" :key="item.path" class="entry" @click="go(item.path)">
      <view class="entry-mark" :style="{ background: item.bg }">{{ item.mark }}</view>
      <view class="entry-main">
        <text class="entry-name">{{ item.name }}</text>
        <text class="entry-desc">{{ item.desc }}</text>
      </view>
      <text class="entry-arrow">›</text>
    </view>
  </view>
</template>

<script setup>
const menus = [
  { name: '用户', desc: '通知对象维护', path: '/pages/msg/user', mark: '👤', bg: '#e8f0ff' },
  { name: '事件', desc: '提醒事件维护', path: '/pages/msg/matter', mark: '🔔', bg: '#ffe8e8' }
]

const go = (url) => uni.navigateTo({ url })
</script>
