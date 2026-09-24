<template>
  <view class="page">
    <view class="action-bar">
      <button class="btn-primary" @click="openForm()">新增报告</button>
      <button class="btn-plain" @click="loadList">刷新</button>
    </view>

    <view v-if="!list.length" class="empty">暂无报告</view>
    <view v-for="item in list" :key="item.id" class="record-card" @click="openForm(item)">
      <view class="bar" style="background: #13a8a8"></view>
      <view class="card-body">
        <text class="card-title">{{ findOption(REPORT_TYPE, item.reportType).label }}</text>
        <view class="tags">
          <text class="tag" :style="tagStyle(findOption(REPORT_TYPE, item.reportType))">{{ item.reportDate || '未填日期' }}</text>
        </view>
        <text v-if="brief(item)" class="card-sub">{{ brief(item) }}</text>
        <view class="card-ops" @click.stop>
          <text class="op-danger" @click="onDelete(item.id)">删除</text>
        </view>
      </view>
    </view>

    <form-sheet :show="show" @close="show = false">
        <view class="sheet-title">{{ form.id ? '编辑报告' : '新增报告' }}</view>
        <option-chips v-model="form.reportType" label="类型" :options="typeOptions" />
        <input v-model="form.reportDate" class="input" placeholder="日期 yyyy-MM-dd" />
        <textarea v-model="form.summary" class="textarea" placeholder="摘要" />
        <textarea v-model="form.content" class="textarea" placeholder="内容" />
        <button class="btn-primary" :loading="saving" @click="save">保存</button>
    </form-sheet>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import FormSheet from '@/components/form-sheet.vue'
import OptionChips from '@/components/option-chips.vue'
import { addRecReport, delRecReport, listRecReport, updateRecReport } from '@/api/rec/report.js'
import { REPORT_TYPE, canonical, findOption, shortText, withCurrent } from '@/utils/labels.js'

const tagStyle = (meta) => ({ color: meta.color, background: meta.bg })
const brief = (item) => shortText(item.summary || item.content)

const list = ref([])
const show = ref(false)
const saving = ref(false)
const form = reactive({
  id: undefined,
  reportType: 'daily',
  reportDate: '',
  summary: '',
  content: ''
})

const typeOptions = computed(() => withCurrent(REPORT_TYPE, form.reportType))

const resetForm = () => {
  form.id = undefined
  form.reportType = 'daily'
  form.reportDate = ''
  form.summary = ''
  form.content = ''
}

const loadList = async () => {
  const res = await listRecReport({ pageNum: 1, pageSize: 50 })
  list.value = res.rows || res.data || []
}

const openForm = (item) => {
  resetForm()
  if (item) {
    Object.assign(form, item)
    form.reportType = canonical(REPORT_TYPE, item.reportType) || item.reportType || 'daily'
  }
  show.value = true
}

const save = async () => {
  saving.value = true
  try {
    if (form.id) await updateRecReport({ ...form })
    else await addRecReport({ ...form })
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
      await delRecReport(id)
      loadList()
    }
  })
}

onShow(loadList)
</script>
