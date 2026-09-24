<template>
  <view class="page">
    <view class="action-bar">
      <button class="btn-primary" @click="openForm()">新增自省</button>
      <button class="btn-plain" @click="loadList">刷新</button>
    </view>

    <view v-if="!list.length" class="empty">暂无自省主题</view>
    <view v-for="item in list" :key="item.id" class="record-card" @click="openForm(item)">
      <view class="bar" style="background: #722ed1"></view>
      <view class="card-body">
        <text class="card-title">{{ item.title }}</text>
        <view class="tags">
          <text class="tag" :style="tagStyle(findOption(INTROSPECT_STATUS, item.status))">{{ findOption(INTROSPECT_STATUS, item.status).label }}</text>
        </view>
        <view class="card-ops" @click.stop>
          <text class="op-link" @click="openItem(item)">写记录</text>
          <text class="op-danger" @click="onDelete(item.id)">删除</text>
        </view>
      </view>
    </view>

    <form-sheet :show="show" @close="show = false">
        <view class="sheet-title">{{ form.id ? '编辑自省' : '新增自省' }}</view>
        <input v-model="form.title" class="input" placeholder="主题标题" />
        <option-chips v-model="form.status" label="是否生效" :options="statusOptions" />
        <button class="btn-primary" :loading="saving" @click="save">保存</button>
    </form-sheet>

    <form-sheet :show="itemShow" @close="itemShow = false">
        <view class="sheet-title">写自省记录 · {{ currentTitle }}</view>
        <input v-model="itemForm.occurDate" class="input" placeholder="日期 yyyy-MM-dd" />
        <textarea v-model="itemForm.content" class="textarea" placeholder="当天发生的情况" />
        <button class="btn-primary" :loading="itemSaving" @click="saveItem">保存记录</button>
    </form-sheet>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import FormSheet from '@/components/form-sheet.vue'
import OptionChips from '@/components/option-chips.vue'
import {
  addRecIntrospect,
  addRecIntrospectItem,
  delRecIntrospect,
  listRecIntrospect,
  updateRecIntrospect
} from '@/api/rec/introspect.js'
import { INTROSPECT_STATUS, canonical, findOption, withCurrent } from '@/utils/labels.js'

const tagStyle = (meta) => ({ color: meta.color, background: meta.bg })

const list = ref([])
const show = ref(false)
const saving = ref(false)
const itemShow = ref(false)
const itemSaving = ref(false)
const currentTitle = ref('')
const form = reactive({ id: undefined, title: '', status: 'inactive', sortOrder: 0 })
const itemForm = reactive({ introspectId: undefined, occurDate: '', content: '' })

const statusOptions = computed(() => withCurrent(INTROSPECT_STATUS, form.status))

const loadList = async () => {
  const res = await listRecIntrospect({ pageNum: 1, pageSize: 50 })
  list.value = res.rows || res.data || []
}

const openForm = (item) => {
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
    await loadList()
  } finally {
    saving.value = false
  }
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
      loadList()
    }
  })
}

onShow(loadList)
</script>
