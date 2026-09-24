<template>
  <view v-if="show" class="mask" @click="emit('close')">
    <view class="sheet card sheet-panel" @click.stop>
      <!-- 高度按内容计算；超过窗口上限时才滚动，避免写死一块空白或把底部裁掉 -->
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

/** 可用高度的 85%，用像素，App 里 vh 经常算不准 */
const maxHeight = () => {
  const info = uni.getSystemInfoSync()
  const windowHeight = info.windowHeight || info.screenHeight || 600
  return Math.floor(windowHeight * 0.85)
}

const fitHeight = () => {
  nextTick(() => {
    setTimeout(() => {
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
    }, 60)
  })
}

watch(
  () => props.show,
  (visible) => {
    if (!visible) return
    // 先给到上限，保证一打开就能滑到全部字段，量完再收成实际高度
    scrollHeight.value = maxHeight() + 'px'
    fitHeight()
  },
  { immediate: true }
)
</script>
