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
  { name: '任务', desc: '待办与进度', path: '/pages/rec/task', mark: '📋', bg: '#e8f0ff' },
  { name: '报告', desc: '日报周报', path: '/pages/rec/report', mark: '📝', bg: '#e6fffb' },
  { name: '感想', desc: '阅读与感悟', path: '/pages/rec/reflection', mark: '💭', bg: '#fff7e6' },
  { name: '目标', desc: '目标管理', path: '/pages/rec/goal', mark: '🎯', bg: '#f6ffed' },
  { name: '自省', desc: '自省主题', path: '/pages/rec/introspect', mark: '✨', bg: '#f9f0ff' }
]

const go = (url) => uni.navigateTo({ url })
</script>
