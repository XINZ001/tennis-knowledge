import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import kpRegistry from '../../data/kp-registry.json'

// 复用 KpLink 的跳转逻辑：navigate to /section/{slug}/{subSlug}#{kp-id}

/**
 * 热门知识点双行 marquee 滚动标签
 * - 上排向左滚动，下排向右滚动
 * - hover 整个区域时两排立即停住（无跳动）
 * - 使用 requestAnimationFrame 手动驱动，避免 CSS animation 暂停跳帧
 */

// KP 标签：点击直接跳转到知识点
const ROW1_KPS = [
  'kp-0203', 'kp-0601', 'kp-0207', 'kp-0402',
]
const ROW2_KPS = [
  'kp-0711', 'kp-0806', 'kp-0704', 'kp-0109',
]

// 搜索词标签：点击跳转到搜索结果页，口语化、接地气
// sectionId 用于染色，与对应知识领域一致
// q: { zh, en, ko } — 显示文案 & 搜索关键词均按当前语言
const ROW1_QUERIES = [
  { q: { zh: '怎么选拍', en: 'how to choose racket', ko: '라켓 선택법' }, emoji: '🎾', sectionId: 'section-06' },
  { q: { zh: '发球技巧', en: 'serve technique', ko: '서브 기술' }, emoji: '🔥', sectionId: 'section-02' },
  { q: { zh: '上旋怎么打', en: 'topspin technique', ko: '탑스핀 치는 법' }, emoji: '🌀', sectionId: 'section-02' },
  { q: { zh: '网球肘', en: 'tennis elbow', ko: '테니스 엘보' }, emoji: '🩹', sectionId: 'section-07' },
  { q: { zh: '双打站位', en: 'doubles positioning', ko: '복식 포지셔닝' }, emoji: '🤝', sectionId: 'section-04' },
]
const ROW2_QUERIES = [
  { q: { zh: '反手总打不好', en: 'backhand problems', ko: '백핸드가 안 돼요' }, emoji: '😤', sectionId: 'section-02' },
  { q: { zh: '比赛紧张', en: 'match nerves', ko: '경기 긴장' }, emoji: '😰', sectionId: 'section-05' },
  { q: { zh: '截击怎么练', en: 'volley drills', ko: '발리 연습' }, emoji: '⚡', sectionId: 'section-02' },
  { q: { zh: '零基础入门', en: 'beginner guide', ko: '초보자 가이드' }, emoji: '🌱', sectionId: 'section-01' },
  { q: { zh: '穿线磅数', en: 'string tension', ko: '스트링 텐션' }, emoji: '🧵', sectionId: 'section-06' },
]

