import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import TiltCard from './TiltCard'
import questData from '../../data/quests.json'

const STORAGE_KEY = 'quest-progress'
const quests = questData.quests

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} }
  catch { return {} }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

const TIER_THRESHOLDS = [
  [1,'stone'],[2,'stone'],[4,'stone'],
  [7,'silver'],[10,'silver'],[14,'silver'],
  [19,'gold'],[25,'gold'],[32,'gold'],
]

function getTier(times) {
  let tier = 'stone'
  for (const [threshold, t] of TIER_THRESHOLDS) {
    if (times >= threshold) tier = t
  }
  if (times > TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1][0]) tier = 'gold'
  return tier
}

function getImagePath(quest, tier) {
  const t = tier || 'stone'
  return `/images/quests/${t}/${quest.image.replace('{tier}', t)}`
}

function getRankLabel(times) {
  if (times === 0) return { label: '石', v: 0, tier: 'stone' }
  let tier = 'stone', tierV = 1
  for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
    if (times >= TIER_THRESHOLDS[i][0]) {
      tier = TIER_THRESHOLDS[i][1]
      tierV = TIER_THRESHOLDS.slice(0, i + 1).filter(t => t[1] === tier).length
    }
  }
  const lastT = TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1][0]
  if (times > lastT) {
    tier = 'gold'; let cum = lastT, gv = TIER_THRESHOLDS.filter(t => t[1] === 'gold').length, gap = 9
    while (cum < times) { cum += gap; gap++; gv++ }
    tierV = gv
  }
  const label = tier === 'gold' ? '金' : tier === 'silver' ? '银' : '石'
  return { label, v: tierV, tier }
}

function getNextRankInfo(times) {
  const tierName = t => t === 'gold' ? '金' : t === 'silver' ? '银' : '石'
  for (const [threshold, tier] of TIER_THRESHOLDS) {
    if (times < threshold) {
      const v = TIER_THRESHOLDS.filter(t => t[1] === tier && t[0] <= threshold).length
      return { remaining: threshold - times, nextLabel: tierName(tier), nextV: v }
    }
  }
  const lastT = TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1][0]
  let cum = lastT, gv = TIER_THRESHOLDS.filter(t => t[1] === 'gold').length, gap = 9
  while (cum <= times) { cum += gap; gap++; gv++ }
  return { remaining: cum - times, nextLabel: '金', nextV: gv }
}

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

// --- 老虎机式抽取动画 ---
function SlotMachine({ finalQuest, onSettled }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState('fast') // fast → slow → done
  const intervalRef = useRef(null)
  const countRef = useRef(0)

  useEffect(() => {
    const finalIndex = quests.findIndex(q => q.id === finalQuest.id)

    // 快速闪烁阶段
    intervalRef.current = setInterval(() => {
      countRef.current++
      setCurrentIndex(Math.floor(Math.random() * quests.length))

      // 1.2 秒后进入减速
      if (countRef.current > 20) {
        setPhase('slow')
      }
      // 减速阶段：逐渐变慢
      if (countRef.current > 20 && countRef.current <= 30) {
        clearInterval(intervalRef.current)
        const delay = 80 + (countRef.current - 20) * 40
        intervalRef.current = setInterval(() => {
          countRef.current++
          setCurrentIndex(prev => (prev + 1) % quests.length)
          if (countRef.current > 30) {
            clearInterval(intervalRef.current)
            // 最终锁定
            setCurrentIndex(finalIndex)
            setPhase('done')
            setTimeout(onSettled, 600)
          }
        }, delay)
      }
    }, 60)

    return () => clearInterval(intervalRef.current)
  }, [finalQuest, onSettled])

  const quest = quests[currentIndex] || quests[0]

  return (
    <div className="flex flex-col items-center">
      <div className={`w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
        phase === 'done' ? 'border-gold/60 shadow-[0_0_30px_rgba(200,149,108,0.3)]' : 'border-stone-border'
      }`}>
        <img
          src={getImagePath(quest, 'stone')}
          alt=""
          className={`w-full h-full object-cover transition-all ${
            phase === 'fast' ? 'scale-105' : phase === 'done' ? 'scale-100' : 'scale-102'
          }`}
        />
      </div>
      {phase !== 'done' && (
        <div className="mt-4 text-sm text-text-secondary animate-pulse">
          {quest ? `#${quest.id}` : ''}
        </div>
      )}
    </div>
  )
}

