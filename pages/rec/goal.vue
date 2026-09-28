<template>
  <view class="page page-dock" @click="openId = null" @touchstart="onBackStart" @touchend="onBackEnd">
    <view class="action-bar action-dock">
      <button class="btn-plain" @click="setAll(true)">展开</button>
      <button class="btn-plain" @click="setAll(false)">折叠</button>
      <button class="btn-primary" @click="openForm()">新增目标</button>
    </view>

    <template v-if="!firstLoaded && !list.length">
      <skeleton-card v-for="i in 4" :key="'sk' + i" />
    </template>
    <view v-else-if="!list.length" class="empty-block">
      <text class="empty-emoji">🎯</text>
      <text class="empty-title">还没有目标</text>
      <text class="empty-desc">立一个目标，把想做的事拆解成可执行的小步</text>
      <button class="btn-primary empty-action" @click="openForm()">新增第一个目标</button>
    </view>
    <swipe-card
      v-for="item in visibleList"
      :key="item.id"
      :open="openId === item.id"
      :style="{ marginLeft: item._level * 28 + 'rpx' }"
      @update:open="onReveal(item.id, $event)"
      @delete="onDelete(item.id)"
      @click="openForm(item)"
    >
      <view class="record-card">
        <view class="bar" :style="{ background: barColor(item) }"></view>
        <view class="card-body">
          <view class="card-head">
            <text class="card-title" :class="{ done: statusOf(item) === 'completed' }">{{ item.title }}</text>
            <view v-if="item._hasChild" class="fold-hit" @click.stop="openId = null; toggleFold(item)">
              <view class="fold-pill">
                <text class="fold-icon">{{ foldIcon(item) }}</text>
                <text v-if="childCount(item)" class="fold-count">{{ childCount(item) }}</text>
              </view>
            </view>
          </view>
          <view class="card-meta">
            <text class="meta-chip" :style="chipStyle(item)">{{ dictLabel(statusDict, item.status) }}</text>
            <text class="meta-text">{{ item.deadLine ? String(item.deadLine).slice(0, 10) : '未设截止' }}</text>
          </view>
        </view>
      </view>
    </swipe-card>
    <list-footer :total="list.length" :loading="loadingMore" :finished="finished" />

    <form-sheet :show="show" @close="show = false">
        <view class="sheet-title">{{ form.id ? '编辑目标' : '新增目标' }}</view>
        <view class="form-group">
          <view class="group-title">基础信息</view>
          <select-field v-model="form.parentId" label="父目标" placeholder="请选择父目标" :options="parentOptions" />
          <text class="field-label req">标题</text>
          <input v-model="form.title" class="input" placeholder="请输入标题" />
          <option-chips v-model="form.status" label="状态" :options="statusOptions" />
        </view>
        <view class="form-group">
          <view class="group-title">进度与日期</view>
          <text class="field-label">进度</text>
          <input v-model="form.progress" class="input" type="number" placeholder="0-100" />
          <date-field v-model="form.deadLine" label="截止日期" placeholder="请选择日期" />
          <text class="field-label">排序</text>
          <input v-model="form.sortOrder" class="input" type="number" placeholder="0" />
        </view>
        <view class="form-group">
          <view class="group-title">详细内容</view>
          <text class="field-label">内容</text>
          <textarea v-model="form.content" class="textarea text-block" auto-height maxlength="-1" placeholder="请输入内容" />
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
import { addRecGoal, delRecGoal, listRecGoal, updateRecGoal } from '@/api/rec/goal.js'
import { useDict } from '@/utils/dict.js'
import { TASK_STATUS, canonical, findOption, withCurrent } from '@/utils/labels.js'

const statusDict = useDict('task_status', TASK_STATUS)
const dictLabel = (dict, value) => findOption(dict, value).label

/** partial：待处理、进行中、已完成；full：连暂停、取消也显示 */
const expandMode = ref({})
const AUTO_STATUS = ['pending', 'in_progress']
const SHOWN_STATUS = ['pending', 'in_progress', 'completed']
const isRoot = (item) => Number(item.level) === 1 || !item.parentId || Number(item.parentId) === 0
const statusOf = (node) => canonical(statusDict.value, node.status) || node.status || ''
const show = ref(false)
const openId = ref(null)
const { onBackStart, onBackEnd } = useSwipeBack()
const onReveal = (id, open) => {
  openId.value = open ? id : null
}
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

const statusOptions = computed(() => withCurrent(statusDict.value, form.status))

/** 卡片左侧色条：按状态取色，已完成转灰 */
const barColor = (item) => {
  const opt = findOption(statusDict.value, item.status)
  return statusOf(item) === 'completed' ? '#c0c4cc' : opt.color || '#389e0d'
}
/** 状态 chip：按字典 color/bg 取色 */
const chipStyle = (item) => {
  const opt = findOption(statusDict.value, item.status)
  return { color: opt.color, background: opt.bg }
}

