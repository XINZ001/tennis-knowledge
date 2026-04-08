import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import PageSEO from '../components/PageSEO'
import QuestDrawModal from '../components/ui/QuestDrawModal'
import TiltCard from '../components/ui/TiltCard'
import questData from '../data/quests.json'

const STORAGE_KEY = 'quest-progress'

// --- 假数据，用于演示不同状态 ---
const DEMO_PROGRESS = {
  1:  { times: 12, dates: ['2026-03-10','2026-03-14','2026-03-18','2026-03-20','2026-03-25','2026-03-28','2026-04-01','2026-04-02','2026-04-03','2026-04-04','2026-04-05','2026-04-06'] },
  3:  { times: 8, dates: ['2026-03-12','2026-03-15','2026-03-19','2026-03-22','2026-03-26','2026-03-30','2026-04-02','2026-04-05'] },
  5:  { times: 5, dates: ['2026-03-20','2026-03-25','2026-03-30','2026-04-02','2026-04-05'] },
  7:  { times: 4, dates: ['2026-03-22','2026-03-28','2026-04-01','2026-04-04'] },
  9:  { times: 3, dates: ['2026-03-25','2026-04-01','2026-04-06'] },
  12: { times: 2, dates: ['2026-04-01','2026-04-05'] },
  16: { times: 1, dates: ['2026-04-06'] },
  21: { times: 6, dates: ['2026-03-15','2026-03-20','2026-03-25','2026-03-30','2026-04-03','2026-04-06'] },
  27: { times: 1, dates: ['2026-04-04'] },
  34: { times: 3, dates: ['2026-03-28','2026-04-02','2026-04-06'] },
  37: { times: 10, dates: ['2026-03-10','2026-03-13','2026-03-16','2026-03-19','2026-03-22','2026-03-25','2026-03-28','2026-04-01','2026-04-04','2026-04-06'] },
  44: { times: 2, dates: ['2026-04-03','2026-04-06'] },
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    // 如果本地没有数据，使用演示数据
    if (!saved || Object.keys(saved).length === 0) return DEMO_PROGRESS
    return saved
  } catch { return DEMO_PROGRESS }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

// 等级阈值表：[累计次数, 材质, 等级名]
// 石 V1(1) V2(2) V3(4) → 银 V1(7) V2(10) V3(14) → 金 V1(19) V2(25) V3(32) V4(40) ...
const TIER_THRESHOLDS = [
  // [累计次数, 材质]
  // 石 V0(0) V1(1) V2(2) V3(4) → 银 V1(7) V2(10) V3(14) → 金 V1(19) V2(25) V3(32)...
  [1,  'stone'],  // 石 V1
  [2,  'stone'],  // 石 V2
  [4,  'stone'],  // 石 V3
  [7,  'silver'], // 银 V1
  [10, 'silver'], // 银 V2
  [14, 'silver'], // 银 V3
  [19, 'gold'],   // 金 V1
  [25, 'gold'],   // 金 V2
  [32, 'gold'],   // 金 V3
]

function getRank(times) {
  // 0 次 = 石 V0
  if (times === 0) return { tier: 'stone', v: 0 }

  let tier = 'stone'
  let tierV = 1

  for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
    if (times >= TIER_THRESHOLDS[i][0]) {
      tier = TIER_THRESHOLDS[i][1]
      const sameTierBefore = TIER_THRESHOLDS.slice(0, i + 1).filter(t => t[1] === tier).length
      tierV = sameTierBefore
    }
  }

  // 如果超过预定义表，在金级内继续递增
  const lastThreshold = TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1][0]
  if (times > lastThreshold) {
    tier = 'gold'
    let cumulative = lastThreshold
    let goldV = TIER_THRESHOLDS.filter(t => t[1] === 'gold').length
    let gap = 8 // 起始间隔
    while (cumulative < times) {
      cumulative += gap
      gap += 1 // 每级间隔 +1
      goldV++
    }
    tierV = goldV
  }

  return { tier, v: tierV }
}

function getTier(times) {
  return getRank(times).tier
}

function getRankLabel(times) {
  const { tier, v } = getRank(times)
  const label = tier === 'gold' ? '金' : tier === 'silver' ? '银' : '石'
  return { label, v, tier }
}

