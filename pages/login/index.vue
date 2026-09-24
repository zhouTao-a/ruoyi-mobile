<template>
  <view class="login-page">
    <view class="brand">涵涵通知</view>
    <view class="sub">移动端</view>

    <view class="form card">
      <view class="field">
        <text class="label">账号</text>
        <input v-model="form.username" class="input" placeholder="请输入账号" />
      </view>
      <view class="field">
        <text class="label">密码</text>
        <input v-model="form.password" class="input" password placeholder="请输入密码" />
      </view>
      <button class="btn-primary submit" :loading="loading" @click="handleLogin">登录</button>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { login, getInfo } from '@/api/login.js'
import { getToken, setToken, setUser } from '@/utils/auth.js'

const loading = ref(false)

onShow(() => {
  // 已登录则直接进首页
  if (getToken()) {
    uni.switchTab({ url: '/pages/index/index' })
  }
})

const form = reactive({
  username: '',
  password: '',
  tenantId: '000000'
})

const handleLogin = async () => {
  if (!form.username || !form.password) {
    uni.showToast({ title: '请输入账号和密码', icon: 'none' })
    return
  }
  loading.value = true
  try {
    const res = await login({
      username: form.username,
      password: form.password,
      tenantId: form.tenantId
    })
    const token = res.data && res.data.access_token
    if (!token) {
      throw new Error('未返回 token')
    }
    setToken(token)
    // 拉取用户信息用于「我的」页展示
    try {
      const info = await getInfo()
      setUser((info.data && info.data.user) || info.data || {})
    } catch (e) {
      setUser({ userName: form.username })
    }
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 400)
  } catch (e) {
    // request 内已 toast
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  padding: 160rpx 48rpx 48rpx;
  background: linear-gradient(180deg, #e8f0ff 0%, #f5f6f8 45%);
  box-sizing: border-box;
}
.brand {
  font-size: 56rpx;
  font-weight: 700;
  color: #1f2329;
}
.sub {
  margin-top: 8rpx;
  color: #8a8a8a;
  margin-bottom: 64rpx;
}
.field {
  margin-bottom: 28rpx;
}
.label {
  display: block;
  margin-bottom: 12rpx;
  color: #555;
}
.input {
  background: #f3f4f6;
  border-radius: 12rpx;
  padding: 22rpx 24rpx;
  font-size: 28rpx;
}
.submit {
  margin-top: 16rpx;
  height: 88rpx;
  line-height: 88rpx;
}
</style>
