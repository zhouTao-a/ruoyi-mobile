<template>
  <view class="page page-dock" @click="openId = null" @touchstart="onBackStart" @touchend="onBackEnd">
    <view class="action-bar action-dock">
      <button class="btn-primary" @click="openForm()">新增任务</button>
    </view>

    <template v-if="!firstLoaded && !list.length">
      <skeleton-card v-for="i in 4" :key="'sk' + i" />
    </template>
    <view v-else-if="!list.length" class="empty-block">
      <text class="empty-emoji">📋</text>
      <text class="empty-title">还没有任务</text>
      <text class="empty-desc">把今天要做的事记下来，逐件打勾完成</text>
      <button class="btn-primary empty-action" @click="openForm()">新增第一个任务</button>
    </view>
    <swipe-card
      v-for="item in list"
      :key="item.id"
      :open="openId === item.id"
      @update:open="onReveal(item.id, $event)"
      @delete="onDelete(item.id)"
      @click="openForm(item)"
    >
      <view class="record-card">
        <view class="bar" :style="{ background: barColor(item) }"></view>
        <view class="card-body">
          <text class="card-title" :class="{ done: statusOf(item) === 'completed' }">{{ item.title }}</text>
          <view class="card-meta">
            <text class="meta-chip" :style="statusChipStyle(item)">{{ dictLabel(statusDict, item.status) }}</text>
            <text v-if="item.priority" class="meta-chip" :style="priorityChipStyle(item)">{{ dictLabel(priorityDict, item.priority) }}</text>
            <text class="meta-text">{{ item.deadLine || '未设截止' }}</text>
          </view>
        </view>
      </view>
    </swipe-card>
    <list-footer :total="list.length" :loading="loadingMore" :finished="finished" />

    <form-sheet :show="show" @close="show = false">
        <view class="sheet-title">{{ form.id ? '编辑任务' : '新增任务' }}</view>
        <view class="form-group">
          <view class="group-title">基础信息</view>
          <text class="field-label req">标题</text>
          <input v-model="form.title" class="input" placeholder="请输入标题" />
          <option-chips v-model="form.status" label="状态" :options="statusOptions" />
          <option-chips v-model="form.priority" label="优先级" :options="priorityOptions" />
        </view>
        <view class="form-group">
          <view class="group-title">进度与日期</view>
          <text class="field-label">进度</text>
          <input v-model="form.progress" class="input" type="number" placeholder="0-100" />
          <date-field v-model="form.deadLine" label="截止日期" placeholder="请选择日期" />
        </view>
        <view class="form-group">
          <view class="group-title">详细描述</view>
          <text class="field-label">描述</text>
          <textarea v-model="form.content" class="textarea text-block" auto-height maxlength="-1" placeholder="请输入描述" />
        </view>
        <button class="btn-primary sheet-submit" :loading="saving" @click="save">保存</button>
    </form-sheet>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { usePagedList } from '@/utils/page-list.js'
import ListFooter from '@/components/list-footer.vue'
import DateField from '@/components/date-field.vue'
import FormSheet from '@/components/form-sheet.vue'
import OptionChips from '@/components/option-chips.vue'
import SwipeCard from '@/components/swipe-card.vue'
import SkeletonCard from '@/components/skeleton-card.vue'
import { useSwipeBack } from '@/utils/swipe-back.js'
import { addRecTask, delRecTask, listRecTask, updateRecTask } from '@/api/rec/task.js'
import { useDict } from '@/utils/dict.js'
import { PRIORITY, TASK_STATUS, canonical, findOption, withCurrent } from '@/utils/labels.js'

const statusDict = useDict('task_status', TASK_STATUS)
const priorityDict = useDict('priority', PRIORITY)
const dictLabel = (dict, value) => findOption(dict, value).label
const statusOf = (item) => canonical(statusDict.value, item.status) || item.status || ''

/** 卡片色条：按优先级取色，已完成转灰 */
const barColor = (item) => {
  if (statusOf(item) === 'completed') return '#c0c4cc'
  const opt = findOption(priorityDict.value, item.priority)
  return opt.color || '#2f6fed'
}
const statusChipStyle = (item) => {
  const opt = findOption(statusDict.value, item.status)
  return { color: opt.color, background: opt.bg }
}
const priorityChipStyle = (item) => {
  const opt = findOption(priorityDict.value, item.priority)
  return { color: opt.color, background: opt.bg }
}

const { list, loadingMore, finished, refresh, firstLoaded } = usePagedList((query) => listRecTask(query), { cacheKey: 'rec_task' })
const show = ref(false)
const openId = ref(null)
const { onBackStart, onBackEnd } = useSwipeBack()
const onReveal = (id, open) => {
  openId.value = open ? id : null
}
const saving = ref(false)
const form = reactive({
  id: undefined,
  title: '',
  content: '',
  status: 'pending',
  progress: 0,
  deadLine: '',
  priority: 'high'
})

const statusOptions = computed(() => withCurrent(statusDict.value, form.status))
const priorityOptions = computed(() => withCurrent(priorityDict.value, form.priority))

const resetForm = () => {
  form.id = undefined
  form.title = ''
  form.content = ''
  form.status = 'pending'
  form.progress = 0
  form.deadLine = ''
  form.priority = 'high'
}

const openForm = (item) => {
  openId.value = null
  resetForm()
  if (item) {
    Object.assign(form, item)
    form.status = canonical(statusDict.value, item.status) || 'pending'
    form.priority = canonical(priorityDict.value, item.priority) || item.priority || ''
    form.deadLine = String(item.deadLine || '').slice(0, 10)
  }
  show.value = true
}

const save = async () => {
  if (!form.title) {
    uni.showToast({ title: '请填写标题', icon: 'none' })
    return
  }
  saving.value = true
  try {
    const payload = { ...form, progress: Number(form.progress || 0) }
    if (form.id) await updateRecTask(payload)
    else await addRecTask(payload)
    uni.showToast({ title: '已保存', icon: 'success' })
    show.value = false
    await refresh()
  } finally {
    saving.value = false
  }
}

const onDelete = (id) => {
  uni.showModal({
    title: '确认删除？',
    success: async (r) => {
      if (!r.confirm) return
      await delRecTask(id)
      uni.showToast({ title: '已删除', icon: 'success' })
      refresh()
    }
  })
}

onShow(refresh)
</script>
