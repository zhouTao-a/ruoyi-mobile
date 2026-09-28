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
    <custom-tab-bar current="pages/msg/index" />
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app'
import CustomTabBar from '@/components/custom-tab-bar.vue'
import { writeCache } from '@/utils/list-cache.js'
import { listMsgUser } from '@/api/msg/user.js'
import { listMsgDayMatter } from '@/api/msg/matter.js'

const menus = [
  { name: '用户', desc: '通知对象维护', path: '/pages/msg/user', mark: '👤', bg: '#e8f0ff' },
  { name: '事件', desc: '提醒事件维护', path: '/pages/msg/matter', mark: '🔔', bg: '#ffe8e8' }
]

const go = (url) => uni.navigateTo({ url })

/** 预加载各子页面前 10 条，写入缓存；用户点进去时秒开 */
const preloadAll = () => {
  const tasks = [
    { fn: listMsgUser, key: 'msg_user' },
    { fn: listMsgDayMatter, key: 'msg_matter' }
  ]
  tasks.forEach(({ fn, key }) => {
    fn({ pageNum: 1, pageSize: 10 })
      .then((res) => {
        writeCache(key, res.rows || res.data || [])
      })
      .catch(() => {})
  })
  // 事件表单里的用户下拉选项需要全量，单独预热一份
  listMsgUser({ pageNum: 1, pageSize: 200 })
    .then((res) => {
      writeCache('msg_users_options', res.rows || res.data || [])
    })
    .catch(() => {})
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
