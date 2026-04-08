import { useMemo, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  getHallOfFameAthletes,
  getHallOfFameMedia,
  hallOfFameCategories,
  hallOfFameMainOrder,
  hallOfFameMainCategories,
  hallOfFameSubCategories,
  getTabKeyForAthlete,
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

export default function HallOfFameCategoryPage() {
  const { categoryKey } = useParams()
  const { t, lang } = useApp()
  const [subFilter, setSubFilter] = useState('')
  const athletes = useMemo(() => getHallOfFameAthletes(), [])

  const isValidCategory = hallOfFameMainOrder.includes(categoryKey)
  if (!isValidCategory) {
    return <Navigate to="/hall-of-fame" replace />
  }

  const filteredAthletes = useMemo(
    () => athletes.filter((a) => athleteMatchesMainSub(a, categoryKey, subFilter)),
    [athletes, categoryKey, subFilter]
  )

  const subButtons = hallOfFameSubCategories[categoryKey]

  const handleSubClick = (subKey) => {
    const sub = subKey.replace(/^(elite|explorer)-/, '')
    setSubFilter((prev) => (prev === sub ? '' : sub))
  }

  const value = hallOfFameMainCategories[categoryKey]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <nav className="mb-6">
        <Link
          to="/hall-of-fame"
          className="text-sm font-medium text-forest hover:underline"
        >
          ← {lang === 'zh' ? '返回名人堂' : lang === 'en' ? 'Back to Hall of Fame' : '명예의 전당으로 돌아가기'}
        </Link>
      </nav>

      <section className="rounded-[1.5rem] border border-stone-border bg-stone-card p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t(value)}
        </h1>
        {value?.intro && (
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            {lang === 'zh' ? value.intro.zh : lang === 'en' ? value.intro.en : (value.intro.ko || value.intro.en)}
          </p>
        )}

        {subButtons && (
          <div className="mt-6 flex flex-wrap gap-2">
            {subButtons.map((sub) => {
              const subcategory = sub.key.replace(/^(elite|explorer)-/, '')
              const active = subFilter === subcategory
              const subCount = athletes.filter((a) =>
                athleteMatchesMainSub(a, categoryKey, subcategory)
              ).length
              return (
                <button
                  key={sub.key}
                  type="button"
                  onClick={() => handleSubClick(sub.key)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? 'border-forest bg-forest text-white'
                      : 'border-stone-border bg-stone-card hover:border-forest/40 hover:text-forest'
                  }`}
                >
                  {lang === 'zh' ? sub.zh : lang === 'en' ? sub.en : (sub.ko || sub.en)}
                  <span className="ml-1 opacity-80">({subCount})</span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <section className="mt-6 text-sm text-text-secondary">
        {filteredAthletes.length > 0
          ? (lang === 'zh' ? `共 ${filteredAthletes.length} 位人物` : lang === 'en' ? `${filteredAthletes.length} athlete${filteredAthletes.length !== 1 ? 's' : ''}` : `총 ${filteredAthletes.length}명`)
          : (lang === 'zh' ? '该类别暂无人物' : lang === 'en' ? 'No athletes in this category' : '이 카테고리에 인물이 없습니다')}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredAthletes.map((athlete) => {
          const media = getHallOfFameMedia(athlete.athleteId)
          const cardImage = media.cardImage
          return (
            <Link
              key={athlete.athleteId}
              to={`/hall-of-fame/${athlete.slug}`}
              className="group card-hover overflow-hidden rounded-[1.5rem] border border-stone-border bg-stone-card shadow-sm transition-colors"
            >
              <div
                className="relative flex min-h-0 flex-col overflow-hidden p-5 md:min-h-[240px] md:h-[240px]"
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
                <div className="relative z-10 mt-3 flex min-h-0 flex-col overflow-hidden">
                  <p className="shrink-0 text-sm font-medium leading-relaxed text-white/92 line-clamp-2">
                    {t(athlete.tagline)}
                  </p>
                  <p className="mt-2 min-h-0 h-fit text-sm leading-relaxed text-white/74 line-clamp-5 overflow-hidden">
                    {t(athlete.overview)}
                  </p>
                </div>
              </div>
              <div className="border-t border-stone-border px-5 py-4">
                <div className="grid grid-cols-1 gap-3">
                  {athlete.heroStats.slice(0, 2).map((stat) => (
                    <div key={t(stat.label)} className="rounded-xl bg-stone-sidebar px-3 py-3">
                      <div className="text-xs uppercase tracking-wide text-text-secondary">
                        {t(stat.label)}
                      </div>
                      <div className="mt-1 text-sm font-medium">{t(stat.value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
