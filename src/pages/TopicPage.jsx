import { useParams, Link } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import Breadcrumb from '../components/content/Breadcrumb'
import KnowledgePoint from '../components/content/KnowledgePoint'
import { useUserRegion } from '../hooks/useUserRegion'
import { filterAndRankVideos } from '../utils/videoFilter'
import videosData from '../data/videos.json'
import illustrationRegistry from '../data/illustration-registry.json'
import PageSEO from '../components/PageSEO'

export default function TopicPage() {
  const { sectionSlug, subSlug } = useParams()
  const { sections, loadSectionData, t, lang } = useApp()
  const [sectionData, setSectionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { isMainlandChina, loading: regionLoading } = useUserRegion()
  const [activeKpId, setActiveKpId] = useState(null)

  const section = sections.find(s => s.slug === sectionSlug)
  const subMeta = section?.subSections.find(s => s.slug === subSlug)

  useEffect(() => {
    if (!section) return
    setLoading(true)
    loadSectionData(section.id).then(data => {
      setSectionData(data)
      setLoading(false)
    })
  }, [section, loadSectionData])

  if (!section || !subMeta) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-xl font-semibold mb-2">
          {lang === 'zh' ? '未找到该页面' : lang === 'en' ? 'Page not found' : '페이지를 찾을 수 없습니다'}
        </h1>
        <Link to="/" className="text-forest hover:underline text-sm">
          {lang === 'zh' ? '返回首页' : lang === 'en' ? 'Back to Home' : '홈으로 돌아가기'}
        </Link>
      </div>
    )
  }

  const subData = sectionData?.subSections?.find(s => s.slug === subSlug)
  const knowledgePoints = subData?.knowledgePoints || []

  // Deduplicate videos across KPs on the same page
  const videosPerKp = useMemo(() => {
    if (regionLoading || knowledgePoints.length === 0) return {}
    const seenUrls = new Set()
    const result = {}
    for (const kp of knowledgePoints) {
      const ranked = filterAndRankVideos(videosData[kp.id] || [], isMainlandChina, lang)
      const deduped = ranked.filter(v => !seenUrls.has(v.url))
      deduped.forEach(v => seenUrls.add(v.url))
      result[kp.id] = deduped
    }
    return result
  }, [knowledgePoints, isMainlandChina, lang, regionLoading])

  // Scroll to hash on load — 直接跳转，避免 smooth 滚动过程中被懒加载图片偏移
  useEffect(() => {
    if (!loading && window.location.hash) {
      const id = window.location.hash.slice(1)
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
    }
  }, [loading])

  // Intersection Observer: track which KP is currently in view (desktop TOC highlight)
  useEffect(() => {
    if (loading || knowledgePoints.length <= 1) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveKpId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )
    for (const kp of knowledgePoints) {
      const el = document.getElementById(kp.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [loading, knowledgePoints])

  const topicTitle = subMeta ? (lang === 'zh' ? subMeta.title.zh : lang === 'en' ? subMeta.title.en : (subMeta.title.ko || subMeta.title.en)) : ''
  const sectionTitle = section ? (lang === 'zh' ? section.title.zh : lang === 'en' ? section.title.en : (section.title.ko || section.title.en)) : ''

  const showToc = knowledgePoints.length > 1

  return (
    <div className="relative max-w-4xl mx-auto px-4 py-6">
      <PageSEO
        title={`${topicTitle} — ${sectionTitle}`}
        description={lang === 'zh'
          ? `攀岩知识库「${sectionTitle}」模块：${topicTitle}的详细讲解与实用技巧。`
          : lang === 'en'
          ? `Climbing Knowledge Base — ${sectionTitle}: detailed guide and practical tips on ${topicTitle}.`
          : `클라이밍 지식 라이브러리 — ${sectionTitle}: ${topicTitle}에 대한 상세 가이드와 실용 팁.`}
        path={`/section/${sectionSlug}/${subSlug}`}
      />

      <Breadcrumb section={section} subSection={subMeta} />

      {/* Hero 标题卡片 */}
      <div className="mt-6 rounded-2xl bg-forest-light/40 border border-forest/10 px-6 sm:px-8 py-7 sm:py-9">
        <div className="text-xs font-semibold text-forest uppercase tracking-wider mb-2">
          {t(section.title)}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {t(subMeta.title)}
        </h1>
        {/* 英文副标题 —— 保留数据，UI 隐藏 */}
        {subMeta.title.en && (
          <p className="hidden">{subMeta.title.en}</p>
        )}
        {subData?.overview && (
          <p className="text-text-secondary mt-4 text-base leading-relaxed max-w-2xl">
            {t(subData.overview)}
          </p>
        )}

        {/* 移动端内联目录 — 嵌入 Hero 卡片底部 */}
        {showToc && (
          <nav className="xl:hidden mt-5 pt-5 border-t border-forest/10">
            <h2 className="text-[11px] font-semibold text-forest/60 uppercase tracking-wider mb-2">
              {lang === 'zh' ? '目录' : lang === 'en' ? 'Contents' : '목차'}
            </h2>
            <ul className="space-y-1">
              {knowledgePoints.map(kp => (
                <li key={kp.id}>
                  <a
                    href={`#${kp.id}`}
                    className="text-sm text-text-secondary hover:text-forest transition-colors"
                  >
                    {t(kp.title)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {/* 知识点列表 */}
      <div className="mt-10">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-6 bg-stone-border rounded w-1/3 mb-3" />
                <div className="h-3 bg-stone-border rounded w-full mb-2" />
                <div className="h-3 bg-stone-border rounded w-4/5 mb-2" />
                <div className="h-3 bg-stone-border rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : knowledgePoints.length > 0 ? (
          <div className="space-y-5 sm:space-y-16">
            {knowledgePoints.map((kp, idx) => (
              <div key={kp.id}>
                {/* 桌面端分隔线（第一个不显示） */}
                {idx > 0 && (
                  <div className="hidden sm:block mb-8">
                    <div className="h-px bg-stone-border" />
                  </div>
                )}
                {/* 手机端：卡片容器 | 桌面端：无容器 */}
                <div className="rounded-2xl border border-stone-border bg-stone-card p-4 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
                  <KnowledgePoint
                    point={kp}
                    videos={videosPerKp[kp.id] || []}
                    illustrations={illustrationRegistry[kp.id]}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-text-secondary">
            <p className="text-sm">
              {lang === 'zh' ? '该分类的内容正在建设中' : lang === 'en' ? 'Content for this category is under construction' : '이 카테고리의 콘텐츠는 준비 중입니다'}
            </p>
            <Link to={`/section/${sectionSlug}`} className="text-forest hover:underline text-sm mt-2 inline-block">
              {lang === 'zh' ? '返回' : lang === 'en' ? 'Back to' : '돌아가기:'} {t(section.title)}
            </Link>
          </div>
        )}
      </div>

      {/* 桌面端右侧 sticky 目录 — 绝对定位，撑满父容器高度让 sticky 生效 */}
      {showToc && (
        <aside className="hidden xl:block absolute top-0 bottom-0 left-full ml-8 w-48" style={{ pointerEvents: 'none' }}>
          <nav className="sticky top-20" style={{ pointerEvents: 'auto' }}>
            <h2 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-3">
              {lang === 'zh' ? '目录' : lang === 'en' ? 'Contents' : '목차'}
            </h2>
            <ul className="space-y-0.5 border-l border-stone-border">
              {knowledgePoints.map(kp => {
                const isActive = activeKpId === kp.id
                return (
                  <li key={kp.id}>
                    <a
                      href={`#${kp.id}`}
                      className={`block pl-3 py-1 text-[13px] leading-snug transition-colors border-l-2 -ml-px ${
                        isActive
                          ? 'border-forest text-forest font-medium'
                          : 'border-transparent text-text-secondary hover:text-text-primary hover:border-stone-border'
                      }`}
                    >
                      {t(kp.title)}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>
      )}

      {/* 上下导航 */}
      <div className="mt-14 flex justify-between items-center border-t border-stone-border pt-5">
        {(() => {
          const idx = section.subSections.findIndex(s => s.slug === subSlug)
          const prev = idx > 0 ? section.subSections[idx - 1] : null
          const next = idx < section.subSections.length - 1 ? section.subSections[idx + 1] : null
          return (
            <>
              {prev ? (
                <Link to={`/section/${sectionSlug}/${prev.slug}`} className="text-sm text-forest hover:underline">
                  ← {t(prev.title)}
                </Link>
              ) : <span />}
              {next ? (
                <Link to={`/section/${sectionSlug}/${next.slug}`} className="text-sm text-forest hover:underline">
                  {t(next.title)} →
                </Link>
              ) : <span />}
            </>
          )
        })()}
      </div>
    </div>
  )
}
