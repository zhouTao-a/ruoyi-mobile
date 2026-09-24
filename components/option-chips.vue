<template>
  <view class="chip-field">
    <text v-if="label" class="field-label">{{ label }}</text>
    <view class="chips">
      <text
        v-for="opt in options"
        :key="opt.value"
        class="chip"
        :class="{ on: String(modelValue) === String(opt.value) }"
        @click="emit('update:modelValue', opt.value)"
      >{{ opt.label }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  modelValue: { type: [String, Number], default: '' }
})
const emit = defineEmits(['update:modelValue'])
</script>
