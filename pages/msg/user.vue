<template>
  <view class="page page-dock" @click="openId = null" @touchstart="onBackStart" @touchend="onBackEnd">
    <view class="action-bar action-dock">
      <button class="btn-primary" @click="openForm()">新增用户</button>
    </view>

    <template v-if="!firstLoaded && !list.length">
      <skeleton-card v-for="i in 4" :key="'sk' + i" />
    </template>
    <view v-else-if="!list.length" class="empty-block">
      <text class="empty-emoji">👤</text>
      <text class="empty-title">还没有用户</text>
      <text class="empty-desc">添加通知对象，事件提醒才能精准送达</text>
      <button class="btn-primary empty-action" @click="openForm()">新增第一个用户</button>
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
          <text class="card-title">{{ item.userName || '未命名' }}</text>
          <view class="card-meta">
            <text class="meta-chip" :style="genderChipStyle(item)">{{ findOption(sexDict, item.gender).label }}</text>
            <text class="meta-text">{{ item.phoneNumber || '无手机' }}</text>
          </view>
        </view>
      </view>
    </swipe-card>
    <list-footer :total="list.length" :loading="loadingMore" :finished="finished" />

    <form-sheet :show="show" @close="show = false">
        <view class="sheet-title">{{ form.id ? '编辑用户' : '新增用户' }}</view>
        <view class="form-group">
          <view class="group-title">基本信息</view>
          <text class="field-label req">用户名</text>
          <input v-model="form.userName" class="input" placeholder="请输入用户名" />
          <text class="field-label">用户编码</text>
          <input v-model="form.userCode" class="input" placeholder="请输入用户编码" />
          <option-chips v-model="form.gender" label="性别" :options="genderOptions" />
          <text class="field-label">身份证号</text>
          <input v-model="form.idCard" class="input" placeholder="请输入身份证号" />
        </view>
        <view class="form-group">
          <view class="group-title">联系方式</view>
          <text class="field-label">手机号</text>
          <input v-model="form.phoneNumber" class="input" placeholder="请输入手机号" />
          <text class="field-label">邮箱</text>
          <input v-model="form.email" class="input" placeholder="请输入邮箱" />
        </view>
        <view class="form-group">
          <view class="group-title">生日</view>
          <date-field v-model="form.lunarBirthday" label="农历生日" placeholder="请选择日期" />
          <date-field v-model="form.birthday" label="生日" placeholder="请选择日期" />
        </view>
        <view class="form-group">
          <view class="group-title">家庭关系</view>
          <select-field v-model="form.fatherId" label="父亲" placeholder="请选择父亲" :options="relationOptions" />
          <select-field v-model="form.motherId" label="母亲" placeholder="请选择母亲" :options="relationOptions" />
          <select-field v-model="form.spouseId" label="配偶" placeholder="请选择配偶" :options="relationOptions" />
        </view>
        <view class="form-group">
          <view class="group-title">通知偏好</view>
          <option-chips v-model="form.smsNotifyFlag" label="短信通知" :options="flagOptions" />
          <option-chips v-model="form.emailNotifyFlag" label="邮箱通知" :options="flagOptions" />
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
import SelectField from '@/components/select-field.vue'
import FormSheet from '@/components/form-sheet.vue'
import OptionChips from '@/components/option-chips.vue'
import SwipeCard from '@/components/swipe-card.vue'
import SkeletonCard from '@/components/skeleton-card.vue'
import { useSwipeBack } from '@/utils/swipe-back.js'
import { addMsgUser, delMsgUser, listMsgUser, updateMsgUser } from '@/api/msg/user.js'
import { useDict } from '@/utils/dict.js'
import { GENDER, YES_NO, canonical, findOption, withCurrent } from '@/utils/labels.js'

const flagDict = useDict('whether_flag', YES_NO)
const sexDict = useDict('sys_user_sex', GENDER)

const barColor = (item) => {
  const opt = findOption(sexDict.value, item.gender)
  return opt.color || '#2f6fed'
}
const genderChipStyle = (item) => {
  const opt = findOption(sexDict.value, item.gender)
  return { color: opt.color, background: opt.bg }
}

const { list, loadingMore, finished, refresh, firstLoaded } = usePagedList((query) => listMsgUser(query), { cacheKey: 'msg_user' })
const show = ref(false)
const openId = ref(null)
const { onBackStart, onBackEnd } = useSwipeBack()
const onReveal = (id, open) => {
  openId.value = open ? id : null
}
const saving = ref(false)
const form = reactive({
  id: undefined,
  userName: '',
  userCode: '',
  gender: '',
  idCard: '',
  phoneNumber: '',
  email: '',
  lunarBirthday: '',
  birthday: '',
  smsNotifyFlag: 'F',
  emailNotifyFlag: 'T',
  fatherId: 0,
  motherId: 0,
  spouseId: 0
})

const genderOptions = computed(() => withCurrent(sexDict.value, form.gender))
const flagOptions = computed(() => flagDict.value)
const relationOptions = computed(() => {
  const options = [{ value: 0, label: '无' }]
  list.value.forEach((item) => {
    if (item.id !== form.id) options.push({ value: item.id, label: `${item.userName || ''}${item.userCode ? '（' + item.userCode + '）' : ''}` })
  })
  return options
})

const resetForm = () => {
  Object.assign(form, {
    id: undefined,
    userName: '',
    userCode: '',
    gender: '',
    idCard: '',
    phoneNumber: '',
    email: '',
    lunarBirthday: '',
    birthday: '',
    smsNotifyFlag: 'F',
    emailNotifyFlag: 'T',
    fatherId: 0,
    motherId: 0,
    spouseId: 0
  })
}

const openForm = (item) => {
  openId.value = null
  resetForm()
  if (item) {
    Object.assign(form, item)
    form.gender = canonical(sexDict.value, item.gender) || item.gender || ''
    form.lunarBirthday = String(item.lunarBirthday || '').slice(0, 10)
    form.fatherId = item.fatherId || 0
    form.motherId = item.motherId || 0
    form.spouseId = item.spouseId || 0
    form.smsNotifyFlag = canonical(flagDict.value, item.smsNotifyFlag) || 'F'
    form.emailNotifyFlag = canonical(flagDict.value, item.emailNotifyFlag) || 'T'
    form.birthday = String(item.birthday || '').slice(0, 10)
  }
  show.value = true
}

const save = async () => {
  if (!form.userName) {
    uni.showToast({ title: '请填写用户名', icon: 'none' })
    return
  }
  saving.value = true
  try {
    if (form.id) await updateMsgUser({ ...form })
    else await addMsgUser({ ...form })
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
      await delMsgUser(id)
      refresh()
    }
  })
}

onShow(refresh)
</script>
