<template>
  <view v-if="show" class="mask" @click="emit('close')" @touchstart.stop="onTouchStart" @touchend.stop="onTouchEnd">
    <view class="sheet card sheet-panel" @click.stop @touchstart.stop="onTouchStart" @touchend.stop="onTouchEnd">
      <view class="sheet-handle"></view>
      <scroll-view scroll-y class="sheet-scroll" :style="{ height: scrollHeight }" :show-scrollbar="false">
        <view class="sheet-inner">
          <slot />
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { getCurrentInstance, nextTick, ref, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false }
})
const emit = defineEmits(['close'])

const instance = getCurrentInstance()
const scrollHeight = ref('0px')
let startX = 0
let startY = 0

/** 从左向右滑关闭，和点空白处一样 */
const onTouchStart = (e) => {
  const t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0])
  if (!t) return
  startX = t.clientX
  startY = t.clientY
}

const onTouchEnd = (e) => {
  const t = e.changedTouches && e.changedTouches[0]
  if (!t) return
  const dx = t.clientX - startX
  const dy = t.clientY - startY
  if (dx > 70 && dx > Math.abs(dy)) emit('close')
}

/** 可用高度的 85%，用像素，App 里 vh 经常算不准 */
const maxHeight = () => {
  const info = uni.getSystemInfoSync()
  const windowHeight = info.windowHeight || info.screenHeight || 600
  return Math.floor(windowHeight * 0.85)
}

const fitHeight = (delay) => {
  nextTick(() => {
    setTimeout(() => {
      if (!props.show) return
      const proxy = instance && instance.proxy
      if (!proxy) return
      uni
        .createSelectorQuery()
        .in(proxy)
        .select('.sheet-inner')
        .boundingClientRect((rect) => {
          const max = maxHeight()
          const content = rect && rect.height ? Math.ceil(rect.height) : max
          scrollHeight.value = Math.min(content, max) + 'px'
        })
        .exec()
    }, delay)
  })
}

watch(
  () => props.show,
  (visible) => {
    if (!visible) return
    // 先给到上限，保证一打开就能滑到全部字段，量完再收成实际高度
    scrollHeight.value = maxHeight() + 'px'
    fitHeight(60)
    fitHeight(360)
  },
  { immediate: true }
)
</script>
