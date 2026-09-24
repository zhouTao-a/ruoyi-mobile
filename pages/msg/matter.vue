<template>
  <view class="page">
    <view class="action-bar">
      <button class="btn-primary" @click="openForm()">新增事件</button>
      <button class="btn-plain" @click="loadList">刷新</button>
    </view>

    <view v-if="!list.length" class="empty">暂无事件</view>
    <view v-for="item in list" :key="item.id" class="record-card" @click="openForm(item)">
      <view class="bar" :style="{ background: findOption(DAY_TYPE, item.dayType).color }"></view>
      <view class="card-body">
        <text class="card-title">{{ item.dayName }}</text>
        <view class="tags">
          <text class="tag" :style="tagStyle(findOption(DAY_TYPE, item.dayType))">{{ findOption(DAY_TYPE, item.dayType).label }}</text>
          <text class="tag" :style="tagStyle(findOption(DAY_LUNAR, item.dayLunar))">{{ findOption(DAY_LUNAR, item.dayLunar).label }}</text>
          <text class="tag" :style="tagStyle(findOption(REMIND_TYPE, item.remindType))">{{ findOption(REMIND_TYPE, item.remindType).label }}</text>
          <text v-if="item.notifyStatus" class="tag" :style="tagStyle(findOption(NOTIFY_STATUS, item.notifyStatus))">{{ findOption(NOTIFY_STATUS, item.notifyStatus).label }}</text>
        </view>
        <text class="card-sub">{{ item.dayTarget || '未设时间' }} · {{ item.userName || item.userCode || '未指定用户' }}</text>
        <view class="card-ops" @click.stop>
          <text class="op-danger" @click="onDelete(item.id)">删除</text>
        </view>
      </view>
    </view>

    <form-sheet :show="show" @close="show = false">
        <view class="sheet-title">{{ form.id ? '编辑事件' : '新增事件' }}</view>
        <input v-model="form.dayName" class="input" placeholder="事件名称" />
        <input v-model="form.dayTarget" class="input" placeholder="事件时间 yyyy-MM-dd HH:mm:ss" />
        <option-chips v-model="form.dayType" label="事件类型" :options="DAY_TYPE" />
        <option-chips v-model="form.dayLunar" label="时间类型" :options="DAY_LUNAR" />
        <option-chips v-model="form.remindType" label="提醒周期" :options="remindOptions" />
        <option-chips v-model="form.repeatFlag" label="重复提醒" :options="YES_NO" />
        <input v-model="form.userId" class="input" placeholder="用户ID" />
        <input v-model="form.userName" class="input" placeholder="用户名称" />
        <input v-model="form.userCode" class="input" placeholder="用户编码" />
        <button class="btn-primary" :loading="saving" @click="save">保存</button>
    </form-sheet>
  </view>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import FormSheet from '@/components/form-sheet.vue'
import OptionChips from '@/components/option-chips.vue'
import { addMsgDayMatter, delMsgDayMatter, listMsgDayMatter, updateMsgDayMatter } from '@/api/msg/matter.js'
import {
  DAY_LUNAR,
  DAY_TYPE,
  NOTIFY_STATUS,
  REMIND_TYPE,
  YES_NO,
  canonical,
  findOption
} from '@/utils/labels.js'

const tagStyle = (meta) => ({ color: meta.color, background: meta.bg })

const list = ref([])
const show = ref(false)
const saving = ref(false)
const form = reactive({
  id: undefined,
  dayName: '',
  dayTarget: '',
  dayLunar: 'solar',
  dayType: 'life',
  remindType: 'yearly',
  repeatFlag: 'T',
  userId: '',
  userName: '',
  userCode: ''
})

const remindOptions = computed(() => (form.dayLunar === 'lunar' ? REMIND_TYPE.filter((item) => item.value === 'yearly') : REMIND_TYPE))

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
    userId: '',
    userName: '',
    userCode: ''
  })
}

const loadList = async () => {
  const res = await listMsgDayMatter({ pageNum: 1, pageSize: 50 })
  list.value = res.rows || res.data || []
}

const openForm = (item) => {
  resetForm()
  if (item) {
    Object.assign(form, item)
    form.dayType = canonical(DAY_TYPE, item.dayType) || item.dayType || 'life'
    form.dayLunar = canonical(DAY_LUNAR, item.dayLunar) || 'solar'
    form.remindType = canonical(REMIND_TYPE, item.remindType) || 'yearly'
    form.repeatFlag = canonical(YES_NO, item.repeatFlag) || 'T'
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
    await loadList()
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
      loadList()
    }
  })
}

onShow(loadList)
</script>