function hexToRgba(hex, alpha) {
  const n = hex.replace('#', '')
  const v = n.length === 3 ? n.split('').map(c => c + c).join('') : n
  const int = Number.parseInt(v, 16)
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`
}

/**
 * 用 rAF 驱动的 marquee 行
 * direction: 'left' | 'right'
 * speed: px per second
 */
function MarqueeRow({ items, direction, paused, onClickItem }) {
  const trackRef = useRef(null)
  const offsetRef = useRef(0)       // 当前偏移（px）
  const prevTimeRef = useRef(null)
  const rafRef = useRef(null)
  const halfWidthRef = useRef(0)
  const speed = 25 // px/s

  // 测量半宽（一份内容的宽度）用于无缝循环
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    // 总宽度 = 两份内容，取一半
    halfWidthRef.current = track.scrollWidth / 2
  })

  const tick = useCallback((timestamp) => {
    if (prevTimeRef.current === null) {
      prevTimeRef.current = timestamp
    }
    const delta = (timestamp - prevTimeRef.current) / 1000 // seconds
    prevTimeRef.current = timestamp

    if (!paused) {
      const move = speed * delta
      if (direction === 'left') {
        offsetRef.current -= move
        // 当滚过一整份内容时重置，实现无缝
        if (halfWidthRef.current > 0 && offsetRef.current <= -halfWidthRef.current) {
          offsetRef.current += halfWidthRef.current
        }
      } else {
        offsetRef.current += move
        if (halfWidthRef.current > 0 && offsetRef.current >= 0) {
          offsetRef.current -= halfWidthRef.current
        }
      }
    }

    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${offsetRef.current}px)`
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [paused, direction])

  useEffect(() => {
    // 右行初始偏移：从 -halfWidth 开始
    if (direction === 'right' && offsetRef.current === 0 && halfWidthRef.current > 0) {
      offsetRef.current = -halfWidthRef.current
    }
    prevTimeRef.current = null
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [tick, direction])

  return (
    <div className="overflow-hidden relative py-1">
      {/* 左右渐隐遮罩 — inset-y 用负值覆盖 py-1 的 padding，确保遮罩全高 */}
      <div className="pointer-events-none absolute -inset-y-1 left-0 w-12 z-10 bg-gradient-to-r from-stone-bg to-transparent" />
      <div className="pointer-events-none absolute -inset-y-1 right-0 w-12 z-10 bg-gradient-to-l from-stone-bg to-transparent" />

      <div
        ref={trackRef}
        className="flex gap-3 w-max will-change-transform"
      >
        {[...items, ...items].map((item, i) => (
          <button
            key={`${item.id}-${i}`}
            onClick={() => onClickItem(item.route)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all duration-150 cursor-pointer hover:scale-105 hover:shadow-sm"
            style={{
              backgroundColor: hexToRgba(item.color, 0.10),
              borderColor: hexToRgba(item.color, 0.25),
              color: item.color,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = hexToRgba(item.color, 0.20)
              e.currentTarget.style.borderColor = hexToRgba(item.color, 0.45)
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = hexToRgba(item.color, 0.10)
              e.currentTarget.style.borderColor = hexToRgba(item.color, 0.25)
            }}
          >
            {item.emoji ? `${item.emoji} ` : ''}{item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function TrendingKPs() {
  const { sections, lang } = useApp()
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  const colorMap = useMemo(() => {
    const map = {}
    for (const s of sections) {
      map[s.id] = s.color
    }
    return map
  }, [sections])

  // 将 KP ID 列表解析为标签对象
  const resolveKps = (ids) =>
    ids
      .map((id) => {
        const kp = kpRegistry.knowledgePoints.find((k) => k.id === id)
        if (!kp) return null
        return {
          id: kp.id,
          label: lang === 'zh' ? kp.title.zh : lang === 'en' ? kp.title.en : (kp.title.ko || kp.title.en),
          color: colorMap[kp.sectionId] || '#4A7C59',
          route: `/section/${kp.sectionSlug}/${kp.subSectionSlug}#${kp.id}`,
        }
      })
      .filter(Boolean)

  // 将搜索词列表解析为标签对象（按当前语言）
  const resolveQueries = (queries) =>
    queries.map((item) => {
      const text = item.q[lang] || item.q.zh
      return {
        id: `q-${item.q.zh}`,
        label: text,
        emoji: item.emoji || '',
        color: colorMap[item.sectionId] || '#4A7C59',
        route: `/search?q=${encodeURIComponent(text)}`,
      }
    })

  // 交错合并 KP 标签和搜索词标签：KP, Query, KP, Query, ...
  const interleave = (kps, queries) => {
    const result = []
    const maxLen = Math.max(kps.length, queries.length)
    for (let i = 0; i < maxLen; i++) {
      if (i < kps.length) result.push(kps[i])
      if (i < queries.length) result.push(queries[i])
    }
    return result
  }

  const row1 = useMemo(() => interleave(resolveKps(ROW1_KPS), resolveQueries(ROW1_QUERIES)), [lang, colorMap])
  const row2 = useMemo(() => interleave(resolveKps(ROW2_KPS), resolveQueries(ROW2_QUERIES)), [lang, colorMap])

  const handleClick = useCallback((route) => navigate(route), [navigate])

  if (row1.length === 0 && row2.length === 0) return null

  return (
    <div
      className="mt-5 max-w-lg mx-auto flex flex-col gap-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {row1.length > 0 && (
        <MarqueeRow items={row1} direction="left" paused={hovered} onClickItem={handleClick} />
      )}
      {row2.length > 0 && (
        <MarqueeRow items={row2} direction="right" paused={hovered} onClickItem={handleClick} />
      )}
    </div>
  )
}
