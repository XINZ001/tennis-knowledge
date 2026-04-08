import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useMemo, useEffect, useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { Icon } from '../utils/icons'
import stopwordsData from '../data/search-stopwords.json'

/**
 * 多语言停用词表（中/英/韩 2645 词）— 搜索高亮时过滤掉无意义的匹配。
 * 数据来源：stopwords-iso (industry standard) + 自定义 CJK 搜索填充词。
 * 业界做法（Elasticsearch stop analyzer / Algolia query preprocessing）：
 * 在匹配前剥离停用词，只高亮有语义的词。
 */
const STOP_WORDS = new Set(stopwordsData.words)

/** 判断一个子串是否为停用词 */
function isStopWord(s) {
  return STOP_WORDS.has(s)
}

/**
 * 从内容中提取包含搜索词（或最接近的片段）的摘要，
 * 并返回 { before, match, after } 以便高亮渲染。
 *
 * 子串回退时会跳过停用词，避免 "怎么办" 之类的无意义匹配。
 */
function extractSnippet(content, query, maxLen = 80) {
  if (!content || !query) return null
  const text = content.replace(/\*\*/g, '').replace(/\n/g, ' ')

  // 1. 尝试完整 query 匹配
  let idx = text.toLowerCase().indexOf(query.toLowerCase())
  let matchLen = query.length

  // 2. 如果完整 query 没找到，尝试从最长子串开始找（跳过停用词）
  if (idx === -1) {
    for (let len = Math.min(query.length, 6); len >= 2; len--) {
      for (let start = 0; start <= query.length - len; start++) {
        const sub = query.slice(start, start + len)
        // 跳过停用词 — 这是关键改动
        if (isStopWord(sub)) continue
        const found = text.toLowerCase().indexOf(sub.toLowerCase())
        if (found !== -1) {
          idx = found
          matchLen = len
          break
        }
      }
      if (idx !== -1) break
    }
  }

  if (idx === -1) return null

  // 3. 截取匹配点前后的上下文
  const halfCtx = Math.floor((maxLen - matchLen) / 2)
  let ctxStart = Math.max(0, idx - halfCtx)
  let ctxEnd = Math.min(text.length, idx + matchLen + halfCtx)

  // 对齐到标点或空格，避免截断词
  if (ctxStart > 0) {
    const punctIdx = text.lastIndexOf('。', idx)
    const commaIdx = text.lastIndexOf('，', idx)
    const best = Math.max(punctIdx, commaIdx)
    if (best > ctxStart - 15 && best > 0) ctxStart = best + 1
  }

  const before = (ctxStart > 0 ? '…' : '') + text.slice(ctxStart, idx)
  const match = text.slice(idx, idx + matchLen)
  const after = text.slice(idx + matchLen, ctxEnd) + (ctxEnd < text.length ? '…' : '')

  return { before, match, after }
}

/** 渲染高亮摘要 */
function Snippet({ content, query }) {
  const snippet = extractSnippet(content, query)
  if (!snippet) return null
  return (
    <p className="text-xs text-text-secondary mt-1.5 line-clamp-2 leading-relaxed">
      {snippet.before}
      <mark className="bg-amber-100 text-amber-900 rounded-sm px-0.5 font-medium">{snippet.match}</mark>
      {snippet.after}
    </p>
  )
}

const TYPE_FILTERS = [
  { key: 'all', label: { zh: '全部', en: 'All', ko: '전체' }, icon: null },
  { key: 'kp', label: { zh: '知识点', en: 'Knowledge', ko: '지식' }, icon: 'book' },
  { key: 'article', label: { zh: '专栏', en: 'Articles', ko: '칼럼' }, icon: 'fileText' },
  { key: 'athlete', label: { zh: '名人堂', en: 'Hall of Fame', ko: '명예의 전당' }, icon: 'trophy' },
]

function getResultRoute(item) {
  if (item._type === 'article') return `/articles/${item.slug}`
  if (item._type === 'athlete') return `/hall-of-fame/${item.slug}`
  return `/section/${item.sectionSlug}/${item.subSectionSlug}#${item.id}`
}

function getResultMeta(item, lang) {
  if (item._type === 'article') {
    const catTitle = lang === 'zh' ? item.categoryTitle_zh : lang === 'en' ? item.categoryTitle_en : (item.categoryTitle_ko || item.categoryTitle_en)
    return catTitle + (item.readingTime ? ` · ${item.readingTime} min` : '')
  }
  if (item._type === 'athlete') {
    return lang === 'zh' ? item.terms_zh : lang === 'en' ? item.terms_en : (item.terms_ko || item.terms_en)
  }
  // KP
  const section = lang === 'zh' ? item.sectionTitle_zh : lang === 'en' ? item.sectionTitle_en : (item.sectionTitle_ko || item.sectionTitle_en)
  const sub = lang === 'zh' ? item.subTitle_zh : lang === 'en' ? item.subTitle_en : (item.subTitle_ko || item.subTitle_en)
  return `${section} · ${sub}`
}

