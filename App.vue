<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { getToken } from '@/utils/auth.js'

onLaunch(() => {
  // 冷启动时：无 token 则去登录页
  const token = getToken()
  if (!token) {
    uni.reLaunch({ url: '/pages/login/index' })
  }
})
</script>

<style lang="scss">
@import './uni.scss';

page {
  background-color: #f5f6f8;
  color: #1f2329;
  font-size: 28rpx;
  overflow-x: hidden;
  /* 尽量隐藏系统滚动条（H5） */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

page::-webkit-scrollbar,
html::-webkit-scrollbar,
body::-webkit-scrollbar,
uni-page-body::-webkit-scrollbar,
.uni-scroll-view::-webkit-scrollbar,
::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
  display: none !important;
  background: transparent;
}

/* H5：隐藏右侧滚动条，保留滚动能力 */
* {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
*::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
  display: none !important;
}

.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 24rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.btn-primary {
  background: #2f6fed;
  color: #fff;
  border-radius: 12rpx;
}

.muted {
  color: #8a8a8a;
  font-size: 24rpx;
}

.empty {
  text-align: center;
  color: #999;
  padding: 80rpx 0;
}

.action-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}
.action-bar button {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  margin: 0;
  font-size: 28rpx;
}
.action-bar .btn-plain {
  flex: 0 0 180rpx;
  background: #fff;
  color: #2f6fed;
}
.action-bar button::after {
  border: none;
}

.entry {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 20rpx;
}
.entry-mark {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}
.entry-main {
  flex: 1;
  min-width: 0;
}
.entry-name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
}
.entry-desc {
  display: block;
  margin-top: 6rpx;
  color: #8a8a8a;
  font-size: 24rpx;
}
.entry-arrow {
  color: #c0c4cc;
  font-size: 40rpx;
  line-height: 1;
  margin-left: 12rpx;
}

.record-card {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}
.record-card .bar {
  width: 8rpx;
  flex-shrink: 0;
}
.card-body {
  flex: 1;
  min-width: 0;
  padding: 22rpx 24rpx 16rpx;
}
.card-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.4;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 12rpx;
}
.tag {
  font-size: 22rpx;
  line-height: 1.2;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
}
.card-sub {
  display: block;
  margin-top: 10rpx;
  color: #8a8a8a;
  font-size: 24rpx;
  line-height: 1.5;
}
.card-ops {
  display: flex;
  justify-content: flex-end;
  gap: 28rpx;
  margin-top: 8rpx;
}
.op-link {
  color: #2f6fed;
  font-size: 24rpx;
  padding: 8rpx 0;
}
.op-danger {
  color: #e34d59;
  font-size: 24rpx;
  padding: 8rpx 0;
}

.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  z-index: 99;
}
.sheet {
  width: 100%;
  border-radius: 24rpx 24rpx 0 0;
  box-sizing: border-box;
}
.sheet-panel {
  margin-bottom: 0;
  padding: 0;
  overflow: hidden;
}
.sheet-scroll {
  width: 100%;
}
.sheet-inner {
  padding: 28rpx 24rpx calc(32rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}
.sheet-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
}
.field-label {
  display: block;
  font-size: 24rpx;
  color: #8a8a8a;
  margin-bottom: 12rpx;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 20rpx;
}
.chip {
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  background: #f3f4f6;
  color: #4e5969;
  font-size: 24rpx;
}
.chip.on {
  background: #e8f0ff;
  color: #2f6fed;
  font-weight: 600;
}
.input,
.textarea {
  background: #f3f4f6;
  border-radius: 12rpx;
  padding: 0 20rpx;
  margin-bottom: 16rpx;
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  box-sizing: border-box;
  font-size: 28rpx;
}
.textarea {
  height: 160rpx;
  line-height: 1.5;
  padding: 16rpx 20rpx;
}
</style>
