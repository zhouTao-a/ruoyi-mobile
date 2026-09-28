<template>
  <view class="page page-dock" @click="openId = null" @touchstart="onBackStart" @touchend="onBackEnd">
    <view class="action-bar action-dock">
      <button class="btn-primary" @click="openForm()">新增报告</button>
    </view>

    <template v-if="!firstLoaded && !list.length">
      <skeleton-card v-for="i in 4" :key="'sk' + i" />
    </template>
    <view v-else-if="!list.length" class="empty-block">
      <text class="empty-emoji">📝</text>
      <text class="empty-title">还没有报告</text>
      <text class="empty-desc">日报、周报、月报，记录工作也方便回顾</text>
      <button class="btn-primary empty-action" @click="openForm()">写第一份报告</button>
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
          <text class="card-title">{{ dictLabel(typeDict, item.reportType) }}</text>
          <view class="card-meta">
            <text class="meta-chip" :style="typeChipStyle(item)">{{ dateText(item.reportDate) }}</text>
            <text v-if="brief(item)" class="meta-text">{{ brief(item) }}</text>
          </view>
        </view>
      </view>
    </swipe-card>
    <list-footer :total="list.length" :loading="loadingMore" :finished="finished" />

    <form-sheet :show="show" @close="show = false">
        <view class="sheet-title">{{ form.id ? '编辑报告' : '新增报告' }}</view>
        <view class="form-group">
          <view class="group-title">基础信息</view>
          <option-chips v-model="form.reportType" label="类型" :options="typeOptions" />
          <date-field v-model="form.reportDate" label="日期" placeholder="请选择日期" />
        </view>
        <view class="form-group">
          <view class="group-title">报告内容</view>
          <text class="field-label">摘要</text>
          <textarea v-model="form.summary" class="textarea text-block" auto-height maxlength="-1" placeholder="请输入摘要" />
          <text class="field-label">内容</text>
          <textarea v-model="form.content" class="textarea text-block" auto-height maxlength="-1" placeholder="请输入内容" />
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
import { addRecReport, delRecReport, listRecReport, updateRecReport } from '@/api/rec/report.js'
import { useDict } from '@/utils/dict.js'
import { REPORT_TYPE, canonical, findOption, shortText, withCurrent } from '@/utils/labels.js'

const typeDict = useDict('report_type', REPORT_TYPE)
const dictLabel = (dict, value) => findOption(dict, value).label
const brief = (item) => shortText(item.summary || item.content)
const dateText = (val) => (val ? String(val).slice(0, 10) : '未设')

const barColor = (item) => {
  const opt = findOption(typeDict.value, item.reportType)
  return opt.color || '#13a8a8'
}
const typeChipStyle = (item) => {
  const opt = findOption(typeDict.value, item.reportType)
  return { color: opt.color, background: opt.bg }
}

const { list, loadingMore, finished, refresh, firstLoaded } = usePagedList((query) => listRecReport(query), { cacheKey: 'rec_report' })
const show = ref(false)
const openId = ref(null)
const { onBackStart, onBackEnd } = useSwipeBack()
const onReveal = (id, open) => {
  openId.value = open ? id : null
}
const saving = ref(false)
const form = reactive({
  id: undefined,
  reportType: 'daily',
  reportDate: '',
  summary: '',
  content: ''
})

const typeOptions = computed(() => withCurrent(typeDict.value, form.reportType))

const resetForm = () => {
  form.id = undefined
  form.reportType = 'daily'
  form.reportDate = ''
  form.summary = ''
  form.content = ''
}

const openForm = (item) => {
  openId.value = null
  resetForm()
  if (item) {
    Object.assign(form, item)
    form.reportType = canonical(typeDict.value, item.reportType) || item.reportType || 'daily'
    form.reportDate = String(item.reportDate || '').slice(0, 10)
  }
  show.value = true
}

const save = async () => {
  saving.value = true
  try {
    if (form.id) await updateRecReport({ ...form })
    else await addRecReport({ ...form })
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
      await delRecReport(id)
      refresh()
    }
  })
}

onShow(refresh)
</script>
