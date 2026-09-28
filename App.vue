<script setup>
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { getToken } from '@/utils/auth.js'
import { syncPhoneRemind } from '@/utils/phone-remind.js'

onLaunch(() => {
  // 冷启动时：无 token 则去登录页
  const token = getToken()
  if (!token) {
    uni.reLaunch({ url: '/pages/login/index' })
  }
  // 隐藏原生 tabBar，使用自定义 tabBar 组件（避免首帧闪烁）
  uni.hideTabBar({ animation: false })
})

onShow(() => {
  // 回到前台时刷新今日角标，并按下次提醒时间重登闹钟
  syncPhoneRemind()
})
</script>

<style lang="scss">
@import './uni.scss';

page {
  background-color: #f5f7fa;
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
  padding: 24rpx 24rpx 32rpx;
}

/* 卡片：常态轻浮，按下/激活更明显 */
.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(31, 35, 41, 0.05);
}

/* 主按钮：渐变 + 阴影 + 点按反馈 */
.btn-primary {
  background: linear-gradient(135deg, #4d8bff 0%, #2f6fed 100%);
  color: #fff;
  border: none;
  border-radius: 16rpx;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 30rpx;
  font-weight: 600;
  letter-spacing: 1rpx;
  box-shadow: 0 8rpx 20rpx rgba(47, 111, 237, 0.28);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.btn-primary:active {
  transform: scale(0.97);
  box-shadow: 0 4rpx 12rpx rgba(47, 111, 237, 0.22);
}
.btn-primary::after {
  border: none;
}

.muted {
  color: #8a8a8a;
  font-size: 24rpx;
}

/* 空状态：从一行冷字升级为 emoji + 文案 + 引导按钮的容器 */
.empty {
  text-align: center;
  color: #9aa0a6;
  padding: 80rpx 0;
  font-size: 26rpx;
}
.empty-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 96rpx 32rpx 80rpx;
}
.empty-emoji {
  font-size: 96rpx;
  line-height: 1;
  margin-bottom: 24rpx;
  opacity: 0.85;
}
.empty-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #4e5969;
  margin-bottom: 10rpx;
}
.empty-desc {
  font-size: 24rpx;
  color: #9aa0a6;
  margin-bottom: 32rpx;
}
.empty-action {
  min-width: 280rpx;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
}

.page-dock {
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}
.action-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}
/* 底部 dock：半透明毛玻璃 + 顶部分隔线，浮起感更强 */
.action-dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  margin: 0;
  padding: 16rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(24rpx);
  -webkit-backdrop-filter: blur(24rpx);
  border-top: 1px solid rgba(31, 35, 41, 0.06);
  box-shadow: 0 -4rpx 24rpx rgba(31, 35, 41, 0.06);
  box-sizing: border-box;
}
.action-bar button {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  margin: 0;
  font-size: 28rpx;
  font-weight: 600;
  border-radius: 16rpx;
  transition: transform 0.12s ease;
}
.action-bar button:active {
  transform: scale(0.96);
}
/* 次按钮：白底描边，弱化主次 */
.action-bar .btn-plain {
  flex: 0 0 auto;
  min-width: 140rpx;
  padding: 0 24rpx;
  background: #fff;
  color: #2f6fed;
  border: 1px solid #d6e4ff;
  box-shadow: 0 2rpx 8rpx rgba(47, 111, 237, 0.06);
}
.action-bar button::after {
  border: none;
}

.entry {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(31, 35, 41, 0.05);
  transition: transform 0.12s ease;
}
.entry:active {
  transform: scale(0.98);
}
.entry-mark {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
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
  letter-spacing: 0.5rpx;
}
.entry-desc {
  display: block;
  margin-top: 8rpx;
  color: #9aa0a6;
  font-size: 24rpx;
}
.entry-arrow {
  color: #c0c4cc;
  font-size: 40rpx;
  line-height: 1;
  margin-left: 12rpx;
}

