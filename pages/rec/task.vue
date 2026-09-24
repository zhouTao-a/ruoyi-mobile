<template>
  <view class="page">
    <view class="action-bar">
      <button class="btn-primary" @click="openForm()">新增任务</button>
      <button class="btn-plain" @click="loadList">刷新</button>
    </view>

    <view v-if="!list.length" class="empty">暂无任务</view>
    <view v-for="item in list" :key="item.id" class="record-card" @click="openForm(item)">
      <view class="bar" style="background: #2f6fed"></view>
      <view class="card-body">
        <text class="card-title">{{ item.title }}</text>
        <view class="tags">
          <text class="tag" :style="tagStyle(findOption(TASK_STATUS, item.status))">{{ findOption(TASK_STATUS, item.status).label }}</text>
          <text v-if="item.priority" class="tag" :style="tagStyle(findOption(PRIORITY, item.priority))">{{ findOption(PRIORITY, item.priority).label }}优先</text>
        </view>
        <text class="card-sub">进度 {{ item.progress ?? 0 }}% · 截止 {{ item.deadLine || '未设' }}</text>
        <view class="card-ops" @click.stop>
          <text class="op-danger" @click="onDelete(item.id)">删除</text>
        </view>
      </view>
    </view>

    <form-sheet :show="show" @close="show = false">
        <view class="sheet-title">{{ form.id ? '编辑任务' : '新增任务' }}</view>
        <text class="field-label">标题</text>
        <input v-model="form.title" class="input" placeholder="请输入标题" />
        <option-chips v-model="form.status" label="状态" :options="statusOptions" />
        <text class="field-label">进度</text>
        <input v-model="form.progress" class="input" type="number" placeholder="0-100" />
        <text class="field-label">截止日期</text>
        <input v-model="form.deadLine" class="input" placeholder="yyyy-MM-dd" />
        <option-chips v-model="form.priority" label="优先级" :options="priorityOptions" />
        <text class="field-label">描述</text>
        <textarea v-model="form.content" class="textarea" placeholder="请输入描述" />
        <button class="btn-primary" :loading="saving" @click="save">保存</button>
    </form-sheet>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import FormSheet from '@/components/form-sheet.vue'
import OptionChips from '@/components/option-chips.vue'
import { addRecTask, delRecTask, listRecTask, updateRecTask } from '@/api/rec/task.js'
import { PRIORITY, TASK_STATUS, canonical, findOption, withCurrent } from '@/utils/labels.js'

const tagStyle = (meta) => ({ color: meta.color, background: meta.bg })

const list = ref([])
const show = ref(false)
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

const statusOptions = computed(() => withCurrent(TASK_STATUS, form.status))
const priorityOptions = computed(() => withCurrent(PRIORITY, form.priority))

const resetForm = () => {
  form.id = undefined
  form.title = ''
  form.content = ''
  form.status = 'pending'
  form.progress = 0
  form.deadLine = ''
  form.priority = 'high'
}

const loadList = async () => {
  const res = await listRecTask({ pageNum: 1, pageSize: 50 })
  list.value = res.rows || res.data || []
}

const openForm = (item) => {
  resetForm()
  if (item) {
    Object.assign(form, item)
    form.status = canonical(TASK_STATUS, item.status) || 'pending'
    form.priority = canonical(PRIORITY, item.priority) || item.priority || ''
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
      await delRecTask(id)
      uni.showToast({ title: '已删除', icon: 'success' })
      loadList()
    }
  })
}

onShow(loadList)
</script>