// --- 结果卡片 ---
function ResultCard({ quest, progress, onComplete, onRedraw, onClose, lang, t }) {
  const [sparkle, setSparkle] = useState(false)
  const times = progress[quest.id]?.times || 0
  const tier = getTier(times)
  const cs = getTierCardStyle(tier)
  const rank = getRankLabel(times)
  const badgeBg = rank.tier === 'gold' ? 'rgba(200,149,108,0.25)' : rank.tier === 'silver' ? 'rgba(168,184,200,0.25)' : 'rgba(156,148,137,0.25)'
  const badgeColor = rank.tier === 'gold' ? '#E8C877' : rank.tier === 'silver' ? '#C0C0C0' : '#B8AFA5'

  const today = new Date().toISOString().slice(0, 10)
  const dates = progress[quest.id]?.dates || []
  const doneToday = dates.includes(today)

  useEffect(() => { setSparkle(false) }, [quest.id])

  const handleDone = () => {
    onComplete(quest.id)
    setSparkle(true)
    setTimeout(() => setSparkle(false), 1600)
  }

  return (
    <div className="flex flex-col items-center">
      {/* 卡片 */}
      <TiltCard className="relative w-72 sm:w-80" tiltDeg={6}>
        {/* 闪光层 */}
        {sparkle && (
          <div className="absolute inset-0 z-30 rounded-2xl pointer-events-none overflow-hidden">
            <div style={{
              position: 'absolute', inset: '-30%',
              background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0) 65%)',
              animation: 'sparkle-flash-modal 1.6s ease-out forwards',
            }} />
          </div>
        )}
        <style>{`
          @keyframes sparkle-flash-modal {
            0% { opacity: 0; transform: scale(0.8); }
            10% { opacity: 1; transform: scale(1.05); }
            30% { opacity: 0.8; transform: scale(1.1); }
            60% { opacity: 0.3; transform: scale(1.15); }
            100% { opacity: 0; transform: scale(1.2); }
          }
        `}</style>
        <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: cs.bg, border: `1.5px solid ${cs.border}` }}>
          <div className="aspect-square bg-black overflow-hidden">
            <img
              src={getImagePath(quest, tier)}
              alt={t(quest.title)}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-5">
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2" style={{ color: cs.text }}>
              {t(quest.title)}
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0" style={{ background: badgeBg, color: badgeColor }}>
                {rank.label} V{rank.v}
              </span>
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: cs.sub }}>{t(quest.description)}</p>
          </div>
        </div>
      </TiltCard>

      {/* 卡片外的操作区 */}
      <div className="mt-5 flex flex-col items-center gap-3 w-72 sm:w-80">
        {doneToday ? (
          <div className="w-full py-3 rounded-xl text-sm font-medium text-center border-2 border-white/20 text-white/60">
            {lang === 'zh' ? '今天已完成 ✅' : lang === 'en' ? 'Done for today ✅' : '오늘 완료 ✅'}
          </div>
        ) : (
          <button
            onClick={handleDone}
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
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onRedraw}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/90 bg-white/10 hover:bg-white/15 backdrop-blur-sm transition-all active:scale-[0.97]"
          >
            🎲 {lang === 'zh' ? '再抽一张' : lang === 'en' ? 'Draw again' : '다시 뽑기'}
          </button>
          <Link
            to="/quests"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/90 bg-white/10 hover:bg-white/15 backdrop-blur-sm text-center transition-all active:scale-[0.97]"
          >
            {lang === 'zh' ? '查看全部 →' : lang === 'en' ? 'All quests →' : '전체 보기 →'}
          </Link>
        </div>
      </div>
    </div>
  )
}

// --- 主弹窗 ---
export default function QuestDrawModal({ isOpen, onClose, user, onOpenAuth, pendingQuestRef }) {
  const { t, lang } = useApp()
  const [progress, setProgress] = useState(loadProgress)
  const [phase, setPhase] = useState('rolling') // rolling → result
  const [finalQuest, setFinalQuest] = useState(null)

  // 随机选一个今天没做过的
  const pickRandom = useCallback((currentProgress) => {
    const today = new Date().toISOString().slice(0, 10)
    const available = quests.filter(q => {
      const dates = currentProgress[q.id]?.dates || []
      return !dates.includes(today)
    })
    const pool = available.length > 0 ? available : quests
    return pool[Math.floor(Math.random() * pool.length)]
  }, [])

  // 记录当前卡片到 localStorage（抽到就记，不需要点完成）
  const saveCurrentQuest = (questId) => {
    const today = new Date().toISOString().slice(0, 10)
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
      saved._currentQuest = { id: questId, date: today }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    } catch {}
  }

  // 每次打开时：如果今天已有当前卡片，直接显示；否则随机抽取
  useEffect(() => {
    if (isOpen) {
      const current = loadProgress()
      setProgress(current)

      const today = new Date().toISOString().slice(0, 10)
      const cur = current._currentQuest
      const todayQuest = (cur && cur.date === today) ? quests.find(q => q.id === cur.id) : null

      if (todayQuest) {
        setFinalQuest(todayQuest)
        setPhase('result')
      } else {
        const picked = pickRandom(current)
        setFinalQuest(picked)
        saveCurrentQuest(picked.id)
        setPhase('rolling')
      }
    }
  }, [isOpen, pickRandom])

  const handleSettled = useCallback(() => {
    setPhase('result')
  }, [])

  const handleComplete = (questId) => {
    if (!user) { if (pendingQuestRef) pendingQuestRef.current = questId; onClose(); onOpenAuth?.(); return }
    const today = new Date().toISOString().slice(0, 10)
    setProgress(prev => {
      const entry = prev[questId] || { times: 0, dates: [] }
      const updated = {
        ...prev,
        [questId]: { times: entry.times + 1, dates: [...entry.dates, today] },
        _currentQuest: { id: questId, date: today },
      }
      saveProgress(updated)
      return updated
    })
  }

  const handleRedraw = useCallback(() => {
    const current = loadProgress()
    setProgress(current)
    const picked = pickRandom(current)
    setFinalQuest(picked)
    saveCurrentQuest(picked.id)
    setPhase('rolling')
  }, [pickRandom])

  if (!isOpen || !finalQuest) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={phase === 'result' ? onClose : undefined}
      />

      {/* 内容 */}
      <div className="relative z-10 max-h-[90vh] overflow-y-auto px-4 py-8">
        {phase === 'rolling' && (
          <SlotMachine finalQuest={finalQuest} onSettled={handleSettled} />
        )}
        {phase === 'result' && (
          <ResultCard
            quest={finalQuest}
            progress={progress}
            onComplete={handleComplete}
            onRedraw={handleRedraw}
            onClose={onClose}
            lang={lang}
            t={t}
          />
        )}
      </div>
    </div>
  )
}
