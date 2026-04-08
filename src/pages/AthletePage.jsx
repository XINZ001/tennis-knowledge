import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import PageSEO from '../components/PageSEO'
import VideoSection from '../components/content/VideoSection'
import ImageLightbox from '../components/ui/ImageLightbox'
import {
  getHallOfFameAthleteBySlug,
  getHallOfFameChaptersForAthlete,
  getHallOfFameCrossReference,
  getHallOfFameMedia,
  getTabKeyForAthlete,
  hallOfFameChapterTypes,
  hallOfFameCategories,
  hallOfFameMainCategories
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

export default function AthletePage() {
  const { athleteSlug } = useParams()
  const { t, lang } = useApp()
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const athlete = getHallOfFameAthleteBySlug(athleteSlug)

  const chapters = useMemo(
    () => (athlete ? getHallOfFameChaptersForAthlete(athlete.athleteId) : []),
    [athlete]
  )
  const media = useMemo(
    () => (athlete ? getHallOfFameMedia(athlete.athleteId) : getHallOfFameMedia('')),
    [athlete]
  )
  const heroImage = media.cardImage || media.images[0] || null
  const galleryImages = useMemo(
    () => media.images.filter((image) => image.src !== heroImage?.src),
    [media.images, heroImage]
  )

  const relatedReferences = useMemo(() => {
    const seen = new Set()
    return chapters
      .flatMap((chapter) => chapter.relatedKps || [])
      .map((kpId) => getHallOfFameCrossReference(kpId))
      .filter((item) => item && !seen.has(item.path) && seen.add(item.path))
  }, [chapters])

  const allSources = useMemo(() => {
    const seen = new Set()
    return chapters
      .flatMap((chapter) => chapter.sources || [])
      .filter((source) => {
        if (seen.has(source.url)) return false
        seen.add(source.url)
        return true
      })
  }, [chapters])

  if (!athlete) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-xl font-semibold mb-2">
          {lang === 'zh' ? '未找到该人物' : lang === 'en' ? 'Athlete not found' : '인물을 찾을 수 없습니다'}
        </h1>
        <Link to="/hall-of-fame" className="text-forest hover:underline text-sm">
          {lang === 'zh' ? '返回名人堂' : lang === 'en' ? 'Back to Hall of Fame' : '명예의 전당으로 돌아가기'}
        </Link>
      </div>
    )
  }

  const athleteName = athlete ? t(athlete.name) : ''

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PageSEO
        title={lang === 'zh' ? `${athleteName} — 攀岩名人堂` : lang === 'en' ? `${athleteName} — Climbing Hall of Fame` : `${athleteName} — 클라이밍 명예의 전당`}
        description={lang === 'zh'
          ? `${athleteName}的攀岩生涯与成就，了解这位传奇攀岩者的故事。`
          : lang === 'en'
          ? `${athleteName}'s climbing career and achievements — discover this legendary climber's story.`
          : `${athleteName}의 클라이밍 경력과 업적 — 이 전설적인 클라이머의 이야기를 알아보세요.`}
        path={`/hall-of-fame/${athleteSlug}`}
      />
      <nav className="text-sm text-text-secondary">
        <Link to="/" className="hover:text-forest transition-colors">
          {lang === 'zh' ? '首页' : lang === 'en' ? 'Home' : '홈'}
        </Link>
        <span className="mx-2">/</span>
        <Link to="/hall-of-fame" className="hover:text-forest transition-colors">
          {lang === 'zh' ? '攀岩名人堂' : lang === 'en' ? 'Hall of Fame' : '명예의 전당'}
        </Link>
        <span className="mx-2">/</span>
        <Link
          to={`/hall-of-fame/browse/${athlete.category}`}
          className="hover:text-forest transition-colors"
        >
          {t(hallOfFameCategories[getTabKeyForAthlete(athlete)] ?? hallOfFameMainCategories[athlete.category])}
        </Link>
        <span className="mx-2">/</span>
        <span>{t(athlete.athleteName)}</span>
      </nav>

      <section
        className="mt-5 overflow-hidden rounded-[2rem] border border-stone-border bg-stone-card shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${hexToRgba(athlete.accentColor, 0.18)} 0%, var(--color-stone-card) 74%)`
        }}
      >
        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          {heroImage && (
            <div className="absolute inset-y-0 right-0 hidden w-[46%] overflow-hidden lg:block">
              <img
                src={heroImage.src}
                alt={t(heroImage.alt)}
                className="h-full w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
                style={{
                  objectPosition: heroImage.objectPosition || 'center top',
                  transform: `translateX(${heroImage.translateX || '0%'}) scale(${heroImage.scale || 1})`,
                  transformOrigin: 'center center',
                  WebkitMaskImage:
                    'linear-gradient(to left, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 44%, rgba(0, 0, 0, 0.8) 66%, rgba(0, 0, 0, 0.28) 84%, rgba(0, 0, 0, 0) 100%), linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 70%, rgba(0, 0, 0, 0.65) 86%, rgba(0, 0, 0, 0) 100%)',
                  maskImage:
                    'linear-gradient(to left, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 44%, rgba(0, 0, 0, 0.8) 66%, rgba(0, 0, 0, 0.28) 84%, rgba(0, 0, 0, 0) 100%), linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 70%, rgba(0, 0, 0, 0.65) 86%, rgba(0, 0, 0, 0) 100%)',
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

          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex rounded-full border border-stone-border bg-stone-card/70 px-3 py-1 text-xs font-semibold text-text-secondary">
              {t(hallOfFameCategories[getTabKeyForAthlete(athlete)] ?? hallOfFameMainCategories[athlete.category])}
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-bold">{t(athlete.athleteName)}</h1>
            {lang === 'zh' && athlete.athleteName.en && (
              <p className="mt-2 text-base text-text-secondary">{athlete.athleteName.en}</p>
            )}
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-text-primary">
              {t(athlete.tagline)}
            </p>
            <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-text-secondary">
              {t(athlete.overview)}
            </p>

            {athlete.featuredQuote && (
              <blockquote className="mt-5 max-w-3xl border-l-4 border-forest/60 pl-4">
                <p className="text-sm leading-relaxed text-text-primary">
                  "{t(athlete.featuredQuote.text)}"
                </p>
                {athlete.featuredQuote.source && (
                  <cite className="mt-1 block text-xs text-text-secondary not-italic">
                    — {athlete.featuredQuote.source}
                  </cite>
                )}
              </blockquote>
            )}

          </div>

          <div className="relative z-10 mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
            {athlete.heroStats.map((stat) => (
              <div key={t(stat.label)} className="rounded-2xl bg-stone-card/85 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                  {t(stat.label)}
                </div>
                <div className="mt-2 text-sm font-semibold leading-relaxed">
                  {t(stat.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-[1.5rem] border border-stone-border bg-stone-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-text-secondary">
              {lang === 'zh' ? '人物概览' : lang === 'en' ? 'Profile' : '프로필'}
            </h2>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-secondary">
                  {lang === 'zh' ? '国家/地区' : lang === 'en' ? 'Nation' : '국가/지역'}
                </dt>
                <dd className="mt-1 text-sm font-medium">{t(athlete.nationality)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-secondary">
                  {lang === 'zh' ? '活跃阶段' : lang === 'en' ? 'Active era' : '활동 시기'}
                </dt>
                <dd className="mt-1 text-sm font-medium">{t(athlete.activeEra)}</dd>
              </div>
            </dl>
          </div>

        </aside>

        <div className="space-y-5">
          {galleryImages.length > 0 && (
            <section className="rounded-[1.5rem] border border-stone-border bg-stone-card p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
                    {lang === 'zh' ? '人物图集' : lang === 'en' ? 'Gallery' : '갤러리'}
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold">
                    {lang === 'zh' ? '图片与视觉记录' : lang === 'en' ? 'Images and Visual Record' : '사진 및 시각 기록'}
                  </h2>
                </div>
                <div className="text-xs text-text-secondary">
                  {galleryImages.length} {lang === 'zh' ? '张图片' : lang === 'en' ? 'images' : '장'}
                </div>
              </div>

              <div className={`mt-5 grid gap-4 ${galleryImages.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                {galleryImages.map((image, index) => (
                  <button
                    key={image.src}
                    onClick={() => setLightboxIndex(index)}
                    className="group overflow-hidden rounded-[1.25rem] border border-stone-border bg-stone-sidebar text-left"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-stone-bg">
                      <img
                        src={image.src}
                        alt={t(image.alt)}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5" />
                    </div>
                    <div className="space-y-2 px-4 py-4">
                      <p className="text-sm leading-relaxed text-text-primary">{t(image.caption)}</p>
                      <a
                        href={image.creditUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex text-xs text-forest hover:underline"
                      >
                        {image.creditLabel}
                      </a>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {media.timeline.length > 0 && (
            <section className="rounded-[1.5rem] border border-stone-border bg-stone-card p-6 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
                {lang === 'zh' ? '生涯节点' : lang === 'en' ? 'Career Timeline' : '경력 타임라인'}
              </div>
              <h2 className="mt-2 text-2xl font-semibold">
                {lang === 'zh' ? '关键时间线' : lang === 'en' ? 'Key Milestones' : '주요 이정표'}
              </h2>
              <div className="mt-5 space-y-4">
                {media.timeline.map((item) => (
                  <div key={`${athlete.athleteId}-${item.year}`} className="grid gap-2 border-l-2 border-forest/30 pl-4 sm:grid-cols-[92px_minmax(0,1fr)] sm:gap-4">
                    <div className="text-sm font-semibold text-forest">{item.year}</div>
                    <div className="text-sm leading-7 text-text-secondary">{t(item.detail)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {media.interviewNotes.length > 0 && (
            <section className="rounded-[1.5rem] border border-stone-border bg-stone-card p-6 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
                {lang === 'zh' ? '采访观察' : lang === 'en' ? 'Interview Notes' : '인터뷰 노트'}
              </div>
              <h2 className="mt-2 text-2xl font-semibold">
                {lang === 'zh' ? '信息与访谈补充' : lang === 'en' ? 'Additional Context and Voice' : '추가 정보와 인터뷰'}
              </h2>
              <div className="mt-5 space-y-3">
                {media.interviewNotes.map((item, index) => (
                  <div key={`${athlete.athleteId}-note-${index}`} className="rounded-2xl bg-stone-sidebar px-4 py-4 text-sm leading-7 text-text-secondary">
                    {t(item)}
                  </div>
                ))}
              </div>
            </section>
          )}

          {chapters.map((chapter) => (
            <article
              key={chapter.id}
              className="rounded-[1.5rem] border border-stone-border bg-stone-card p-6 shadow-sm"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
                {t(hallOfFameChapterTypes[chapter.type]) || chapter.type}
              </div>
              <h2 className="mt-2 text-2xl font-semibold leading-tight">{t(chapter.title)}</h2>

              <p className="mt-4 text-base leading-relaxed text-text-primary">{t(chapter.summary)}</p>

              {chapter.type !== 'quotes' && chapter.paragraphs?.length > 0 && (
                <div className="mt-5 space-y-4">
                  {chapter.paragraphs.map((paragraph, index) => (
                    <p key={`${chapter.id}-p-${index}`} className="text-sm leading-7 text-text-secondary">
                      {t(paragraph)}
                    </p>
                  ))}
                </div>
              )}

              {chapter.pullQuotes?.length > 0 && (
                <div className="mt-6 space-y-4">
                  {chapter.pullQuotes.map((quote, index) => (
                    <blockquote
                      key={`${chapter.id}-q-${index}`}
                      className="rounded-2xl bg-stone-sidebar px-5 py-4 border-l-4 border-forest/50"
                    >
                      <p className="text-sm leading-relaxed text-text-primary">
                        "{t(quote.text)}"
                      </p>
                      {quote.context && (
                        <p className="mt-2 text-xs text-text-secondary">{t(quote.context)}</p>
                      )}
                      {quote.source && (
                        <cite className="mt-1 block text-xs text-text-secondary not-italic">
                          — {quote.source}
                        </cite>
                      )}
                    </blockquote>
                  ))}
                </div>
              )}

              {chapter.keyFacts?.length > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {chapter.keyFacts.map((fact) => (
                    <div key={t(fact.label)} className="rounded-2xl bg-stone-sidebar px-4 py-4">
                      <div className="text-xs uppercase tracking-wide text-text-secondary">
                        {t(fact.label)}
                      </div>
                      <div className="mt-2 text-sm font-medium leading-relaxed">
                        {t(fact.value)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {chapter.sources?.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {chapter.sources.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-stone-border px-3 py-1.5 text-xs text-text-secondary hover:border-forest hover:text-forest transition-colors"
                    >
                      {source.label}
                    </a>
                  ))}
                </div>
              )}
            </article>
          ))}

          {media.videos.length > 0 && (
            <section className="rounded-[1.5rem] border border-stone-border bg-stone-card p-6 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
                {lang === 'zh' ? '精选视频' : lang === 'en' ? 'Selected Videos' : '엄선 영상'}
              </div>
              <h2 className="mt-2 text-2xl font-semibold">
                {lang === 'zh' ? '相关影像与采访' : lang === 'en' ? 'Video and Interview Picks' : '영상 및 인터뷰 모음'}
              </h2>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                {lang === 'zh'
                  ? '优先收录能直接看到比赛气质、动作风格和人物表达的影像与采访。'
                  : lang === 'en'
                  ? "This section highlights videos and interviews that show competitive presence, movement style, and the athlete's own voice most directly."
                  : '경기 모습, 무브먼트 스타일, 선수 본인의 목소리를 가장 직접적으로 볼 수 있는 영상과 인터뷰를 우선 수록했습니다.'}
              </p>
              <VideoSection videos={media.videos} />
            </section>
          )}

          {media.bilibiliVideos?.length > 0 && (
            <section className="rounded-[1.5rem] border border-stone-border bg-stone-card p-6 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
                {lang === 'zh' ? 'Bilibili 视频' : lang === 'en' ? 'Bilibili Videos' : 'Bilibili 영상'}
              </div>
              <h2 className="mt-2 text-2xl font-semibold">
                {lang === 'zh' ? '中文视频资源' : lang === 'en' ? 'Chinese Video Resources' : '중국어 영상 자료'}
              </h2>
              <div className="mt-5 space-y-3">
                {media.bilibiliVideos.map((video) => (
                  <a
                    key={video.url}
                    href={video.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start rounded-2xl bg-stone-sidebar px-4 py-4 hover:bg-stone-border transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-text-primary">{t(video.title)}</div>
                      {video.uploader && (
                        <div className="mt-0.5 text-xs text-text-secondary">{video.uploader}</div>
                      )}
                      {video.summary && (
                        <p className="mt-1 text-xs leading-relaxed text-text-secondary line-clamp-2">
                          {t(video.summary)}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {media.podcasts?.length > 0 && (
            <section className="rounded-[1.5rem] border border-stone-border bg-stone-card p-6 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
                {lang === 'zh' ? '播客' : lang === 'en' ? 'Podcasts' : '팟캐스트'}
              </div>
              <h2 className="mt-2 text-2xl font-semibold">
                {lang === 'zh' ? '播客与音频访谈' : lang === 'en' ? 'Podcast & Audio Interviews' : '팟캐스트 및 오디오 인터뷰'}
              </h2>
              <div className="mt-5 space-y-3">
                {media.podcasts.map((podcast) => (
                  <a
                    key={podcast.url}
                    href={podcast.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-4 rounded-2xl bg-stone-sidebar px-4 py-4 hover:bg-stone-border transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-text-primary">{t(podcast.title)}</div>
                      <div className="mt-0.5 text-xs text-text-secondary">
                        {podcast.show}{podcast.episodeDate ? ` · ${podcast.episodeDate}` : ''}
                      </div>
                      {podcast.summary && (
                        <p className="mt-1 text-xs leading-relaxed text-text-secondary line-clamp-2">
                          {t(podcast.summary)}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {relatedReferences.length > 0 && (
          <div className="rounded-[1.5rem] border border-stone-border bg-stone-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-text-secondary">
              {lang === 'zh' ? '关联知识点' : lang === 'en' ? 'Related Knowledge' : '관련 지식'}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {relatedReferences.map((reference) => (
                <Link
                  key={reference.path}
                  to={reference.path}
                  className="rounded-full bg-forest-light px-3 py-1.5 text-xs font-medium text-forest hover:bg-forest hover:text-white transition-colors"
                >
                  {t(reference.title)}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-[1.5rem] border border-stone-border bg-stone-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-text-secondary">
            {lang === 'zh' ? '来源概览' : lang === 'en' ? 'Sources' : '출처'}
          </h2>
          <ul className="mt-4 space-y-3">
            {allSources.map((source) => (
              <li key={source.url} className="text-sm">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-forest hover:underline"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {media.furtherReading.length > 0 && (
          <div className="rounded-[1.5rem] border border-stone-border bg-stone-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-text-secondary">
              {lang === 'zh' ? '延伸阅读' : lang === 'en' ? 'Further Reading' : '추가 읽기'}
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              {media.furtherReading.map((item) => (
                <li key={item.url}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-forest hover:underline"
                  >
                    {item.title}
                  </a>
                  <div className="mt-0.5 text-xs text-text-secondary">{item.source}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {lightboxIndex >= 0 && galleryImages.length > 0 && (
        <ImageLightbox
          images={galleryImages.map((image) => image.src)}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(-1)}
        />
      )}
    </div>
  )
}
