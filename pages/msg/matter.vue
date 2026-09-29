<template>
  <view class="page page-dock" @click="openId = null" @touchstart="onBackStart" @touchend="onBackEnd">
    <view class="action-bar action-dock">
      <button class="btn-primary" @click="openForm()">新增事件</button>
    </view>

    <template v-if="!firstLoaded && !list.length">
      <skeleton-card v-for="i in 4" :key="'sk' + i" />
    </template>
    <view v-else-if="!list.length" class="empty-block">
      <text class="empty-emoji">🔔</text>
      <text class="empty-title">还没有事件</text>
      <text class="empty-desc">生日、纪念日、工作节点，到点准时提醒</text>
      <button class="btn-primary empty-action" @click="openForm()">新增第一个事件</button>
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
          <text class="card-title">{{ item.dayName }}</text>
          <view class="card-meta">
            <text class="meta-chip" :style="typeChipStyle(item)">{{ dictLabel(typeDict, item.dayType) }}</text>
            <text class="meta-text">{{ item.nextNotifyTime || item.dayTarget || '未设时间' }}</text>
          </view>
        </view>
      </view>
    </swipe-card>
    <list-footer :total="list.length" :loading="loadingMore" :finished="finished" />

    <form-sheet :show="show" @close="show = false">
        <view class="sheet-title">{{ form.id ? '编辑事件' : '新增事件' }}</view>
        <view class="form-group">
          <view class="group-title">事件信息</view>
          <text class="field-label req">事件名称</text>
          <input v-model="form.dayName" class="input" placeholder="请输入事件名称" />
          <date-field v-model="dayDate" label="事件日期" placeholder="请选择日期" />
          <date-field v-model="dayTime" mode="time" label="事件时间" placeholder="请选择时间" />
          <option-chips v-model="form.dayType" label="事件类型" :options="typeDict" />
          <option-chips v-model="form.dayLunar" label="时间类型" :options="lunarDict" />
        </view>
        <view class="form-group">
          <view class="group-title">提醒设置</view>
          <option-chips v-model="form.remindType" label="提醒周期" :options="remindOptions" />
          <option-chips v-model="form.repeatFlag" label="重复提醒" :options="flagDict" />
          <option-chips v-model="form.notifyStatus" label="通知状态" :options="notifyDict" />
        </view>
        <view class="form-group">
          <view class="group-title">归属用户</view>
          <select-field v-model="form.userId" label="用户" placeholder="请选择用户" :options="userOptions" />
        </view>
        <button class="btn-primary sheet-submit" :loading="saving" @click="save">保存</button>
    </form-sheet>
  </view>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { usePagedList } from '@/utils/page-list.js'
import ListFooter from '@/components/list-footer.vue'
import DateField from '@/components/date-field.vue'
import SelectField from '@/components/select-field.vue'
import { listMsgUser } from '@/api/msg/user.js'
import FormSheet from '@/components/form-sheet.vue'
import OptionChips from '@/components/option-chips.vue'
import SwipeCard from '@/components/swipe-card.vue'
import SkeletonCard from '@/components/skeleton-card.vue'
import { useSwipeBack } from '@/utils/swipe-back.js'
import { addMsgDayMatter, delMsgDayMatter, listMsgDayMatter, updateMsgDayMatter } from '@/api/msg/matter.js'
import { syncPhoneRemind } from '@/utils/phone-remind.js'
import { readCache, writeCache } from '@/utils/list-cache.js'
import { useDict } from '@/utils/dict.js'
import {
  DAY_LUNAR,
  DAY_TYPE,
  NOTIFY_STATUS,
  REMIND_TYPE,
  YES_NO,
  canonical,
  findOption
} from '@/utils/labels.js'

const typeDict = useDict('day_type', DAY_TYPE)
const lunarDict = useDict('day_lunar', DAY_LUNAR)
const remindDict = useDict('remind_type', REMIND_TYPE)
const flagDict = useDict('whether_flag', YES_NO)
const notifyDict = useDict('notify_status', NOTIFY_STATUS)
const dictLabel = (dict, value) => findOption(dict, value).label

