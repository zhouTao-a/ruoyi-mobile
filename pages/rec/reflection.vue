<template>
  <view class="page page-dock" @click="openId = null" @touchstart="onBackStart" @touchend="onBackEnd">
    <view class="action-bar action-dock">
      <button class="btn-primary" @click="openForm()">新增感想</button>
    </view>

    <template v-if="!firstLoaded && !list.length">
      <skeleton-card v-for="i in 4" :key="'sk' + i" />
    </template>
    <view v-else-if="!list.length" class="empty-block">
      <text class="empty-emoji">💭</text>
      <text class="empty-title">还没有感想</text>
      <text class="empty-desc">读到的、想到的、感悟到的，都值得记一笔</text>
      <button class="btn-primary empty-action" @click="openForm()">写下第一条感想</button>
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
        <view class="bar" style="background: #fa8c16"></view>
        <view class="card-body">
          <text class="card-title">{{ item.title }}</text>
          <view class="card-meta">
            <text class="meta-chip" :style="sourceChipStyle(item)">{{ dictLabel(sourceDict, item.sourceType) }}</text>
            <text v-if="item.sourceName" class="meta-text">{{ item.sourceName }}</text>
          </view>
        </view>
      </view>
    </swipe-card>
    <list-footer :total="list.length" :loading="loadingMore" :finished="finished" />

    <form-sheet :show="show" @close="show = false">
        <view class="sheet-title">{{ form.id ? '编辑感想' : '新增感想' }}</view>
        <view class="form-group">
          <view class="group-title">基础信息</view>
          <text class="field-label req">标题</text>
          <input v-model="form.title" class="input" placeholder="请输入标题" />
          <text class="field-label">概要</text>
          <textarea v-model="form.synopsis" class="textarea text-block" auto-height maxlength="-1" placeholder="请输入概要" />
          <text class="field-label">感想</text>
          <textarea v-model="form.content" class="textarea text-block" auto-height maxlength="-1" placeholder="请输入感想" />
        </view>
        <view class="form-group">
          <view class="group-title">来源</view>
          <select-field v-model="form.sourceType" label="来源类型" placeholder="请选择来源类型" :options="sourceOptions" />
          <text class="field-label">来源名称</text>
          <input v-model="form.sourceName" class="input" placeholder="请输入来源名称" />
          <text class="field-label">来源链接</text>
          <input v-model="form.sourceLink" class="input" placeholder="请输入来源链接" />
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
import FormSheet from '@/components/form-sheet.vue'
import SelectField from '@/components/select-field.vue'
import SwipeCard from '@/components/swipe-card.vue'
import SkeletonCard from '@/components/skeleton-card.vue'
import { useSwipeBack } from '@/utils/swipe-back.js'
import { addRecReflection, delRecReflection, listRecReflection, updateRecReflection } from '@/api/rec/reflection.js'
import { useDict } from '@/utils/dict.js'
import { canonical, findOption, withCurrent } from '@/utils/labels.js'

const sourceDict = useDict('source_type', [])
const dictLabel = (dict, value) => findOption(dict, value).label

const sourceChipStyle = (item) => {
  const opt = findOption(sourceDict.value, item.sourceType)
  return { color: opt.color, background: opt.bg }
}

const { list, loadingMore, finished, refresh, firstLoaded } = usePagedList((query) => listRecReflection(query), { cacheKey: 'rec_reflection' })
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
  synopsis: '',
  content: '',
  sourceType: '',
  sourceName: '',
  sourceLink: ''
})

const sourceOptions = computed(() => withCurrent(sourceDict.value, form.sourceType))

const resetForm = () => {
  Object.assign(form, {
    id: undefined,
    title: '',
    synopsis: '',
    content: '',
    sourceType: '',
    sourceName: '',
    sourceLink: ''
  })
}

const openForm = (item) => {
  openId.value = null
  resetForm()
  if (item) {
    Object.assign(form, item)
    form.sourceType = canonical(sourceDict.value, item.sourceType) || item.sourceType || ''
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
    if (form.id) await updateRecReflection({ ...form })
    else await addRecReflection({ ...form })
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
      await delRecReflection(id)
      refresh()
    }
  })
}

onShow(refresh)
</script>
