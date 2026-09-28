<template>
  <view>
    <text class="field-label">{{ label }}</text>
    <picker mode="selector" :range="labels" :value="index" @change="onChange">
      <view class="input picker-value" :class="{ empty: !current }">{{ current || placeholder }}</view>
    </picker>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, default: '' },
  placeholder: { type: String, default: '请选择' },
  options: { type: Array, default: () => [] },
  modelValue: { type: [String, Number], default: '' }
})
const emit = defineEmits(['update:modelValue'])

const labels = computed(() => props.options.map((item) => item.label))
const index = computed(() => {
  const i = props.options.findIndex((item) => String(item.value) === String(props.modelValue))
  return i < 0 ? 0 : i
})
const current = computed(() => {
  const hit = props.options.find((item) => String(item.value) === String(props.modelValue))
  return hit ? hit.label : ''
})

const onChange = (event) => {
  const item = props.options[Number(event.detail.value)]
  if (item) emit('update:modelValue', item.value)
}
</script>