const barColor = (item) => {
  const opt = findOption(typeDict.value, item.dayType)
  return opt.color || '#2f6fed'
}
const typeChipStyle = (item) => {
  const opt = findOption(typeDict.value, item.dayType)
  return { color: opt.color, background: opt.bg }
}

const { list, loadingMore, finished, refresh, firstLoaded } = usePagedList(async (query) => {
  if (query.pageNum === 1) await loadUsers()
  return listMsgDayMatter(query)
}, { cacheKey: 'msg_matter' })
const users = ref([])
const userOptions = computed(() => users.value.map((item) => ({ value: item.id, label: `${item.userName || ''}${item.userCode ? '（' + item.userCode + '）' : ''}` })))
const show = ref(false)
const openId = ref(null)
const { onBackStart, onBackEnd } = useSwipeBack()
const onReveal = (id, open) => {
  openId.value = open ? id : null
}
const saving = ref(false)
const form = reactive({
  id: undefined,
  dayName: '',
  dayTarget: '',
  dayLunar: 'solar',
  dayType: 'life',
  remindType: 'yearly',
  repeatFlag: 'T',
  notifyStatus: 'pending',
  userId: '',
  userName: '',
  userCode: ''
})

const dayDate = computed({
  get: () => String(form.dayTarget || '').slice(0, 10),
  set: (value) => {
    const time = String(form.dayTarget || '').slice(11, 16) || '00:00'
    form.dayTarget = value ? `${value} ${time}:00` : ''
  }
})
const dayTime = computed({
  get: () => String(form.dayTarget || '').slice(11, 16),
  set: (value) => {
    const date = String(form.dayTarget || '').slice(0, 10)
    form.dayTarget = `${date || '2000-01-01'} ${value}:00`
  }
})

const remindOptions = computed(() => {
  const list = remindDict.value
  return form.dayLunar === 'lunar' ? list.filter((item) => item.value === 'yearly') : list
})

watch(
  () => form.dayLunar,
  (val) => {
    if (val === 'lunar') form.remindType = 'yearly'
  }
)

const resetForm = () => {
  Object.assign(form, {
    id: undefined,
    dayName: '',
    dayTarget: '',
    dayLunar: 'solar',
    dayType: 'life',
    remindType: 'yearly',
    repeatFlag: 'T',
    notifyStatus: 'pending',
    userId: '',
    userName: '',
    userCode: ''
  })
}

const loadUsers = async () => {
  // 先用入口页预热的缓存立即填充，避免表单打开时下拉选项空白
  const cached = readCache('msg_users_options')
  if (cached.length) users.value = cached
  try {
    const res = await listMsgUser({ pageNum: 1, pageSize: 200 })
    const rows = res.rows || res.data || []
    users.value = rows
    writeCache('msg_users_options', rows)
  } catch (e) {}
}

watch(
  () => form.userId,
  (id) => {
    const user = users.value.find((item) => String(item.id) === String(id))
    if (!user) return
    form.userName = user.userName
    form.userCode = user.userCode
  }
)

const openForm = (item) => {
  openId.value = null
  resetForm()
  if (item) {
    Object.assign(form, item)
    form.dayType = canonical(typeDict.value, item.dayType) || item.dayType || 'life'
    form.dayLunar = canonical(lunarDict.value, item.dayLunar) || 'solar'
    form.remindType = canonical(remindDict.value, item.remindType) || 'yearly'
    form.repeatFlag = canonical(flagDict.value, item.repeatFlag) || 'T'
    form.notifyStatus = canonical(notifyDict.value, item.notifyStatus) || item.notifyStatus || 'pending'
  }
  show.value = true
}

const save = async () => {
  if (!form.dayName) {
    uni.showToast({ title: '请填写事件名称', icon: 'none' })
    return
  }
  saving.value = true
  try {
    if (form.id) await updateMsgDayMatter({ ...form })
    else await addMsgDayMatter({ ...form })
    uni.showToast({ title: '已保存', icon: 'success' })
    show.value = false
    await refresh()
    syncPhoneRemind()
  } finally {
    saving.value = false
  }
}

const onDelete = (id) => {
  uni.showModal({
    title: '确认删除？',
    success: async (r) => {
      if (!r.confirm) return
      await delMsgDayMatter(id)
      refresh()
      syncPhoneRemind()
    }
  })
}

onShow(refresh)
</script>
