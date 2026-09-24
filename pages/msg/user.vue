<template>
  <view class="page">
    <view class="action-bar">
      <button class="btn-primary" @click="openForm()">新增用户</button>
      <button class="btn-plain" @click="loadList">刷新</button>
    </view>

    <view v-if="!list.length" class="empty">暂无用户</view>
    <view v-for="item in list" :key="item.id" class="record-card" @click="openForm(item)">
      <view class="bar" style="background: #2f6fed"></view>
      <view class="card-body">
        <text class="card-title">{{ item.userName || '未命名' }}</text>
        <view class="tags">
          <text v-if="item.userCode" class="tag" style="color: #4e5969; background: #f3f4f6">{{ item.userCode }}</text>
          <text v-if="item.gender" class="tag" :style="tagStyle(findOption(GENDER, item.gender))">{{ findOption(GENDER, item.gender).label }}</text>
          <text class="tag" :style="tagStyle(findOption(YES_NO, item.emailNotifyFlag))">邮箱{{ findOption(YES_NO, item.emailNotifyFlag).label }}</text>
        </view>
        <text class="card-sub">{{ item.phoneNumber || '无手机' }} · {{ item.email || '无邮箱' }}</text>
        <view class="card-ops" @click.stop>
          <text class="op-danger" @click="onDelete(item.id)">删除</text>
        </view>
      </view>
    </view>

    <form-sheet :show="show" @close="show = false">
        <view class="sheet-title">{{ form.id ? '编辑用户' : '新增用户' }}</view>
        <input v-model="form.userName" class="input" placeholder="用户名" />
        <input v-model="form.userCode" class="input" placeholder="用户编码" />
        <option-chips v-model="form.gender" label="性别" :options="genderOptions" />
        <input v-model="form.phoneNumber" class="input" placeholder="手机号" />
        <input v-model="form.email" class="input" placeholder="邮箱" />
        <input v-model="form.birthday" class="input" placeholder="生日 yyyy-MM-dd" />
        <option-chips v-model="form.smsNotifyFlag" label="短信通知" :options="YES_NO" />
        <option-chips v-model="form.emailNotifyFlag" label="邮箱通知" :options="YES_NO" />
        <button class="btn-primary" :loading="saving" @click="save">保存</button>
    </form-sheet>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import FormSheet from '@/components/form-sheet.vue'
import OptionChips from '@/components/option-chips.vue'
import { addMsgUser, delMsgUser, listMsgUser, updateMsgUser } from '@/api/msg/user.js'
import { GENDER, YES_NO, canonical, findOption, withCurrent } from '@/utils/labels.js'

const tagStyle = (meta) => ({ color: meta.color, background: meta.bg })

const list = ref([])
const show = ref(false)
const saving = ref(false)
const form = reactive({
  id: undefined,
  userName: '',
  userCode: '',
  gender: '',
  phoneNumber: '',
  email: '',
  birthday: '',
  smsNotifyFlag: 'F',
  emailNotifyFlag: 'T',
  fatherId: 0,
  motherId: 0,
  spouseId: 0
})

const genderOptions = computed(() => withCurrent(GENDER, form.gender))

const resetForm = () => {
  Object.assign(form, {
    id: undefined,
    userName: '',
    userCode: '',
    gender: '',
    phoneNumber: '',
    email: '',
    birthday: '',
    smsNotifyFlag: 'F',
    emailNotifyFlag: 'T',
    fatherId: 0,
    motherId: 0,
    spouseId: 0
  })
}

const loadList = async () => {
  const res = await listMsgUser({ pageNum: 1, pageSize: 50 })
  list.value = res.rows || res.data || []
}

const openForm = (item) => {
  resetForm()
  if (item) {
    Object.assign(form, item)
    form.gender = canonical(GENDER, item.gender) || item.gender || ''
    form.smsNotifyFlag = canonical(YES_NO, item.smsNotifyFlag) || 'F'
    form.emailNotifyFlag = canonical(YES_NO, item.emailNotifyFlag) || 'T'
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
      await delMsgUser(id)
      loadList()
    }
  })
}

onShow(loadList)
</script>
