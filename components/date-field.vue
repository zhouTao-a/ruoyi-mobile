<template>
  <view>
    <text class="field-label">{{ label }}</text>
    <picker :mode="mode" :value="pickerValue" @change="onChange">
      <view class="input picker-value" :class="{ empty: !modelValue }">{{ modelValue || placeholder }}</view>
    </picker>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, default: '' },
  mode: { type: String, default: 'date' },
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '请选择' }
})
const emit = defineEmits(['update:modelValue'])

const pickerValue = computed(() => {
  if (props.modelValue) return props.modelValue
  if (props.mode === 'time') return '00:00'
  const now = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
})

const onChange = (e) => emit('update:modelValue', e.detail.value)
</script>