/* 记录卡：左侧色条 + 主体 */
.record-card {
  display: flex;
  background: #fff;
  border-radius: 24rpx;
  margin-bottom: 0;
  overflow: hidden;
}
.record-card .bar {
  width: 8rpx;
  flex-shrink: 0;
}
.card-body {
  flex: 1;
  min-width: 0;
  padding: 24rpx 24rpx 22rpx;
}
.card-head {
  display: flex;
  align-items: flex-start;
}
.card-title {
  display: block;
  flex: 1;
  font-size: 32rpx;
  font-weight: 600;
  line-height: 1.4;
  color: #1f2329;
  letter-spacing: 0.5rpx;
}
/* 已完成态：标题半透明 + 删除线 */
.card-title.done {
  color: #9aa0a6;
  text-decoration: line-through;
}
.card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 14rpx;
}
/* 状态 chip：默认蓝色，可被 inline style 覆盖 */
.meta-chip {
  font-size: 22rpx;
  line-height: 1.2;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  background: #eef3ff;
  color: #2f6fed;
  font-weight: 600;
  letter-spacing: 0.5rpx;
}
.meta-text {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  color: #9aa0a6;
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
.fold {
  color: #389e0d;
  font-size: 32rpx;
  font-weight: 600;
  padding: 0 16rpx 0 0;
  line-height: 1.2;
}
.sub-record {
  margin: 8rpx 0 0 8rpx;
  padding: 12rpx 0;
  border-top: 1px solid #f0f0f0;
}

/* 弹层与底部 sheet */
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
  border-radius: 28rpx 28rpx 0 0;
  box-sizing: border-box;
  box-shadow: 0 -8rpx 32rpx rgba(31, 35, 41, 0.12);
}
.sheet-handle {
  width: 72rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: #d8dce3;
  margin: 16rpx auto 4rpx;
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
  padding: 24rpx 24rpx calc(32rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}
.sheet-title {
  font-size: 34rpx;
  font-weight: 700;
  text-align: center;
  margin-bottom: 28rpx;
  letter-spacing: 1rpx;
}

/* 表单分组：用小标题 + 分隔线把字段切成几块 */
.form-group {
  margin-bottom: 24rpx;
}
.group-title {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  font-weight: 600;
  color: #4e5969;
  margin: 4rpx 0 16rpx;
  letter-spacing: 0.5rpx;
}
.group-title::before {
  content: '';
  width: 6rpx;
  height: 24rpx;
  background: #2f6fed;
  border-radius: 4rpx;
  margin-right: 12rpx;
}

/* 字段标签：左对齐 + 必填红点 */
.field-label {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  color: #4e5969;
  margin: 8rpx 0 12rpx;
}
.field-label.req::after {
  content: '*';
  color: #e34d59;
  margin-left: 6rpx;
  font-size: 28rpx;
  line-height: 1;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 20rpx;
}
.chip {
  padding: 12rpx 24rpx;
  border-radius: 999rpx;
  background: #f4f6f8;
  color: #4e5969;
  font-size: 24rpx;
  transition: transform 0.12s ease;
}
.chip:active {
  transform: scale(0.94);
}
.chip.on {
  background: #e8f0ff;
  color: #2f6fed;
  font-weight: 600;
  box-shadow: 0 2rpx 8rpx rgba(47, 111, 237, 0.18);
}

/* 输入框：焦点态蓝色边框 + 轻发光 */
.input,
.textarea {
  background: #fff;
  border: 1px solid #e6e8ee;
  border-radius: 16rpx;
  padding: 0 24rpx;
  margin-bottom: 20rpx;
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  box-sizing: border-box;
  font-size: 28rpx;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.input:focus,
.textarea:focus {
  border-color: #2f6fed;
  box-shadow: 0 0 0 6rpx rgba(47, 111, 237, 0.12);
}
.textarea {
  height: 160rpx;
  line-height: 1.6;
  padding: 20rpx 24rpx;
}
.textarea.text-block {
  height: auto;
  min-height: 160rpx;
  line-height: 1.6;
  padding: 20rpx;
}
.picker-value {
  display: flex;
  align-items: center;
}
.picker-value.empty {
  color: #b0b4ba;
}

/* sheet 内底部吸底保存按钮 */
.sheet-submit {
  margin-top: 16rpx;
  width: 100%;
}
</style>
