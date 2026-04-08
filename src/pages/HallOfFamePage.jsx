import { useMemo, useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import PageSEO from '../components/PageSEO'
import {
  getHallOfFameAthletes,
  getHallOfFameMedia,
  hallOfFameMainCategories,
  athleteMatchesMainSub
} from '../utils/hallOfFame'

function hexToRgba(hex, alpha) {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized
  const int = Number.parseInt(value, 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// 一级分类 pill 筛选（去掉二级子分类）
const FILTER_KEYS = ['all', 'elite', 'explorer', 'legend', 'innovator', 'chinese-rep']

export default function HallOfFamePage() {
  const { t, lang } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const athletes = useMemo(() => getHallOfFameAthletes(), [])

  // 从 URL ?category= 读取初始筛选，无效值回退到 'all'
  const categoryParam = searchParams.get('category')
  const initialFilter = FILTER_KEYS.includes(categoryParam) ? categoryParam : 'all'
  const [activeFilter, setActiveFilter] = useState(initialFilter)

  // URL 变化时同步筛选状态（侧边栏点击不同分类）
  useEffect(() => {
    const param = searchParams.get('category')
    if (param && FILTER_KEYS.includes(param) && param !== activeFilter) {
      setActiveFilter(param)
    }
  }, [searchParams])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return athletes
    return athletes.filter((a) => athleteMatchesMainSub(a, activeFilter, ''))
  }, [athletes, activeFilter])

  return (
    <div className="relative">
      <PageSEO
        title={lang === 'zh' ? '攀岩名人堂' : lang === 'en' ? 'Climbing Hall of Fame' : '클라이밍 명예의 전당'}
        description={lang === 'zh'
          ? '从竞技巨星到传奇先驱，了解塑造攀岩运动的伟大攀岩者们的故事与成就。'
          : lang === 'en'
          ? 'From competitive stars to legendary pioneers — stories and achievements of the greatest climbers.'
          : '경쟁 스타부터 전설적인 선구자까지 — 위대한 클라이머들의 이야기와 업적.'}
        path="/hall-of-fame"
      />
      {/* 全景渐变背景 */}
      <div className="absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top_left,_rgba(74,124,89,0.18),_transparent_50%),radial-gradient(circle_at_top_right,_rgba(199,161,42,0.18),_transparent_45%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-[240px] h-[80px] bg-gradient-to-b from-transparent to-stone-bg pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-8">
        <div className="max-w-3xl mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {lang === 'zh' ? '攀岩名人堂' : lang === 'en' ? 'Climbing Hall of Fame' : '클라이밍 명예의 전당'}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-text-secondary leading-relaxed">
            {lang === 'zh'
              ? '收录攀岩历史与当代最具代表性的人物，集中展示他们的成就、风格、访谈与影像。'
              : lang === 'en'
              ? 'A curated Hall of Fame featuring defining figures from climbing history and the modern era.'
              : '클라이밍 역사와 현대를 대표하는 인물들의 업적, 스타일, 인터뷰, 영상을 모았습니다.'}
          </p>
        </div>

      {/* 筛选 pill */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_KEYS.map((key) => {
          const cat = hallOfFameMainCategories[key]
          if (!cat) return null
          const label = lang === 'zh' ? cat.zh : lang === 'en' ? cat.en : (cat.ko || cat.en)
          const isActive = activeFilter === key
          const count = key === 'all'
            ? athletes.length
            : athletes.filter((a) => athleteMatchesMainSub(a, key, '')).length
          return (
            <button
              key={key}
              onClick={() => { setActiveFilter(key); setSearchParams(key === 'all' ? {} : { category: key }, { replace: true }) }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-forest text-white'
                  : 'bg-stone-card border border-stone-border text-text-secondary hover:border-forest/40 hover:text-text-primary'
              }`}
            >
              {label}
              <span className={`ml-1.5 ${isActive ? 'text-white/70' : 'text-text-secondary/60'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* 人数 */}
      <div className="mb-4 text-sm text-text-secondary">
        {filtered.length > 0
          ? (lang === 'zh' ? `共 ${filtered.length} 位人物` : lang === 'en' ? `${filtered.length} athlete${filtered.length !== 1 ? 's' : ''}` : `총 ${filtered.length}명`)
          : (lang === 'zh' ? '该类别暂无人物' : lang === 'en' ? 'No athletes in this category' : '이 카테고리에 인물이 없습니다')}
      </div>

      {/* 运动员卡片网格 — 使用原版富卡片样式 */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" key={activeFilter}>
        {filtered.map((athlete) => {
          const media = getHallOfFameMedia(athlete.athleteId)
          const cardImage = media.cardImage
          return (
            <Link
              key={athlete.athleteId}
              to={`/hall-of-fame/${athlete.slug}`}
              className="group card-hover flex flex-col overflow-hidden rounded-[1.5rem] border border-stone-border bg-stone-card shadow-sm transition-colors"
            >
              <div
                className="relative flex flex-col overflow-hidden p-5 h-[200px] md:h-[240px]"
                style={{
                  background: `linear-gradient(135deg, ${hexToRgba(athlete.accentColor, 0.98)} 0%, ${hexToRgba(athlete.accentColor, 0.9)} 46%, ${hexToRgba(athlete.accentColor, 0.68)} 100%)`
                }}
              >
                {cardImage && (
                  <div className="absolute right-0 top-0 h-full w-[48%] overflow-hidden">
                    <img
                      src={cardImage.src}
                      alt={t(cardImage.alt)}
                      className="h-full w-full object-cover object-center"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      style={{
                        opacity: 0.4,
                        objectPosition: cardImage.objectPosition || 'center center',
                        transform: `translateX(${cardImage.translateX || '0%'}) scale(${cardImage.scale || 1})`,
                        transformOrigin: 'center center',
                        WebkitMaskImage:
                          'linear-gradient(to left, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 42%, rgba(0, 0, 0, 0.82) 62%, rgba(0, 0, 0, 0.32) 82%, rgba(0, 0, 0, 0) 100%), linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 64%, rgba(0, 0, 0, 0.72) 82%, rgba(0, 0, 0, 0) 100%)',
                        maskImage:
                          'linear-gradient(to left, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 42%, rgba(0, 0, 0, 0.82) 62%, rgba(0, 0, 0, 0.32) 82%, rgba(0, 0, 0, 0) 100%), linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 64%, rgba(0, 0, 0, 0.72) 82%, rgba(0, 0, 0, 0) 100%)',
                        WebkitMaskSize: '100% 100%',
                        maskSize: '100% 100%',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskComposite: 'source-in',
                        maskComposite: 'intersect'
                      }}
                    />
                  </div>
                )}
                <div className="relative z-10 min-w-0 flex-1">
                  {lang === 'zh' ? (
                    athlete.isChineseRepresentative ? (
                      <>
                        <h2 className="mt-0 text-2xl font-semibold text-white">{athlete.athleteName.zh}</h2>
                        {athlete.athleteName.en && (
                          <div className="text-sm text-white/70">{athlete.athleteName.en}</div>
                        )}
                      </>
                    ) : (
                      <>
                        <h2 className="mt-0 text-2xl font-semibold text-white">{athlete.athleteName.en}</h2>
                        {athlete.athleteName.zh && (
                          <div className="text-sm text-white/70">{athlete.athleteName.zh}</div>
                        )}
                      </>
                    )
                  ) : (
                    <h2 className="mt-0 text-2xl font-semibold text-white">{t(athlete.athleteName)}</h2>
                  )}
                </div>
                <div className="relative z-10 mt-3">
                  <p className="text-sm font-medium leading-relaxed text-white/92 line-clamp-2">
                    {t(athlete.tagline)}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
      </div>
    </div>
  )
}
