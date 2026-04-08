import articleRegistry from '../data/article-registry.json'
import kpArticleMap from '../data/kp-article-map.json'

// slug → article object 查找表（惰性缓存）
let _slugIndex = null

function getSlugIndex() {
  if (!_slugIndex) {
    _slugIndex = {}
    for (const article of articleRegistry.articles) {
      _slugIndex[article.slug] = article
    }
  }
  return _slugIndex
}

/**
 * 获取与某个 KP 最相关的内部专栏文章（最多 2 篇）
 * 数据来源：kp-article-map.json（静态映射，按相关性排序）
 */
export function getArticlesForKp(kpId) {
  const slugs = kpArticleMap[kpId]
  if (!slugs) return []
  const index = getSlugIndex()
  return slugs.map(slug => index[slug]).filter(Boolean)
}