function getTypeIcon(type) {
  if (type === 'article') return 'fileText'
  if (type === 'athlete') return 'trophy'
  return 'book'
}

function getTypeColor(type) {
  if (type === 'article') return 'text-teal'
  if (type === 'athlete') return 'text-gold'
  return 'text-forest'
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [inputValue, setInputValue] = useState(query)
  const { search, searchSuggest, searchReady, lang } = useApp()
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()
  const inputRef = useRef(null)

  // URL 的 query 变了，同步到输入框
  useEffect(() => {
    setInputValue(query)
  }, [query])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() })
      setFilter('all')
    }
  }

  const results = useMemo(() => {
    if (!query.trim()) return []
    return search(query)
  }, [query, search])

  const filteredResults = useMemo(() => {
    if (filter === 'all') return results
    return results.filter(r => r.item._type === filter)
  }, [results, filter])

  // 按类型分组
  const grouped = useMemo(() => {
    const groups = {}
    filteredResults.forEach(r => {
      const type = r.item._type || 'kp'
      if (!groups[type]) groups[type] = []
      groups[type].push(r)
    })
    return groups
  }, [filteredResults])

  // 各类型数量
  const counts = useMemo(() => {
    const c = { all: results.length, kp: 0, article: 0, athlete: 0 }
    results.forEach(r => {
      const type = r.item._type || 'kp'
      if (c[type] !== undefined) c[type]++
    })
    return c
  }, [results])

  // Looser suggestions shown only when main search returns nothing
  const suggestions = useMemo(() => {
    if (!searchReady || results.length > 0 || !query.trim()) return []
    return searchSuggest(query)
  }, [searchReady, results, query, searchSuggest])

  // Log failed queries
  useEffect(() => {
    if (searchReady && results.length === 0 && query.trim()) {
      try {
        const failed = JSON.parse(localStorage.getItem('failedSearches') || '[]')
        if (!failed.includes(query.trim())) {
          failed.push(query.trim())
          localStorage.setItem('failedSearches', JSON.stringify(failed.slice(-100)))
        }
      } catch { /* ignore */ }
    }
  }, [searchReady, results, query])

  // 展开/折叠状态：每个类型独立控制
  const [expanded, setExpanded] = useState({})

  // 当搜索词变化时重置展开状态
  useEffect(() => {
    setExpanded({})
  }, [query])

  const groupDefs = [
    { type: 'kp', label: { zh: '知识点', en: 'Knowledge Points', ko: '지식 포인트' }, icon: 'book' },
    { type: 'article', label: { zh: '专栏文章', en: 'Articles', ko: '칼럼' }, icon: 'fileText' },
    { type: 'athlete', label: { zh: '名人堂', en: 'Hall of Fame', ko: '명예의 전당' }, icon: 'trophy' },
  ]

  // 按每组最佳结果的相关性动态排序：分数越低（Fuse.js 中 0=完美匹配）排越前
  const groupOrder = useMemo(() => {
    return [...groupDefs].sort((a, b) => {
      const aItems = grouped[a.type]
      const bItems = grouped[b.type]
      // 没有结果的排到最后
      if (!aItems?.length && !bItems?.length) return 0
      if (!aItems?.length) return 1
      if (!bItems?.length) return -1
      // 取每组第一条（已按分数排序）的 score + precision
      const aTop = aItems[0]
      const bTop = bItems[0]
      const aScore = (aTop.score || 0) + (aTop._precision || 0) * 0.0001
      const bScore = (bTop.score || 0) + (bTop._precision || 0) * 0.0001
      return aScore - bScore
    })
  }, [grouped])

  // 有结果的分组数量 — 如果只有一个栏目就全展开，不折叠
  const activeGroupCount = groupOrder.filter(g => grouped[g.type]?.length > 0).length
  const COLLAPSE_LIMIT = 3

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 搜索框 — 桌面端居中展示，最大 640px */}
      <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto mb-6">
        <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={lang === 'zh' ? '搜索知识点、专栏...' : lang === 'en' ? 'Search knowledge, articles...' : '지식, 칼럼 검색...'}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-stone-border text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors shadow-sm"
          autoFocus
        />
      </form>

      {query && (
        <p className="text-sm text-text-secondary mb-4">
          "{query}" — {lang === 'zh' ? `找到 ${results.length} 个结果` : lang === 'en' ? `${results.length} results found` : `${results.length}개 결과`}
        </p>
      )}

      {/* 类型筛选标签 */}
      {results.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {TYPE_FILTERS.map(f => {
            const count = counts[f.key]
            if (f.key !== 'all' && count === 0) return null
            const active = filter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-forest-light text-forest'
                    : 'bg-stone-bg text-text-secondary hover:bg-stone-hover'
                }`}
              >
                {f.icon && <Icon name={f.icon} size={13} />}
                {f.label[lang] || f.label.zh}
                <span className={`text-xs ${active ? 'text-forest/70' : 'text-text-secondary/60'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {!searchReady && (
        <p className="text-sm text-text-secondary py-8 text-center">
          {lang === 'zh' ? '搜索索引加载中...' : lang === 'en' ? 'Loading search index...' : '검색 인덱스 로딩 중...'}
        </p>
      )}

      {searchReady && results.length === 0 && query && (
        <div className="text-center py-10 text-text-secondary">
          <p>{lang === 'zh' ? `未找到与 "${query}" 相关的结果` : lang === 'en' ? `No results found for "${query}"` : `"${query}"에 대한 결과를 찾을 수 없습니다`}</p>
          <p className="text-xs mt-2">
            {lang === 'zh' ? '尝试使用不同的关键词，或切换中英文搜索' : lang === 'en' ? 'Try different keywords, or switch between Chinese and English' : '다른 키워드를 시도하거나 언어를 전환해 보세요'}
          </p>

          {suggestions.length > 0 && (
            <div className="mt-6 text-left max-w-sm mx-auto">
              <p className="text-xs font-semibold text-text-secondary mb-2">
                {lang === 'zh' ? '你是否在找：' : lang === 'en' ? 'Did you mean:' : '혹시 찾으시는 건:'}
              </p>
              <div className="space-y-1.5">
                {suggestions.map(r => (
                  <Link
                    key={r.item.id}
                    to={getResultRoute(r.item)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-card border border-stone-border hover:border-forest/40 transition-colors text-sm"
                  >
                    <Icon name={getTypeIcon(r.item._type)} size={14} className={getTypeColor(r.item._type)} />
                    <span className="font-medium">
                      {lang === 'zh' ? r.item.title_zh : lang === 'en' ? r.item.title_en : (r.item.title_ko || r.item.title_en)}
                    </span>
                    <span className="text-xs text-text-secondary ml-auto">
                      {getResultMeta(r.item, lang)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 分组结果 */}
      <div className="space-y-8">
        {groupOrder.map(({ type, label, icon }) => {
          const items = grouped[type]
          if (!items || items.length === 0) return null

          // 折叠逻辑：只有多栏目有结果时才折叠，且该栏目超过 3 条才需要
          const shouldCollapse = activeGroupCount >= 2 && items.length > COLLAPSE_LIMIT
          const isExpanded = expanded[type]
          const visibleItems = shouldCollapse && !isExpanded ? items.slice(0, COLLAPSE_LIMIT) : items
          const hiddenCount = items.length - COLLAPSE_LIMIT

          return (
            <div key={type}>
              <h2 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-1.5">
                <Icon name={icon} size={14} />
                {label[lang] || label.zh}
                <span className="text-text-secondary/50 ml-1">{items.length}</span>
              </h2>
              <div className="space-y-2">
                {visibleItems.map(r => (
                  <Link
                    key={r.item.id}
                    to={getResultRoute(r.item)}
                    className="card-hover flex items-center gap-3 bg-stone-card rounded-lg border border-stone-border p-4 hover:border-forest/30 transition-colors"
                  >
                    {r.item._type === 'article' && r.item.emoji && (
                      <span className="text-lg shrink-0">{r.item.emoji}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {lang === 'zh' ? r.item.title_zh : lang === 'en' ? r.item.title_en : (r.item.title_ko || r.item.title_en)}
                      </div>
                      <div className="text-xs text-text-secondary mt-1">
                        {getResultMeta(r.item, lang)}
                      </div>
                      <Snippet
                        content={lang === 'zh' ? r.item.content_zh : lang === 'en' ? r.item.content_en : (r.item.content_ko || r.item.content_en)}
                        query={query}
                      />
                    </div>
                    <Icon name="chevronRight" size={14} className="text-text-secondary shrink-0" />
                  </Link>
                ))}

                {/* 展开/收起按钮 */}
                {shouldCollapse && (
                  <button
                    onClick={() => setExpanded(prev => ({ ...prev, [type]: !prev[type] }))}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium text-text-secondary hover:text-forest hover:bg-forest-light/50 transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        {lang === 'zh' ? '收起' : lang === 'en' ? 'Show less' : '접기'}
                        <Icon name="chevronUp" size={12} />
                      </>
                    ) : (
                      <>
                        {lang === 'zh' ? `展开剩余 ${hiddenCount} 个结果` : lang === 'en' ? `Show ${hiddenCount} more` : `나머지 ${hiddenCount}개 보기`}
                        <Icon name="chevronDown" size={12} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
