import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { Icon } from '../utils/icons'
import PageSEO from '../components/PageSEO'
import { getDiagnosisHistory } from '../lib/diagnosis'
import diagnosisTree from '../data/diagnosis-tree.json'
import questData from '../data/quests.json'
import QuestDrawModal from '../components/ui/QuestDrawModal'

const QUEST_STORAGE_KEY = 'quest-progress'

function loadQuestProgress() {
  try { return JSON.parse(localStorage.getItem(QUEST_STORAGE_KEY)) || {} }
  catch { return {} }
}

function getQuestTier(times) {
  if (times >= 8) return 'gold'
  if (times >= 3) return 'silver'
  return 'stone'
}

function getQuestTierIcon(tier) {
  if (tier === 'gold') return '🥇'
  if (tier === 'silver') return '🥈'
  return '🪨'
}

function getTierCardStyle(tier) {
  if (tier === 'gold') return {
    bg: 'linear-gradient(145deg, #3D2B1A, #5C4033, #3D2B1A)',
    border: '#C8956C',
    text: '#F5E6D0',
  }
  if (tier === 'silver') return {
    bg: 'linear-gradient(145deg, #2A2F38, #3A4250, #2A2F38)',
    border: '#A8B8C8',
    text: '#E8EDF2',
  }
  return {
    bg: 'linear-gradient(145deg, #1E1E24, #2A2A32, #1E1E24)',
    border: '#4A4A52',
    text: '#B8B0A8',
  }
}

const TIER_THRESHOLDS = [
  [1,  'stone'],  [2,  'stone'],  [4,  'stone'],
  [7,  'silver'], [10, 'silver'], [14, 'silver'],
  [19, 'gold'],   [25, 'gold'],   [32, 'gold'],
]

function getRankLabel(times) {
  if (times === 0) return { tier: 'stone', v: 0 }
  let tier = 'stone', tierV = 1
  for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
    if (times >= TIER_THRESHOLDS[i][0]) {
      tier = TIER_THRESHOLDS[i][1]
      tierV = TIER_THRESHOLDS.slice(0, i + 1).filter(t => t[1] === tier).length
    }
  }
  const last = TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1][0]
  if (times > last) {
    tier = 'gold'
    let cum = last, gv = TIER_THRESHOLDS.filter(t => t[1] === 'gold').length, gap = 8
    while (cum < times) { cum += gap; gap++; gv++ }
    tierV = gv
  }
  return { tier, v: tierV }
}

function getQuestImage(quest, tier) {
  const t = tier || 'stone'
  return `/images/quests/${t}/${quest.image.replace('{tier}', t)}`
}

const personaMap = Object.fromEntries(
  (diagnosisTree.personas || []).map((p) => [p.id, p])
)

