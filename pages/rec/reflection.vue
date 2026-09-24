<template>
  <view class="page">
    <view class="action-bar">
      <button class="btn-primary" @click="openForm()">新增感想</button>
      <button class="btn-plain" @click="loadList">刷新</button>
    </view>

    <view v-if="!list.length" class="empty">暂无感想</view>
    <view v-for="item in list" :key="item.id" class="record-card" @click="openForm(item)">
      <view class="bar" style="background: #fa8c16"></view>
      <view class="card-body">
        <text class="card-title">{{ item.title }}</text>
        <view v-if="item.sourceType || item.sourceName" class="tags">
          <text v-if="item.sourceType" class="tag" style="color: #d46b08; background: #fff7e6">{{ item.sourceType }}</text>
          <text v-if="item.sourceName" class="tag" style="color: #4e5969; background: #f3f4f6">{{ item.sourceName }}</text>
        </view>
        <text v-if="brief(item)" class="card-sub">{{ brief(item) }}</text>
        <view class="card-ops" @click.stop>
          <text class="op-danger" @click="onDelete(item.id)">删除</text>
        </view>
      </view>
    </view>

    <form-sheet :show="show" @close="show = false">
        <view class="sheet-title">{{ form.id ? '编辑感想' : '新增感想' }}</view>
        <input v-model="form.title" class="input" placeholder="标题" />
        <input v-model="form.synopsis" class="input" placeholder="概要" />
        <textarea v-model="form.content" class="textarea" placeholder="感想内容" />
        <input v-model="form.sourceType" class="input" placeholder="来源类型" />
        <input v-model="form.sourceName" class="input" placeholder="来源名称" />
        <input v-model="form.sourceLink" class="input" placeholder="来源链接" />
        <button class="btn-primary" :loading="saving" @click="save">保存</button>
    </form-sheet>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import FormSheet from '@/components/form-sheet.vue'
import { addRecReflection, delRecReflection, listRecReflection, updateRecReflection } from '@/api/rec/reflection.js'
import { shortText } from '@/utils/labels.js'

const brief = (item) => shortText(item.synopsis || item.content)

const list = ref([])
const show = ref(false)
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

const loadList = async () => {
  const res = await listRecReflection({ pageNum: 1, pageSize: 50 })
  list.value = res.rows || res.data || []
}

const openForm = (item) => {
  resetForm()
  if (item) Object.assign(form, item)
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
      await delRecReflection(id)
      loadList()
    }
  })
}

onShow(loadList)
</script>