const toTree = (rows) => {
  const nodes = rows || []
  if (nodes.some((item) => item.children && item.children.length)) return nodes
  const map = new Map()
  nodes.forEach((item) => map.set(item.id, { ...item, children: [] }))
  const roots = []
  map.forEach((node) => {
    const parent = node.parentId && map.get(node.parentId)
    if (parent && parent.id !== node.id) parent.children.push(node)
    else roots.push(node)
  })
  return roots
}

const shownChildren = (node, mode) => {
  const children = node.children || []
  if (mode === 'full') return children
  if (mode === 'partial') return children.filter((child) => SHOWN_STATUS.includes(statusOf(child)))
  return []
}

const hasOther = (node) => (node.children || []).some((child) => !SHOWN_STATUS.includes(statusOf(child)))

/** 待处理、进行中默认展开，子节点里带上全部已完成；暂停和取消保持收起 */
const applyAutoExpand = () => {
  const next = { ...expandMode.value }
  const walk = (nodes) => {
    ;(nodes || []).forEach((node) => {
      const children = node.children || []
      if (AUTO_STATUS.includes(statusOf(node)) && children.length && !next[node.id]) {
        next[node.id] = 'partial'
      }
      walk(children)
    })
  }
  walk(toTree(list.value))
  expandMode.value = next
}

const { list, loadingMore, finished, refresh, firstLoaded } = usePagedList((query) => listRecGoal(query), {
  count: (rows) => rows.filter(isRoot).length,
  seen: (rows) => rows.filter(isRoot).length,
  cacheKey: 'rec_goal',
  afterLoad: (reset) => {
    if (reset) expandMode.value = {}
    applyAutoExpand()
  }
})

const visibleList = computed(() => {
  const result = []
  const walk = (nodes, level) => {
    ;(nodes || []).forEach((node) => {
      const children = node.children || []
      const mode = expandMode.value[node.id]
      result.push({
        ...node,
        _level: level,
        _mode: mode || '',
        _hasChild: children.length > 0,
        _hasOther: hasOther(node)
      })
      const visible = shownChildren(node, mode)
      if (visible.length) walk(visible, level + 1)
    })
  }
  walk(toTree(list.value), 0)
  return result
})

const foldIcon = (item) => {
  if (!item._mode || (item._mode === 'partial' && item._hasOther)) return '+'
  return '−'
}

/** 折叠按钮上的子项数量徽标 */
const childCount = (item) => {
  const node = toTree(list.value).find((n) => n.id === item.id)
  if (!node) return 0
  const children = node.children || []
  return children.length
}

const toggleFold = (item) => {
  const next = { ...expandMode.value }
  if (!item._mode) {
    const partial = shownChildren(item, 'partial')
    next[item.id] = partial.length ? 'partial' : 'full'
  } else if (item._mode === 'partial' && item._hasOther) {
    next[item.id] = 'full'
  } else {
    delete next[item.id]
  }
  expandMode.value = next
}

const setAll = (open) => {
  if (!open) {
    expandMode.value = {}
    return
  }
  expandMode.value = {}
  applyAutoExpand()
}

const parentOptions = computed(() => {
  const blocked = new Set()
  const mark = (nodes) => {
    ;(nodes || []).forEach((node) => {
      blocked.add(node.id)
      mark(node.children)
    })
  }
  if (form.id) {
    const find = (nodes) => {
      for (const node of nodes || []) {
        if (node.id === form.id) return node
        const hit = find(node.children)
        if (hit) return hit
      }
      return null
    }
    mark([find(toTree(list.value))].filter(Boolean))
  }
  const options = [{ value: 0, label: '无（顶级）' }]
  const walk = (nodes) => {
    ;(nodes || []).forEach((node) => {
      if (!blocked.has(node.id)) options.push({ value: node.id, label: node.title })
      walk(node.children)
    })
  }
  walk(toTree(list.value))
  return options
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

const openForm = (item) => {
  openId.value = null
  resetForm()
  if (item) {
    const { _level, _mode, _hasChild, _hasOther, children, ...rest } = item
    Object.assign(form, rest)
    form.status = canonical(statusDict.value, item.status) || 'pending'
    form.deadLine = String(item.deadLine || '').slice(0, 10)
    form.parentId = item.parentId || 0
    form.sortOrder = item.sortOrder ?? 0
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
      await delRecGoal(id)
      refresh()
    }
  })
}

onShow(refresh)
</script>

<style scoped>
.card-head {
  align-items: center;
}
.fold-hit {
  flex-shrink: 0;
  width: 96rpx;
  height: 64rpx;
  margin-right: -8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* 折叠按钮：胶囊形 + 子项数量徽标 */
.fold-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  height: 44rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  background: #f6ffed;
  border: 1px solid #d9f7be;
}
.fold-icon {
  line-height: 1;
  color: #389e0d;
  font-size: 28rpx;
  font-weight: 700;
}
.fold-count {
  font-size: 20rpx;
  line-height: 1;
  color: #389e0d;
  font-weight: 600;
  border-left: 1px solid #d9f7be;
  padding: 2rpx 0 2rpx 6rpx;
}
</style>
