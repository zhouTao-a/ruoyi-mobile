<template>
  <view class="page tab-page">
    <view v-for="item in menus" :key="item.path" class="entry" @click="go(item.path)">
      <view class="entry-mark" :style="{ background: item.bg }">{{ item.mark }}</view>
      <view class="entry-main">
        <text class="entry-name">{{ item.name }}</text>
        <text class="entry-desc">{{ item.desc }}</text>
      </view>
      <text class="entry-arrow">›</text>
    </view>
    <custom-tab-bar current="pages/rec/index" />
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app'
import CustomTabBar from '@/components/custom-tab-bar.vue'
import { writeCache } from '@/utils/list-cache.js'
import { listRecTask } from '@/api/rec/task.js'
import { listRecGoal } from '@/api/rec/goal.js'
import { listRecReport } from '@/api/rec/report.js'
import { listRecReflection } from '@/api/rec/reflection.js'
import { listRecIntrospect } from '@/api/rec/introspect.js'

const menus = [
  { name: '任务', desc: '待办与进度', path: '/pages/rec/task', mark: '📋', bg: '#e8f0ff' },
  { name: '报告', desc: '日报周报', path: '/pages/rec/report', mark: '📝', bg: '#e6fffb' },
  { name: '感想', desc: '阅读与感悟', path: '/pages/rec/reflection', mark: '💭', bg: '#fff7e6' },
  { name: '目标', desc: '目标管理', path: '/pages/rec/goal', mark: '🎯', bg: '#f6ffed' },
  { name: '自省', desc: '自省主题', path: '/pages/rec/introspect', mark: '✨', bg: '#f9f0ff' }
]

const go = (url) => uni.navigateTo({ url })

/** 预加载各子页面前 10 条，写入缓存；用户点进去时秒开 */
const preloadAll = () => {
  const tasks = [
    { fn: listRecTask, key: 'rec_task' },
    { fn: listRecGoal, key: 'rec_goal' },
    { fn: listRecReport, key: 'rec_report' },
    { fn: listRecReflection, key: 'rec_reflection' },
    { fn: listRecIntrospect, key: 'rec_introspect' }
  ]
  tasks.forEach(({ fn, key }) => {
    fn({ pageNum: 1, pageSize: 10 })
      .then((res) => {
        writeCache(key, res.rows || res.data || [])
      })
      .catch(() => {})
  })
}

onShow(() => {
  uni.hideTabBar({ animation: false })
  preloadAll()
})
</script>

<style scoped>
.tab-page {
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
}
</style>
