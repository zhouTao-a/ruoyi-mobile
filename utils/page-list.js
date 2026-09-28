import { ref } from 'vue'
import { onReachBottom, onUnload } from '@dcloudio/uni-app'
import { useRefresh } from '@/utils/refresh.js'
import { readCache, writeCache } from '@/utils/list-cache.js'

/**
 * 列表分页：下拉从第 1 页重取，滑到底或在底部上拉再取下一页。
 * count / seen 用来按「顶级条数」判断是否还有下一页（目标的子节点不计入页大小）。
 * cacheKey：开启缓存优先；首次渲染先用本地缓存填充 list，refresh 成功后回写。
 * firstLoaded：首次拉取完成前为 false，页面据此显示骨架屏而非"暂无xxx"。
 */
export function usePagedList(fetchPage, options = {}) {
  const pageSize = options.pageSize || 50
  const cacheKey = options.cacheKey || ''
  const list = ref(cacheKey ? readCache(cacheKey) : [])
  const firstLoaded = ref(false)
  const loadingMore = ref(false)
  const finished = ref(false)
  let pageNum = 1
  let refreshing = false
  let seq = 0

  const load = async (reset) => {
    if (!reset && (finished.value || loadingMore.value || refreshing)) return
    if (reset && refreshing) return
    const ticket = ++seq
    if (reset) {
      pageNum = 1
      finished.value = false
      refreshing = true
    } else {
      loadingMore.value = true
    }
    try {
      const res = await fetchPage({ pageNum, pageSize })
      if (ticket !== seq) return
      const rows = res.rows || res.data || []
      const total = Number(res.total || 0)
      const added = options.count ? options.count(rows) : rows.length
      list.value = reset ? rows : list.value.concat(rows)
      const seen = options.seen ? options.seen(list.value) : list.value.length
      if (!added || added < pageSize || (total > 0 && seen >= total)) {
        finished.value = true
      } else {
        pageNum += 1
      }
      if (options.afterLoad) options.afterLoad(reset)
      // 首页拉取成功后回写缓存，供下次秒开
      if (reset && cacheKey) writeCache(cacheKey, list.value)
    } finally {
      if (ticket === seq) {
        loadingMore.value = false
        refreshing = false
        firstLoaded.value = true
        uni.stopPullDownRefresh()
      }
    }
  }

  const refresh = () => load(true)
  const loadMore = () => load(false)

  onReachBottom(loadMore)
  useRefresh(refresh)

  // 浏览器滚到底后，按住向上拖一截再加载下一页
  let startY = 0
  let pulling = false
  const nearBottom = () => {
    const doc = document.documentElement
    return window.innerHeight + window.scrollY >= doc.scrollHeight - 80
  }
  const onDown = (event) => {
    startY = event.clientY
    pulling = true
  }
  const onUp = (event) => {
    if (!pulling) return
    pulling = false
    if (startY - event.clientY > 70 && nearBottom()) loadMore()
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    onUnload(() => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
    })
  }

  return { list, loadingMore, finished, refresh, loadMore, firstLoaded }
}
