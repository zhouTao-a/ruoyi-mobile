import { onPullDownRefresh, onUnload } from '@dcloudio/uni-app'

/**
 * 手机下拉刷新；浏览器里滚轮无效，需在页面顶部按住鼠标向下拖。
 */
export function useRefresh(loader) {
  let pulling = false
  let startY = 0
  let busy = false

  const run = async () => {
    if (busy) return
    busy = true
    try {
      await loader()
    } finally {
      busy = false
      uni.stopPullDownRefresh()
    }
  }

  onPullDownRefresh(run)

  const onDown = (event) => {
    if (window.scrollY > 2) return
    const target = event.target
    if (target && target.closest && target.closest('button,input,textarea,a')) return
    startY = event.clientY
    pulling = true
  }

  const onUp = (event) => {
    if (!pulling) return
    pulling = false
    if (window.scrollY <= 2 && event.clientY - startY > 70) run()
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    onUnload(() => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
    })
  }
}