// 距离下一级还需多少次
function getNextRankInfo(times) {
  const tierName = t => t === 'gold' ? '金' : t === 'silver' ? '银' : '石'

  // 在预定义表中找下一个阈值
  for (const [threshold, tier] of TIER_THRESHOLDS) {
    if (times < threshold) {
      const sameTierBefore = TIER_THRESHOLDS.filter(t => t[1] === tier && t[0] <= threshold).length
      return {
        remaining: threshold - times,
        nextLabel: tierName(tier),
        nextV: sameTierBefore,
      }
    }
  }

  // 超过预定义表，计算金级下一个阈值
  const lastT = TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1][0]
  let cumulative = lastT
  let goldV = TIER_THRESHOLDS.filter(t => t[1] === 'gold').length
  let gap = 8
  while (cumulative <= times) {
    cumulative += gap
    gap++
    goldV++
  }
  return {
    remaining: cumulative - times,
    nextLabel: '金',
    nextV: goldV,
  }
}

function getTierColor(tier) {
  if (tier === 'gold') return '#C8956C'
  if (tier === 'silver') return '#A8B8C8'
  return 'transparent'
}

// 卡片底色 + 边框 + 文字色
function getTierCardStyle(tier) {
  if (tier === 'gold') return {
    bg: 'linear-gradient(145deg, #3D2B1A, #5C4033, #3D2B1A)',
    border: '#C8956C',
    text: '#F5E6D0',
    sub: 'rgba(245,230,208,0.6)',
  }
  if (tier === 'silver') return {
    bg: 'linear-gradient(145deg, #2A2F38, #3A4250, #2A2F38)',
    border: '#A8B8C8',
    text: '#E8EDF2',
    sub: 'rgba(232,237,242,0.6)',
  }
  return {
    bg: 'linear-gradient(145deg, #2C2926, #3D3833, #2C2926)',
    border: '#5C554D',
    text: '#D4CCC3',
    sub: 'rgba(212,204,195,0.6)',
  }
}

function getDisplayImage(quest, tier) {
  const t = tier || 'stone'
  return `/images/quests/${t}/${quest.image.replace('{tier}', t)}`
}

