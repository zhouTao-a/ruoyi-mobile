<template>
  <view class="page page-dock" @click="openId = null" @touchstart="onBackStart" @touchend="onBackEnd">
    <view class="action-bar action-dock">
      <button class="btn-primary" @click="openForm()">新增自省</button>
    </view>

    <template v-if="!firstLoaded && !list.length">
      <skeleton-card v-for="i in 4" :key="'sk' + i" />
    </template>
    <view v-else-if="!list.length" class="empty-block">
      <text class="empty-emoji">✨</text>
      <text class="empty-title">还没有自省主题</text>
      <text class="empty-desc">定期回看自己，把经验沉淀成可复用的主题</text>
      <button class="btn-primary empty-action" @click="openForm()">新增第一个主题</button>
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
          <text class="card-title">{{ item.title }}</text>
          <view class="card-meta">
            <text class="meta-chip" :style="statusChipStyle(item)">{{ dictLabel(INTROSPECT_STATUS, item.status) }}</text>
          </view>
          <view v-if="opened[item.id]" class="sub-record" @click.stop>
            <picker mode="date" fields="month" :value="monthOf(item.id)" @change="onMonthChange(item, $event)">
              <view class="input picker-value">{{ monthText(monthOf(item.id)) }}</view>
            </picker>
            <view v-if="!(records[item.id] || []).length" class="card-sub">该月暂无记录</view>
            <view v-for="rec in records[item.id] || []" :key="rec.id" class="card-sub">
              日期：{{ rec.occurDate ? String(rec.occurDate).slice(0, 10) : '未设' }} · 内容：{{ rec.content }}
            </view>
          </view>
          <view class="card-ops" @click.stop>
            <text class="op-link" @click="openId = null; toggleRecords(item)">{{ opened[item.id] ? '收起记录' : '查看记录' }}</text>
            <text class="op-link" @click="openId = null; openItem(item)">写记录</text>
          </view>
        </view>
      </view>
    </swipe-card>
    <list-footer :total="list.length" :loading="loadingMore" :finished="finished" />

    <form-sheet :show="show" @close="show = false">
        <view class="sheet-title">{{ form.id ? '编辑自省' : '新增自省' }}</view>
        <view class="form-group">
          <view class="group-title">基础信息</view>
          <text class="field-label req">标题</text>
          <input v-model="form.title" class="input" placeholder="请输入主题标题" />
          <option-chips v-model="form.status" label="是否生效" :options="statusOptions" />
          <text class="field-label">排序</text>
          <input v-model="form.sortOrder" class="input" type="number" placeholder="0" />
        </view>
        <button class="btn-primary sheet-submit" :loading="saving" @click="save">保存</button>
    </form-sheet>

    <form-sheet :show="itemShow" @close="itemShow = false">
        <view class="sheet-title">写自省记录 · {{ currentTitle }}</view>
        <view class="form-group">
          <view class="group-title">记录信息</view>
          <date-field v-model="itemForm.occurDate" label="日期" placeholder="请选择日期" />
          <text class="field-label req">内容</text>
          <textarea v-model="itemForm.content" class="textarea" placeholder="当天发生的情况" />
        </view>
        <button class="btn-primary sheet-submit" :loading="itemSaving" @click="saveItem">保存记录</button>
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
import {
  addRecIntrospect,
  addRecIntrospectItem,
  delRecIntrospect,
  listRecIntrospect,
  listRecIntrospectItem,
  updateRecIntrospect
} from '@/api/rec/introspect.js'
import { INTROSPECT_STATUS, canonical, findOption, withCurrent } from '@/utils/labels.js'

const dictLabel = (dict, value) => findOption(dict, value).label
const barColor = (item) => {
  const opt = findOption(INTROSPECT_STATUS, item.status)
  return opt.color || '#722ed1'
}
const statusChipStyle = (item) => {
  const opt = findOption(INTROSPECT_STATUS, item.status)
  return { color: opt.color, background: opt.bg }
}

const { list, loadingMore, finished, refresh, firstLoaded } = usePagedList((query) => listRecIntrospect(query), { cacheKey: 'rec_introspect' })
const show = ref(false)
const openId = ref(null)
const { onBackStart, onBackEnd } = useSwipeBack()
const onReveal = (id, open) => {
  openId.value = open ? id : null
}
const saving = ref(false)
const itemShow = ref(false)
const itemSaving = ref(false)
const currentTitle = ref('')
const form = reactive({ id: undefined, title: '', status: 'inactive', sortOrder: 0 })
const itemForm = reactive({ introspectId: undefined, occurDate: '', content: '' })
const opened = ref({})
const records = ref({})
const months = ref({})

const currentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const monthOf = (id) => months.value[id] || currentMonth()

const monthText = (ym) => {
  const [year, month] = String(ym).split('-')
  return `${year}年${Number(month)}月`
}

const monthBounds = (ym) => {
  const [year, month] = String(ym).split('-').map(Number)
  const begin = `${year}-${String(month).padStart(2, '0')}-01`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
  return { occurDateBegin: begin, occurDateEnd: end }
}

const statusOptions = computed(() => withCurrent(INTROSPECT_STATUS, form.status))

const openForm = (item) => {
  openId.value = null
  form.id = undefined
  form.title = ''
  form.status = 'inactive'
  form.sortOrder = 0
  if (item) {
    Object.assign(form, { id: item.id, title: item.title, status: item.status, sortOrder: item.sortOrder || 0 })
    form.status = canonical(INTROSPECT_STATUS, item.status) || item.status || 'inactive'
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
    if (form.id) await updateRecIntrospect({ ...form })
    else await addRecIntrospect({ ...form })
    uni.showToast({ title: '已保存', icon: 'success' })
    show.value = false
    await refresh()
  } finally {
    saving.value = false
  }
}

const loadRecords = async (id) => {
  const res = await listRecIntrospectItem({
    introspectId: id,
    pageNum: 1,
    pageSize: 1000,
    ...monthBounds(monthOf(id))
  })
  records.value = { ...records.value, [id]: res.rows || res.data || [] }
}

const onMonthChange = async (item, event) => {
  months.value = { ...months.value, [item.id]: event.detail.value }
  await loadRecords(item.id)
}

const toggleRecords = async (item) => {
  const next = !opened.value[item.id]
  opened.value = { ...opened.value, [item.id]: next }
  if (next) await loadRecords(item.id)
}

const openItem = (item) => {
  currentTitle.value = item.title
  itemForm.introspectId = item.id
  itemForm.occurDate = ''
  itemForm.content = ''
  itemShow.value = true
}

const saveItem = async () => {
  if (!itemForm.content) {
    uni.showToast({ title: '请填写内容', icon: 'none' })
    return
  }
  itemSaving.value = true
  try {
    await addRecIntrospectItem({ ...itemForm })
    uni.showToast({ title: '记录已保存', icon: 'success' })
    itemShow.value = false
    opened.value = { ...opened.value, [itemForm.introspectId]: true }
    await loadRecords(itemForm.introspectId)
  } finally {
    itemSaving.value = false
  }
}

const onDelete = (id) => {
  uni.showModal({
    title: '确认删除？',
    success: async (r) => {
      if (!r.confirm) return
      await delRecIntrospect(id)
      refresh()
    }
  })
}

onShow(refresh)
</script>