export default function ProfilePage() {
  const { user, profile } = useAuth()
  const { lang } = useApp()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [questProgress] = useState(loadQuestProgress)
  const [questModalOpen, setQuestModalOpen] = useState(false)
  const [selectedQuest, setSelectedQuest] = useState(null)

  const tt = (zh, en, ko) => lang === 'zh' ? zh : lang === 'en' ? en : ko

  useEffect(() => {
    if (!user) return
    getDiagnosisHistory().then(({ data }) => {
      setHistory(data || [])
      setLoading(false)
    })
  }, [user])

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-text-secondary">
          {tt('请先登录', 'Please log in first', '먼저 로그인해 주세요')}
        </p>
      </div>
    )
  }

  const displayName = profile?.username || tt('攀岩者', 'Climber', '클라이머')

  return (
    <div className="relative max-w-6xl mx-auto px-4 py-8">
      <PageSEO
        title={tt('个人主页', 'My Profile', '마이페이지')}
        path="/profile"
      />

      <div className="max-w-2xl mx-auto">
        {/* User header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center text-xl font-bold text-forest">
            {displayName[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold">{displayName}</h1>
            <p className="text-sm text-text-secondary">{user.email}</p>
          </div>
        </div>

        {/* Quick links */}
        <div className="flex gap-3 mb-8">
          <Link
            to="/climbing-profile"
            className="flex-1 flex items-center gap-2 rounded-xl border border-stone-border bg-stone-card px-4 py-3 text-sm hover:border-forest/30 transition-colors"
          >
            <Icon name="mountain" size={16} className="text-forest" />
            {tt('攀岩档案', 'Climbing Profile', '클라이밍 프로필')}
          </Link>
          <Link
            to="/settings"
            className="flex-1 flex items-center gap-2 rounded-xl border border-stone-border bg-stone-card px-4 py-3 text-sm hover:border-forest/30 transition-colors"
          >
            <Icon name="edit" size={16} className="text-forest" />
            {tt('个人设置', 'Settings', '설정')}
          </Link>
        </div>

        {/* Diagnosis history */}
        <div className="mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="text-xl">🐒</span>
              {tt('攀岩动物人格', 'Climbing Animal Persona', '클라이밍 동물 인격')}
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12 text-text-secondary text-sm">
              {tt('加载中...', 'Loading...', '로딩 중...')}
            </div>
          ) : history.length === 0 ? (
            <Link
              to="/diagnosis"
              className="block rounded-2xl border-2 border-dashed border-stone-border p-8 text-center hover:border-forest/30 transition-colors"
            >
              <div className="text-4xl mb-3">🐒</div>
              <p className="text-sm font-medium mb-1">
                {tt('还没有测试过', "You haven't taken the test yet", '아직 테스트를 하지 않았어요')}
              </p>
              <p className="text-xs text-text-secondary">
                {tt('测测你的攀岩动物人格，找到你的瓶颈和学习路径', 'Discover your climbing animal persona', '나의 클라이밍 동물을 찾아보세요')}
              </p>
            </Link>
          ) : (
            <div className="flex flex-col gap-4">
              {history.map((record, idx) => {
                const persona = personaMap[record.persona_id]
                const date = new Date(record.created_at)
                const dateStr = date.toLocaleDateString(
                  lang === 'zh' ? 'zh-CN' : lang === 'ko' ? 'ko-KR' : 'en-US',
                  { year: 'numeric', month: 'short', day: 'numeric' }
                )

                // Extract some answers for context
                const answers = record.answers || {}
                const levelStep = diagnosisTree.steps.find((s) => s.id === 'level')
                const levelOpt = levelStep?.options?.find((o) => o.id === answers.level)
                const levelLabel = levelOpt ? (levelOpt.label[lang] || levelOpt.label.zh) : ''

                return (
                  <Link
                    to="/diagnosis"
                    key={record.id}
                    className={`block rounded-2xl border bg-stone-card p-5 hover:border-forest/30 hover:shadow-sm transition-all ${
                      idx === 0 ? 'border-forest/30 shadow-sm' : 'border-stone-border'
                    }`}
                  >
                    {idx === 0 && (
                      <div className="text-xs text-forest font-medium mb-2">
                        {tt('最新结果', 'Latest Result', '최신 결과')}
                      </div>
                    )}

                    {persona ? (
                      <div className="flex items-start gap-4">
                        <div className="text-4xl shrink-0">{persona.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold">
                            {persona.name[lang] || persona.name.zh}
                          </h3>
                          <p className="text-xs text-forest font-medium mt-0.5">
                            {persona.tagline[lang] || persona.tagline.zh}
                          </p>
                          <div className="mt-2 text-xs text-text-secondary flex flex-wrap gap-x-3 gap-y-1">
                            <span>{dateStr}</span>
                            {levelLabel && <span>· {levelLabel}</span>}
                            {(record.fusion_rule_ids || []).length > 0 && (
                              <span>· {record.fusion_rule_ids.length} {tt('项洞察', 'insights', '개 인사이트')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">📊</div>
                        <div>
                          <h3 className="text-sm font-medium">{dateStr}</h3>
                          <p className="text-xs text-text-secondary mt-0.5">
                            {levelLabel}
                          </p>
                        </div>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* ── 任务图鉴 ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="text-xl">🎯</span>
              {tt('任务图鉴', 'Quest Gallery', '퀘스트 갤러리')}
            </h2>
            <button
              onClick={() => setQuestModalOpen(true)}
              className="text-xs px-3 py-1.5 rounded-full bg-stone-bg border border-stone-border text-text-secondary hover:text-text-primary hover:border-gold/40 transition-all"
            >
              🎲 {tt('随机抽取', 'Random', '랜덤')}
            </button>
          </div>

          {/* 统计 */}
          {(() => {
            const completed = questData.quests.filter(q => (questProgress[q.id]?.times || 0) >= 1).length
            const silverCount = questData.quests.filter(q => (questProgress[q.id]?.times || 0) >= 3).length
            const goldCount = questData.quests.filter(q => (questProgress[q.id]?.times || 0) >= 8).length
            const totalCompletions = questData.quests.reduce((sum, q) => sum + (questProgress[q.id]?.times || 0), 0)
            return (
              <div className="flex items-center gap-4 text-xs text-text-secondary mb-4 px-1">
                <span>{tt(`共完成 ${totalCompletions} 次训练`, `${totalCompletions} total completions`, `총 ${totalCompletions}회 완료`)}</span>
                <span>🪨 {completed}</span>
                {silverCount > 0 && <span>🥈 {silverCount}</span>}
                {goldCount > 0 && <span>🥇 {goldCount}</span>}
              </div>
            )
          })()}

          {/* 按分类展示（只显示已完成的任务） */}
          {questData.categories.map(category => {
            const completedQuests = questData.quests.filter(q => q.category === category.id && (questProgress[q.id]?.times || 0) > 0)
            if (completedQuests.length === 0) return null

            return (
              <div key={category.id} className="mb-4">
                <div className="text-xs font-medium text-text-secondary mb-2 px-1">
                  {category.icon} {category.title[lang] || category.title.zh}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {completedQuests.map(quest => {
                    const times = questProgress[quest.id]?.times || 0
                    const tier = getQuestTier(times)
                    const cs = getTierCardStyle(tier)
                    const rank = getRankLabel(times)
                    const badgeBg = rank.tier === 'gold' ? 'rgba(200,149,108,0.3)' : rank.tier === 'silver' ? 'rgba(168,184,200,0.3)' : 'rgba(156,148,137,0.3)'
                    const badgeColor = rank.tier === 'gold' ? '#E8C877' : rank.tier === 'silver' ? '#C0C0C0' : '#B8AFA5'

                    return (
                      <Link
                        key={quest.id}
                        to="/quests"
                        className="group rounded-xl overflow-hidden transition-all hover:scale-[1.02]"
                        style={{ background: cs.bg, border: `1.5px solid ${cs.border}` }}
                        title={`${quest.title[lang] || quest.title.zh} — ${times}${tt('次', 'x', '회')}`}
                      >
                        <div className="aspect-square bg-black overflow-hidden">
                          <img
                            src={getQuestImage(quest, tier)}
                            alt={quest.title[lang] || quest.title.zh}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                        <div className="px-2 py-1.5">
                          <div className="text-xs font-medium flex items-center gap-1" style={{ color: cs.text }}>
                            <span className="truncate">{quest.title[lang] || quest.title.zh}</span>
                            <span className="text-[8px] font-semibold px-1 py-0.5 rounded shrink-0" style={{ background: badgeBg, color: badgeColor }}>
                              V{rank.v}
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* 查看全部 */}
          <Link
            to="/quests"
            className="block mt-3 text-center text-sm text-text-secondary hover:text-forest transition-colors"
          >
            {tt('查看全部任务详情 →', 'View all quest details →', '전체 퀘스트 보기 →')}
          </Link>
        </div>
      </div>

      <QuestDrawModal isOpen={questModalOpen} onClose={() => setQuestModalOpen(false)} />
    </div>
  )
}