// --- 卡片翻转详情 ---
function QuestCardModal({ quest, progress, onClose, onComplete, lang, t }) {
  const [flipped, setFlipped] = useState(false)
  const [sparkle, setSparkle] = useState(false)
  const times = progress[quest.id]?.times || 0
  const tier = getTier(times)
  const cs = getTierCardStyle(tier)
  const dates = progress[quest.id]?.dates || []
  const today = new Date().toISOString().slice(0, 10)
  const doneToday = dates.includes(today)
  const rank = getRankLabel(times)
  const badgeBg = rank.tier === 'gold' ? 'rgba(200,149,108,0.25)' : rank.tier === 'silver' ? 'rgba(168,184,200,0.25)' : 'rgba(156,148,137,0.25)'
  const badgeColor = rank.tier === 'gold' ? '#E8C877' : rank.tier === 'silver' ? '#C0C0C0' : '#B8AFA5'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 flex flex-col items-center" onClick={e => e.stopPropagation()}>
        {/* TiltCard 包裹翻转卡片 */}
        <TiltCard
          className="relative w-72 sm:w-80 cursor-pointer"
          tiltDeg={6}
          noShine
          onClick={() => setFlipped(!flipped)}
        >
          {/* 闪光层 */}
          {sparkle && (
            <div className="absolute inset-0 z-30 rounded-2xl pointer-events-none overflow-hidden">
              <div style={{
                position: 'absolute',
                inset: '-30%',
                background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0) 65%)',
                animation: 'sparkle-flash 1.6s ease-out forwards',
              }} />
            </div>
          )}
          <style>{`
            @keyframes sparkle-flash {
              0% { opacity: 0; transform: scale(0.8); }
              10% { opacity: 1; transform: scale(1.05); }
              30% { opacity: 0.8; transform: scale(1.1); }
              60% { opacity: 0.3; transform: scale(1.15); }
              100% { opacity: 0; transform: scale(1.2); }
            }
          `}</style>
          <div
            className="relative w-full transition-transform duration-500 rounded-2xl"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              background: cs.bg,
            }}
          >
            {/* 正面 */}
            <div className="w-full" style={{ backfaceVisibility: 'hidden' }}>
              <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: cs.bg, border: `1.5px solid ${cs.border}` }}>
                <div className="aspect-square overflow-hidden" style={{ background: cs.bg, marginBottom: '-1px' }}>
                  <img
                    src={getDisplayImage(quest, tier)}
                    alt={t(quest.title)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold mb-1 flex items-center gap-2" style={{ color: cs.text }}>
                    {t(quest.title)}
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: badgeBg, color: badgeColor }}>
                      {rank.label} V{rank.v}
                    </span>
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: cs.sub }}>{t(quest.description)}</p>
                </div>
              </div>
            </div>

            {/* 背面 */}
            <div
              className="absolute inset-0 w-full"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div
                className="rounded-2xl overflow-hidden shadow-2xl h-full flex flex-col items-center justify-center p-6"
                style={{ background: cs.bg, border: `1.5px solid ${cs.border}`, minHeight: '100%' }}
              >
                <h3 className="text-lg font-bold mb-1 flex items-center gap-2" style={{ color: cs.text }}>
                  {t(quest.title)}
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: badgeBg, color: badgeColor }}>
                    {rank.label} V{rank.v}
                  </span>
                </h3>
                <div className="text-xs mb-6" style={{ color: cs.sub }}>
                  {lang === 'zh' ? `共完成 ${times} 次` : lang === 'en' ? `${times} completions` : `${times}회 완료`}
                </div>

                {dates.length > 0 ? (
                  <div className="flex flex-col items-center gap-1.5 w-full max-h-64 overflow-y-auto">
                    {[...dates].reverse().map((date, i) => (
                      <div
                        key={i}
                        className="text-sm tabular-nums px-4 py-1.5 rounded-lg w-full text-center"
                        style={{ background: 'rgba(255,255,255,0.05)', color: cs.text }}
                      >
                        {date}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm" style={{ color: cs.sub }}>
                    {lang === 'zh' ? '还没有完成记录' : lang === 'en' ? 'No completions yet' : '아직 기록이 없어요'}
                  </div>
                )}

                {/* 下一级提示 */}
                <div className="text-[11px] mt-4" style={{ color: cs.sub }}>
                  {(() => {
                    const next = getNextRankInfo(times)
                    return lang === 'zh'
                      ? `再完成 ${next.remaining} 次 → ${next.nextLabel} V${next.nextV}`
                      : lang === 'en'
                      ? `${next.remaining} more → ${next.nextLabel} V${next.nextV}`
                      : `${next.remaining}회 더 → ${next.nextLabel} V${next.nextV}`
                  })()}
                </div>
              </div>
            </div>
          </div>
        </TiltCard>

        {/* 翻转提示 */}
        <div className="mt-2 text-[11px] text-white/30">
          {lang === 'zh' ? '点击卡片翻转' : lang === 'en' ? 'Click card to flip' : '카드를 클릭하면 뒤집기'}
        </div>

        {/* 卡片外的操作区 */}
        <div className="mt-4 flex flex-col items-center gap-3 w-72 sm:w-80">
          {doneToday ? (
            <div className="w-full py-3 rounded-xl text-sm font-medium text-center border-2 border-white/20 text-white/60">
              {lang === 'zh' ? '今天已完成 ✅' : lang === 'en' ? 'Done for today ✅' : '오늘 완료 ✅'}
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onComplete(quest.id)
                setSparkle(true)
                setTimeout(() => setSparkle(false), 1600)
              }}
              className="w-full py-3 rounded-xl text-white transition-all active:scale-[0.97] shadow-lg shadow-green-900/30 hover:brightness-110 hover:shadow-xl hover:shadow-green-900/40"
              style={{ background: 'linear-gradient(135deg, #4A7C59, #3A6347)' }}
            >
              <div className="font-bold text-base">
                {lang === 'zh' ? '今天就做这个 ✅' : lang === 'en' ? "I'll do this today ✅" : '오늘 이걸 할래요 ✅'}
              </div>
              <div className="text-[11px] text-white/50 mt-0.5">
                {(() => {
                  const next = getNextRankInfo(times)
                  return lang === 'zh'
                    ? `再完成 ${next.remaining} 次 → ${next.nextLabel} V${next.nextV}`
                    : lang === 'en'
                    ? `${next.remaining} more → ${next.nextLabel} V${next.nextV}`
                    : `${next.remaining}회 더 → ${next.nextLabel} V${next.nextV}`
                })()}
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// --- 主页面 ---
export default function QuestPage() {
  const { t, lang } = useApp()
  const { user } = useAuth()
  const { onOpenAuth } = useOutletContext()
  const [progress, setProgress] = useState(loadProgress)
  const [filter, setFilter] = useState('all')
  const [questModalOpen, setQuestModalOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedQuest, setSelectedQuest] = useState(null)
  const pendingQuestRef = useRef(null) // 登录前等待完成的任务

  // 登录成功后自动完成待处理任务
  useEffect(() => {
    if (user && pendingQuestRef.current) {
      const questId = pendingQuestRef.current
      const quest = questData.quests.find(q => q.id === questId)
      pendingQuestRef.current = null
      // 完成任务
      const today = new Date().toISOString().slice(0, 10)
      setProgress(prev => {
        const entry = prev[questId] || { times: 0, dates: [] }
        const updated = { ...prev, [questId]: { times: entry.times + 1, dates: [...entry.dates, today] } }
        saveProgress(updated)
        return updated
      })
      // 重新打开卡片弹窗
      if (quest) setSelectedQuest(quest)
    }
  }, [user])

  const categories = questData.categories
  const quests = questData.quests
  const filtered = filter === 'all' ? quests : quests.filter(q => q.category === filter)

  const totalCompletions = quests.reduce((sum, q) => sum + (progress[q.id]?.times || 0), 0)
  const silverCount = quests.filter(q => (progress[q.id]?.times || 0) >= 3).length
  const goldCount = quests.filter(q => (progress[q.id]?.times || 0) >= 8).length

  const handleComplete = (questId) => {
    if (!user) { pendingQuestRef.current = questId; setSelectedQuest(null); onOpenAuth(); return }
    const today = new Date().toISOString().slice(0, 10)
    setProgress(prev => {
      const entry = prev[questId] || { times: 0, dates: [] }
      const updated = {
        ...prev,
        [questId]: { times: entry.times + 1, dates: [...entry.dates, today] },
        _lastCompleted: { id: questId, date: today },
      }
      saveProgress(updated)
      return updated
    })
  }

  return (
    <div className="relative">
      <PageSEO
        title={lang === 'zh' ? '任务图鉴' : lang === 'en' ? 'Quest Gallery' : '퀘스트 갤러리'}
        description={lang === 'zh' ? '每次去岩馆，专注练一件事' : 'One focus per session'}
        path="/quests"
      />

      {/* 全景渐变背景 */}
      <div className="absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top_left,_rgba(74,124,89,0.18),_transparent_50%),radial-gradient(circle_at_top_right,_rgba(166,138,42,0.15),_transparent_45%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-[240px] h-[80px] bg-gradient-to-b from-transparent to-stone-bg pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-8">
        {/* 标题区 */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {lang === 'zh' ? '任务图鉴' : lang === 'en' ? 'Quest Gallery' : '퀘스트 갤러리'}
              </h1>
              <p className="mt-3 text-base sm:text-lg text-text-secondary leading-relaxed">
                {lang === 'zh'
                  ? '每次去岩馆，专注练一件事。44 个微任务帮你系统提升攀岩技术。'
                  : lang === 'en'
                  ? 'One focus per climbing session. 44 micro quests to systematically improve your climbing.'
                  : '매 세션마다 한 가지에 집중하세요. 44개의 마이크로 퀘스트로 체계적으로 실력을 키우세요.'}
              </p>
            </div>
            {/* 电脑版随机抽取按钮 */}
            <button
              onClick={() => setQuestModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 shrink-0 mt-1 px-5 py-2 rounded-full text-sm font-semibold bg-forest text-white hover:bg-forest/90 transition-colors shadow-md"
            >
              🎲 {lang === 'zh' ? '随机抽取' : lang === 'en' ? 'Random' : '랜덤'}
            </button>
          </div>
        </div>

        {/* 筛选 — 电脑版 pill，手机版 dropdown */}
        {(() => {
          const allCats = [{ id: 'all', title: { zh: '全部', en: 'All', ko: '전체' } }, ...categories]
          const activeCat = allCats.find(c => c.id === filter) || allCats[0]
          const activeCount = activeCat.id === 'all' ? quests.length : quests.filter(q => q.category === activeCat.id).length
          return (
            <>
              {/* 手机版 dropdown */}
              <div className="sm:hidden relative mb-6">
                <button
                  onClick={() => setFilterOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-stone-card border border-stone-border text-sm font-medium text-text-primary"
                >
                  <span>{activeCat.icon ? `${activeCat.icon} ` : ''}{t(activeCat.title)} <span className="text-text-secondary/60">{activeCount}</span></span>
                  <svg className={`w-4 h-4 text-text-secondary transition-transform ${filterOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {filterOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setFilterOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-stone-card border border-stone-border rounded-xl shadow-lg overflow-hidden">
                      {allCats.map(cat => {
                        const isActive = filter === cat.id
                        const count = cat.id === 'all' ? quests.length : quests.filter(q => q.category === cat.id).length
                        return (
                          <button
                            key={cat.id}
                            onClick={() => { setFilter(cat.id); setFilterOpen(false) }}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                              isActive ? 'bg-forest/10 text-forest font-semibold' : 'text-text-secondary hover:bg-stone-border/30'
                            }`}
                          >
                            <span>{cat.icon ? `${cat.icon} ` : ''}{t(cat.title)}</span>
                            <span className={isActive ? 'text-forest/70' : 'text-text-secondary/50'}>{count}</span>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* 电脑版 pill */}
              <div className="hidden sm:flex flex-wrap gap-2 mb-6">
                {allCats.map(cat => {
                  const isActive = filter === cat.id
                  const count = cat.id === 'all' ? quests.length : quests.filter(q => q.category === cat.id).length
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setFilter(cat.id)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-forest text-white'
                          : 'bg-stone-card border border-stone-border text-text-secondary hover:border-forest/40 hover:text-text-primary'
                      }`}
                    >
                      {cat.icon ? `${cat.icon} ` : ''}{t(cat.title)}
                      <span className={`ml-1.5 ${isActive ? 'text-white/70' : 'text-text-secondary/60'}`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )
        })()}

        {/* 统计 */}
        <div className="mb-4 text-sm text-text-secondary">
          {lang === 'zh'
            ? `共 ${filtered.length} 个任务${totalCompletions > 0 ? `，已完成 ${totalCompletions} 次训练` : ''}`
            : lang === 'en'
            ? `${filtered.length} quest${filtered.length !== 1 ? 's' : ''}${totalCompletions > 0 ? ` · ${totalCompletions} completions` : ''}`
            : `총 ${filtered.length}개 퀘스트${totalCompletions > 0 ? ` · ${totalCompletions}회 완료` : ''}`}
        </div>

        {/* 卡片网格 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(quest => {
            const times = progress[quest.id]?.times || 0
            const tier = getTier(times)
            const cs = getTierCardStyle(tier)

            return (
              <TiltCard
                key={quest.id}
                onClick={() => setSelectedQuest(quest)}
                className="relative group text-left rounded-xl overflow-hidden cursor-pointer"
                style={{
                  background: cs.bg,
                  border: `1.5px solid ${cs.border}`,
                }}
              >
                <div className="aspect-square bg-black relative overflow-hidden">
                  <img
                    src={getDisplayImage(quest, tier)}
                    alt={t(quest.title)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium flex items-center gap-1.5" style={{ color: cs.text }}>
                    <span className="truncate">{t(quest.title)}</span>
                    {(() => {
                      const rank = getRankLabel(times)
                      const badgeBg = rank.tier === 'gold' ? 'rgba(200,149,108,0.3)' : rank.tier === 'silver' ? 'rgba(168,184,200,0.3)' : 'rgba(156,148,137,0.3)'
                      const badgeColor = rank.tier === 'gold' ? '#E8C877' : rank.tier === 'silver' ? '#C0C0C0' : '#B8AFA5'
                      return (
                        <span className="text-[9px] font-semibold px-1 py-0.5 rounded shrink-0" style={{ background: badgeBg, color: badgeColor }}>
                          V{rank.v}
                        </span>
                      )
                    })()}
                  </div>
                </div>
              </TiltCard>
            )
          })}
        </div>
      </div>

      {/* 手机版随机抽取悬浮按钮 */}
      <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setQuestModalOpen(true)}
          className="px-8 py-3 rounded-full text-base font-semibold bg-forest text-white hover:bg-forest/90 transition-colors shadow-lg"
        >
          🎲 {lang === 'zh' ? '随机抽取' : lang === 'en' ? 'Random' : '랜덤'}
        </button>
      </div>

      {/* 随机抽取弹窗 */}
      <QuestDrawModal isOpen={questModalOpen} onClose={() => setQuestModalOpen(false)} user={user} onOpenAuth={onOpenAuth} pendingQuestRef={pendingQuestRef} />

      {/* 卡片详情弹窗 */}
      {selectedQuest && (
        <QuestCardModal
          quest={selectedQuest}
          progress={progress}
          onClose={() => setSelectedQuest(null)}
          onComplete={handleComplete}
          lang={lang}
          t={t}
        />
      )}
    </div>
  )
}
