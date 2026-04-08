import { useState, useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { fetchInjuryReports, BODY_PARTS, CLIMBING_TYPES } from '../lib/injuries'
import { supabase } from '../lib/supabase'
import { Icon } from '../utils/icons'
import UserAvatar from '../components/ui/UserAvatar'
import PageSEO from '../components/PageSEO'

// 受伤部位对应的 emoji
const BODY_PART_EMOJI = {
  finger:        '🤞',
  palm:          '🖐️',
  'back-of-hand':'🤚',
  wrist:         '✊',
  forearm:       '💪',
  elbow:         '💪',
  shoulder:      '🏋️',
  neck:          '😣',
  back:          '🧘',
  waist:         '🧘',
  hip:           '🦴',
  knee:          '🦵',
  shin:          '🦵',
  ankle:         '🦶',
  foot:          '🦶',
  head:          '🤕',
  other:         '🩹',
}

function InjuryCard({ report, lang, userId }) {
  const details = report.injury_details?.[0] || report.injury_details
  if (!details) return null

  const bodyPartLabels = (details.body_parts || []).map((bp) => {
    const found = BODY_PARTS.find((b) => b.value === bp)
    return { value: bp, label: found ? (lang === 'zh' ? found.label.zh : lang === 'en' ? found.label.en : (found.label.ko || found.label.en)) : bp }
  })

  const climbingLabel = CLIMBING_TYPES.find((c) => c.value === details.climbing_type)
  const likeCount = report.likes?.length || 0
  const liked = userId && report.likes?.some((l) => l.user_id === userId)

  // 获取第一张图片
  const mediaItems = (report.media || []).sort((a, b) => a.display_order - b.display_order)
  const firstImage = mediaItems.find((m) => m.media_type === 'image')
  const imageUrl = firstImage
    ? supabase.storage.from('community-media').getPublicUrl(firstImage.storage_path).data.publicUrl
    : null

  // 无图时的信息
  const primaryBodyPart = details.body_parts?.[0] || 'other'

  // 有图片 → 大图卡片
  if (imageUrl) {
    return (
      <Link
        to={`/injuries/${report.id}`}
        className="group card-hover block rounded-xl overflow-hidden bg-stone-card border border-stone-border hover:border-stone-border/80 transition-colors break-inside-avoid mb-3"
      >
        <div className="relative w-full overflow-hidden">
          <img
            src={imageUrl}
            alt={report.title}
            className="w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            loading="lazy"
            style={{ aspectRatio: '4 / 5' }}
          />
        </div>
        <div className="p-3.5">
          <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2">{report.title}</h3>
          <p className="text-xs text-text-secondary line-clamp-2 mb-2.5">{report.description}</p>
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <UserAvatar name={report.profiles?.username || '匿名'} size={16} />
              {report.profiles?.username || '匿名'}
            </span>
            <span className={`flex items-center gap-0.5 ${liked ? 'text-red-500' : ''}`}>
              <Icon name={liked ? 'heartFilled' : 'heart'} size={13} /> {likeCount}
            </span>
          </div>
        </div>
      </Link>
    )
  }

  // 无图片 → emoji 封面 + 文字卡片
  const emojis = (details.body_parts || [primaryBodyPart]).map(bp => BODY_PART_EMOJI[bp] || '🩹')

  return (
    <Link
      to={`/injuries/${report.id}`}
      className="group card-hover block rounded-xl overflow-hidden bg-stone-card border border-stone-border hover:border-stone-border/80 transition-colors break-inside-avoid mb-3"
    >
      {/* Emoji 封面区域 — 类似文章卡片 */}
      <div className="relative h-[100px] flex items-center justify-center bg-amber-light">
        <span className="select-none" style={{ fontSize: emojis.length > 2 ? '2rem' : '2.75rem', letterSpacing: emojis.length > 1 ? '0.25em' : '0' }}>
          {emojis.join('')}
        </span>
      </div>

      <div className="p-3.5">
        {/* 标签行：受伤部位 + 攀岩类型 */}
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          {bodyPartLabels.map(({ value, label }) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium text-amber-dark bg-amber-light/60"
            >
              {label}
            </span>
          ))}
          {climbingLabel && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-stone-sidebar text-text-secondary">
              {lang === 'zh' ? climbingLabel.label.zh : lang === 'en' ? climbingLabel.label.en : (climbingLabel.label.ko || climbingLabel.label.en)}
            </span>
          )}
        </div>

        {/* 标题 */}
        <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2">{report.title}</h3>

        {/* 描述 */}
        <p className="text-xs text-text-secondary line-clamp-2 mb-2.5">{report.description}</p>

        {/* 底部：用户 + 互动 */}
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <UserAvatar name={report.profiles?.username || '匿名'} size={16} />
            {report.profiles?.username || '匿名'}
          </span>
          <span className={`flex items-center gap-0.5 ${liked ? 'text-red-500' : ''}`}>
            <Icon name={liked ? 'heartFilled' : 'heart'} size={13} /> {likeCount}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function InjuryListPage() {
  const { lang } = useApp()
  const { user } = useAuth()
  const { onOpenAuth } = useOutletContext()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterBodyPart, setFilterBodyPart] = useState('')
  const [filterClimbingType, setFilterClimbingType] = useState('')

  useEffect(() => {
    loadReports()
  }, [filterBodyPart, filterClimbingType])

  async function loadReports() {
    setLoading(true)
    const { data } = await fetchInjuryReports({
      bodyPart: filterBodyPart || undefined,
      climbingType: filterClimbingType || undefined,
    })
    setReports(data || [])
    setLoading(false)
  }

  return (
    <div className="relative">
      <PageSEO
        title={lang === 'zh' ? '伤痛档案' : lang === 'en' ? 'Injury Archive' : '부상 기록'}
        description={lang === 'zh'
          ? '来自真实攀岩者的受伤经历——了解风险、做好预防。查看常见攀岩伤痛案例，学习预防和恢复经验。'
          : lang === 'en'
          ? 'Real injury stories from climbers — understand risks, learn prevention. Browse common climbing injury cases.'
          : '실제 클라이머들의 부상 경험 — 위험을 이해하고 예방하세요. 일반적인 클라이밍 부상 사례를 살펴보세요.'}
        path="/injuries"
      />
      {/* 全景渐变背景 */}
      <div className="absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top_left,_rgba(212,145,61,0.18),_transparent_50%),radial-gradient(circle_at_top_right,_rgba(180,60,60,0.14),_transparent_45%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-[240px] h-[80px] bg-gradient-to-b from-transparent to-stone-bg pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {lang === 'zh' ? '伤痛档案' : lang === 'en' ? 'Injury Archive' : '부상 기록'}
            </h1>
            <p className="mt-3 text-base sm:text-lg text-text-secondary leading-relaxed">
              {lang === 'zh'
                ? '来自真实攀岩者的受伤经历——了解风险，做好预防。分享你的故事，帮助更多人安全攀岩。'
                : lang === 'en'
                ? 'Real injury stories from climbers — understand risks, learn prevention. Share your story to help others climb safely.'
                : '실제 클라이머들의 부상 경험 — 위험을 이해하고 예방하세요. 여러분의 이야기를 공유해 다른 클라이머의 안전을 도와주세요.'}
            </p>
          </div>
          <Link
            to={user ? '/injuries/new' : '#'}
            onClick={(e) => {
              if (!user) { e.preventDefault(); onOpenAuth() }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors shrink-0"
          >
            <Icon name="plus" size={16} />
            {lang === 'zh' ? '分享我的经历' : lang === 'en' ? 'Share My Story' : '내 경험 공유하기'}
          </Link>
        </div>

      {/* 免责声明 */}
      <div className="bg-amber-light border border-amber/20 rounded-xl px-4 py-3 mb-6 text-sm text-text-secondary">
        <Icon name="alertTriangle" size={14} className="text-amber inline mr-1.5" />
        {lang === 'zh' ? '本页面内容为用户自述经历，不构成医学建议。受伤后请及时就医。'
          : lang === 'en' ? 'Content on this page is user-reported and does not constitute medical advice. Please seek medical attention after an injury.'
          : '이 페이지의 내용은 사용자가 직접 작성한 경험담이며 의학적 조언이 아닙니다. 부상 후에는 반드시 의료 전문가의 진료를 받으세요.'}
      </div>

      {/* 筛选器 — pill 风格 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {/* 部位筛选 */}
        <button
          onClick={() => setFilterBodyPart('')}
          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
            !filterBodyPart
              ? 'bg-amber text-white border-amber'
              : 'bg-stone-card border-stone-border text-text-secondary hover:border-amber/40'
          }`}
        >
          {lang === 'zh' ? '全部部位' : lang === 'en' ? 'All parts' : '전체 부위'}
        </button>
        {BODY_PARTS.filter(bp => bp.value !== 'other').map((bp) => (
          <button
            key={bp.value}
            onClick={() => setFilterBodyPart(filterBodyPart === bp.value ? '' : bp.value)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              filterBodyPart === bp.value
                ? 'bg-amber text-white border-amber'
                : 'bg-stone-card border-stone-border text-text-secondary hover:border-amber/40'
            }`}
          >
            {lang === 'zh' ? bp.label.zh : lang === 'en' ? bp.label.en : (bp.label.ko || bp.label.en)}
          </button>
        ))}

        {/* 分隔 */}
        <div className="w-px h-6 bg-stone-border self-center mx-1" />

        {/* 攀岩类型筛选 */}
        {CLIMBING_TYPES.map((ct) => (
          <button
            key={ct.value}
            onClick={() => setFilterClimbingType(filterClimbingType === ct.value ? '' : ct.value)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              filterClimbingType === ct.value
                ? 'bg-forest text-white border-forest'
                : 'bg-stone-card border-stone-border text-text-secondary hover:border-forest/40'
            }`}
          >
            {lang === 'zh' ? ct.label.zh : lang === 'en' ? ct.label.en : (ct.label.ko || ct.label.en)}
          </button>
        ))}
      </div>

      {/* 案例列表 — 瀑布流双列 */}
      {loading ? (
        <div className="text-center py-16 text-text-secondary">{lang === 'zh' ? '加载中...' : lang === 'en' ? 'Loading...' : '로딩 중...'}</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16">
          <Icon name="fileText" size={48} className="text-stone-border mx-auto mb-4" />
          <p className="text-text-secondary mb-4">
            {lang === 'zh' ? '还没有人分享过伤痛经历' : lang === 'en' ? 'No injury stories yet' : '아직 공유된 부상 경험이 없습니다'}
          </p>
          <Link
            to={user ? '/injuries/new' : '#'}
            onClick={(e) => {
              if (!user) { e.preventDefault(); onOpenAuth() }
            }}
            className="text-forest font-medium hover:underline"
          >
            {lang === 'zh' ? '成为第一个分享者 →' : lang === 'en' ? 'Be the first to share →' : '첫 번째 공유자가 되어보세요 →'}
          </Link>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-3">
          {reports.map((report) => (
            <InjuryCard key={report.id} report={report} lang={lang} userId={user?.id} />
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
