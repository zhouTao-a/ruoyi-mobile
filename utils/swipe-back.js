/** 列表页从左向右滑，返回上一层 */
export function useSwipeBack() {
  let startX = 0
  let startY = 0

  const onBackStart = (e) => {
    const t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0])
    if (!t) return
    startX = t.clientX
    startY = t.clientY
  }

  const onBackEnd = (e) => {
    const t = e.changedTouches && e.changedTouches[0]
    if (!t) return
    const dx = t.clientX - startX
    const dy = t.clientY - startY
    if (dx <= 70 || dx <= Math.abs(dy)) return
    uni.navigateBack({ fail() {} })
  }

  return { onBackStart, onBackEnd }
}
