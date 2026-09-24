<template>
  <view class="page">
    <view class="action-bar">
      <button class="btn-primary" @click="openForm()">新增目标</button>
      <button class="btn-plain" @click="loadList">刷新</button>
    </view>

    <view v-if="!list.length" class="empty">暂无目标</view>
    <view
      v-for="item in flatList"
      :key="item.id"
      class="record-card"
      :style="{ marginLeft: item._level * 24 + 'rpx' }"
      @click="openForm(item)"
    >
      <view class="bar" style="background: #389e0d"></view>
      <view class="card-body">
        <text class="card-title">{{ item.title }}</text>
        <view class="tags">
          <text class="tag" :style="tagStyle(findOption(TASK_STATUS, item.status))">{{ findOption(TASK_STATUS, item.status).label }}</text>
          <text class="tag" style="color: #389e0d; background: #f6ffed">{{ item.progress ?? 0 }}%</text>
        </view>
        <text class="card-sub">截止 {{ item.deadLine || '未设' }}</text>
        <view class="card-ops" @click.stop>
          <text class="op-danger" @click="onDelete(item.id)">删除</text>
        </view>
      </view>
    </view>

    <form-sheet :show="show" @close="show = false">
        <view class="sheet-title">{{ form.id ? '编辑目标' : '新增目标' }}</view>
        <input v-model="form.title" class="input" placeholder="标题" />
        <textarea v-model="form.content" class="textarea" placeholder="内容" />
        <option-chips v-model="form.status" label="状态" :options="statusOptions" />
        <input v-model="form.progress" class="input" type="number" placeholder="进度" />
        <input v-model="form.deadLine" class="input" placeholder="截止日期 yyyy-MM-dd" />
        <button class="btn-primary" :loading="saving" @click="save">保存</button>
    </form-sheet>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import FormSheet from '@/components/form-sheet.vue'
import OptionChips from '@/components/option-chips.vue'
import { addRecGoal, delRecGoal, listRecGoal, updateRecGoal } from '@/api/rec/goal.js'
import { TASK_STATUS, canonical, findOption, withCurrent } from '@/utils/labels.js'

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
  level: 1,
  parentId: 0,
  topId: 0,
  sortOrder: 0
})

const statusOptions = computed(() => withCurrent(TASK_STATUS, form.status))

/** 树形目标拍平展示 */
const flatList = computed(() => {
  const result = []
  const walk = (nodes, level = 0) => {
    ;(nodes || []).forEach((n) => {
      result.push({ ...n, _level: level })
      if (n.children && n.children.length) walk(n.children, level + 1)
    })
  }
  walk(list.value)
  if (!result.length && list.value.length) {
    return list.value.map((n) => ({ ...n, _level: 0 }))
  }
  return result
})

const resetForm = () => {
  Object.assign(form, {
    id: undefined,
    title: '',
    content: '',
    status: 'pending',
    progress: 0,
    deadLine: '',
    level: 1,
    parentId: 0,
    topId: 0,
    sortOrder: 0
  })
}

const loadList = async () => {
  const res = await listRecGoal({ pageNum: 1, pageSize: 100 })
  list.value = res.rows || res.data || []
}

const openForm = (item) => {
  resetForm()
  if (item) {
    const { _level, children, ...rest } = item
    Object.assign(form, rest)
    form.status = canonical(TASK_STATUS, item.status) || 'pending'
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
    if (form.id) await updateRecGoal(payload)
    else await addRecGoal(payload)
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
      await delRecGoal(id)
      loadList()
    }
  })
}

onShow(loadList)
</script>
