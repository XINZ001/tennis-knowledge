import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { Icon } from '../utils/icons'
import PageSEO from '../components/PageSEO'
import ArticleCard from '../components/article/ArticleCard'
import { saveDiagnosisResult, getLatestDiagnosis } from '../lib/diagnosis'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer
} from 'recharts'
import diagnosisTree from '../data/diagnosis-tree.json'
import kpRegistry from '../data/kp-registry.json'
import articleRegistry from '../data/article-registry.json'

// Build lookup maps once
const kpMap = Object.fromEntries((kpRegistry.knowledgePoints || []).map((kp) => [kp.id, kp]))
const articleMap = Object.fromEntries((articleRegistry.articles || []).map((a) => [a.slug, a]))

// Map user style selections to styleNotes keys
function getStyleKey(styleSelections) {
  if (!Array.isArray(styleSelections) || styleSelections.length === 0) return null
  const s = styleSelections[0]
  if (s === 'indoor-boulder' || s === 'outdoor-boulder') return 'boulder'
  if (s === 'indoor-rope' || s === 'outdoor-sport' || s === 'outdoor-trad') return 'rope'
  if (s === 'outdoor-sport' || s === 'outdoor-trad' || s === 'outdoor-boulder') return 'outdoor'
  return null
}

const STEP_IDS = ['gym', 'level', 'style', 'bottleneck', 'rating', 'symptom', 'goal']

// Map user-selected level to prescription level key
function getPrescriptionLevel(levelId) {
  const map = {
    beginner: 'beginner',
    elementary: 'beginner',
    intermediate: 'intermediate',
    'upper-intermediate': 'advanced',
    advanced: 'advanced',
  }
  return map[levelId] || 'intermediate'
}

// Grade hints calibrated by gym grading style
// Each gym type maps to [beginner, elementary, intermediate, upper-intermediate, advanced]
const GRADE_HINTS = {
  soft: {
    zh: ['V0-V1', 'V2-V3', 'V4-V6', 'V7-V8', 'V9+'],
    en: ['V0-V1', 'V2-V3', 'V4-V6', 'V7-V8', 'V9+'],
    ko: ['V0-V1', 'V2-V3', 'V4-V6', 'V7-V8', 'V9+'],
  },
  medium: {
    zh: ['V0-V1', 'V2', 'V3-V4', 'V5-V6', 'V7+'],
    en: ['V0-V1', 'V2', 'V3-V4', 'V5-V6', 'V7+'],
    ko: ['V0-V1', 'V2', 'V3-V4', 'V5-V6', 'V7+'],
  },
  hard: {
    zh: ['V0', 'V1-V2', 'V2-V3', 'V4-V5', 'V6+'],
    en: ['V0', 'V1-V2', 'V2-V3', 'V4-V5', 'V6+'],
    ko: ['V0', 'V1-V2', 'V2-V3', 'V4-V5', 'V6+'],
  },
  outdoor: {
    zh: ['V0-V1', 'V2-V3', 'V4-V5', 'V6-V7', 'V8+'],
    en: ['V0-V1', 'V2-V3', 'V4-V5', 'V6-V7', 'V8+'],
    ko: ['V0-V1', 'V2-V3', 'V4-V5', 'V6-V7', 'V8+'],
  },
}
const LEVEL_IDS = ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced']

function getGradeHint(gymType, levelId, lang) {
  const hints = GRADE_HINTS[gymType || 'medium']
  const idx = LEVEL_IDS.indexOf(levelId)
  if (idx < 0) return null
  const prefix = { zh: '约 ', en: '~', ko: '~' }
  return (prefix[lang] || '~') + (hints[lang] || hints.zh)[idx]
}

/* ───────────── Step Components ───────────── */

function StepCard({ children, selected, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left rounded-xl border p-4 transition-all duration-150 cursor-pointer
        ${selected
          ? 'border-forest bg-forest-light/40 shadow-sm'
          : 'border-stone-border bg-stone-card hover:border-forest/30 hover:bg-stone-bg'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
}

function SingleSelectStep({ step, value, onChange, lang, gradeHintFn }) {
  return (
    <div className="flex flex-col gap-3">
      {step.options.map((opt) => {
        const dynamicHint = gradeHintFn ? gradeHintFn(opt.id) : null
        return (
          <StepCard key={opt.id} selected={value === opt.id} onClick={() => onChange(opt.id)}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{opt.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{opt.label[lang] || opt.label.zh}</div>
                {opt.desc && <div className="text-xs text-text-secondary mt-0.5">{opt.desc[lang] || opt.desc.zh}</div>}
                {dynamicHint && (
                  <div className="text-[10px] text-text-secondary/60 mt-1">{dynamicHint}</div>
                )}
              </div>
              {value === opt.id && <Icon name="target" size={16} className="text-forest shrink-0" />}
            </div>
          </StepCard>
        )
      })}
    </div>
  )
}

function MultiSelectStep({ step, value, onChange, lang }) {
  const maxSelect = step.maxSelect || step.options.length
  const toggle = (id) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
    } else if (value.length < maxSelect) {
      onChange([...value, id])
    }
  }
  return (
    <div className="flex flex-col gap-3">
      {step.options.map((opt) => {
        const isSelected = value.includes(opt.id)
        return (
          <StepCard
            key={opt.id}
            selected={isSelected}
            onClick={() => toggle(opt.id)}
            disabled={!isSelected && value.length >= maxSelect}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{opt.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{opt.label[lang] || opt.label.zh}</div>
                {opt.desc && <div className="text-xs text-text-secondary mt-0.5">{opt.desc[lang] || opt.desc.zh}</div>}
              </div>
              {isSelected && <Icon name="target" size={16} className="text-forest shrink-0" />}
            </div>
          </StepCard>
        )
      })}
    </div>
  )
}

function RatingStep({ step, value, onChange, lang }) {
  const setDim = (dimId, score) => {
    onChange({ ...value, [dimId]: score })
  }
  return (
    <div className="flex flex-col gap-5">
      {step.dimensions.map((dim) => {
        const current = value[dim.id] || 0
        return (
          <div key={dim.id} className="rounded-xl border border-stone-border bg-stone-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{dim.emoji}</span>
              <span className="font-medium text-sm">{dim.label[lang] || dim.label.zh}</span>
            </div>
            <div className="text-xs text-text-secondary mb-3">{dim.desc[lang] || dim.desc.zh}</div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDim(dim.id, n)}
                  className={`flex-1 h-10 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer border
                    ${current === n
                      ? 'bg-forest text-white border-forest shadow-sm'
                      : current > 0 && n <= current
                        ? 'bg-forest/15 text-forest border-forest/30'
                        : 'bg-stone-bg text-text-secondary border-stone-border hover:border-forest/30'}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-text-secondary">{dim.low[lang] || dim.low.zh}</span>
              <span className="text-[10px] text-text-secondary">{dim.high[lang] || dim.high.zh}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SymptomStep({ step, bottlenecks, value, onChange, lang }) {
  // Show symptom questions for each selected bottleneck
  return (
    <div className="flex flex-col gap-6">
      {bottlenecks.map((bId) => {
        const branch = step.branches[bId]
        if (!branch) return null
        return (
          <div key={bId}>
            <h3 className="text-sm font-semibold mb-3">{branch.question[lang] || branch.question.zh}</h3>
            <div className="flex flex-col gap-2.5">
              {branch.options.map((opt) => (
                <StepCard
                  key={opt.id}
                  selected={value.includes(opt.id)}
                  onClick={() => {
                    // Replace any previous selection for this bottleneck
                    const otherIds = branch.options.map((o) => o.id)
                    const cleaned = value.filter((v) => !otherIds.includes(v))
                    onChange([...cleaned, opt.id])
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{opt.emoji}</span>
                    <span className="font-medium text-sm flex-1">{opt.label[lang] || opt.label.zh}</span>
                    {value.includes(opt.id) && <Icon name="target" size={16} className="text-forest shrink-0" />}
                  </div>
                </StepCard>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ───────────── Persona Matcher ───────────── */

function matchPersona(answers, lang) {
  const personas = diagnosisTree.personas || []
  const ratings = answers.rating || {}
  const bottlenecks = answers.bottleneck || []
  const styles = answers.style || []
  const level = answers.level
  const gym = answers.gym

  for (const p of [...personas].sort((a, b) => (b.priority || 0) - (a.priority || 0))) {
    const c = p.conditions
    if (c.level_in && !c.level_in.includes(level)) continue
    if (c.gym_in && !c.gym_in.includes(gym)) continue
    if (c.bottleneck_any && !c.bottleneck_any.some((b) => bottlenecks.includes(b))) continue
    if (c.style_any && !c.style_any.some((s) => styles.includes(s))) continue
    if (c.low_count_gte) {
      const lowCount = ['finger', 'mental', 'tactics', 'endurance', 'technique', 'flexibility']
        .filter((d) => (ratings[d] || 3) <= 2).length
      if (lowCount < c.low_count_gte) continue
    }
    if (c.rating_lte) {
      let fail = false
      for (const [dim, th] of Object.entries(c.rating_lte)) { if ((ratings[dim] || 3) > th) fail = true }
      if (fail) continue
    }
    if (c.rating_gte) {
      let fail = false
      for (const [dim, th] of Object.entries(c.rating_gte)) { if ((ratings[dim] || 3) < th) fail = true }
      if (fail) continue
    }
    return {
      ...p,
      nameText: p.name[lang] || p.name.zh,
      taglineText: p.tagline[lang] || p.tagline.zh,
      complimentText: p.compliment[lang] || p.compliment.zh,
      issueText: p.issue[lang] || p.issue.zh,
    }
  }
  const fallback = personas.find((p) => p.id === 'zen-capybara') || personas[personas.length - 1]
  if (!fallback) return null
  return {
    ...fallback,
    nameText: fallback.name[lang] || fallback.name.zh,
    taglineText: fallback.tagline[lang] || fallback.tagline.zh,
    complimentText: fallback.compliment[lang] || fallback.compliment.zh,
    issueText: fallback.issue[lang] || fallback.issue.zh,
  }
}

/* ───────────── Fusion Rule Engine ───────────── */

function evaluateFusionRules(answers, lang) {
  const rules = diagnosisTree.fusionRules || []
  const ratings = answers.rating || {}
  const bottlenecks = answers.bottleneck || []
  const symptoms = answers.symptom || []
  const styles = answers.style || []
  const level = answers.level
  const gym = answers.gym

  return rules
    .filter((rule) => {
      const c = rule.conditions
      // level_in: user level must be in list
      if (c.level_in && !c.level_in.includes(level)) return false
      // gym_in: user gym type must be in list
      if (c.gym_in && !c.gym_in.includes(gym)) return false
      // bottleneck_any: at least one must be selected
      if (c.bottleneck_any && !c.bottleneck_any.some((b) => bottlenecks.includes(b))) return false
      // bottleneck_all: all must be selected
      if (c.bottleneck_all && !c.bottleneck_all.every((b) => bottlenecks.includes(b))) return false
      // symptom_any: at least one must be selected
      if (c.symptom_any && !c.symptom_any.some((s) => symptoms.includes(s))) return false
      // style_any: at least one user style must match
      if (c.style_any && !c.style_any.some((s) => styles.includes(s))) return false
      // style_only: user styles must be a subset of this list (and non-empty)
      if (c.style_only) {
        if (styles.length === 0) return false
        if (!styles.every((s) => c.style_only.includes(s))) return false
      }
      // rating_lte: all specified dimensions must be <= threshold
      if (c.rating_lte) {
        for (const [dim, threshold] of Object.entries(c.rating_lte)) {
          if ((ratings[dim] || 3) > threshold) return false
        }
      }
      // rating_gte: all specified dimensions must be >= threshold
      if (c.rating_gte) {
        for (const [dim, threshold] of Object.entries(c.rating_gte)) {
          if ((ratings[dim] || 3) < threshold) return false
        }
      }
      return true
    })
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .slice(0, 4) // Show top 4 most relevant fusion insights
    .map((rule) => ({
      ...rule,
      text: rule.insight[lang] || rule.insight.zh,
      labelText: rule.label[lang] || rule.label.zh,
      resolvedKps: (rule.extra_kps || []).map((id) => kpMap[id]).filter(Boolean),
      resolvedArticles: (rule.extra_articles || []).map((slug) => articleMap[slug]).filter(Boolean),
    }))
}

/* ───────────── Prescription Result ───────────── */

function PrescriptionPage({ answers, lang, t, onRetake }) {
  const ratings = answers.rating || {}
  const symptoms = answers.symptom || []
  const levelId = answers.level
  const prescriptionLevel = getPrescriptionLevel(levelId)
  const styleKey = getStyleKey(answers.style)

  // Match persona
  const persona = matchPersona(answers, lang)

  // Evaluate fusion rules
  const fusionInsights = evaluateFusionRules(answers, lang)

  // Build radar data
  const radarStep = diagnosisTree.steps.find((s) => s.id === 'rating')
  const radarData = radarStep.dimensions.map((dim) => ({
    subject: dim.label[lang] || dim.label.zh,
    value: ratings[dim.id] || 1,
    fullMark: 5,
  }))

  // Find weakest dimensions
  const sortedDims = [...radarStep.dimensions].sort(
    (a, b) => (ratings[a.id] || 1) - (ratings[b.id] || 1)
  )
  const weakest = sortedDims[0]

  // Build prescriptions for each symptom
  const prescriptions = symptoms.map((symId) => {
    const rx = diagnosisTree.prescriptions[symId]
    if (!rx) return null

    const baseDiag = rx.diagnosis[lang] || rx.diagnosis.zh
    const levelData = rx.by_level[prescriptionLevel] || rx.by_level.intermediate || {}
    const appendText = levelData.append ? (levelData.append[lang] || levelData.append.zh) : ''
    const actionText = levelData.action ? (levelData.action[lang] || levelData.action.zh) : ''

    // Style-specific notes
    let styleNote = null
    if (styleKey && rx.styleNotes && rx.styleNotes[styleKey]) {
      styleNote = rx.styleNotes[styleKey][lang] || rx.styleNotes[styleKey].zh
    }
    // Also check outdoor key as secondary if user picked outdoor-sport/trad
    if (!styleNote && answers.style?.[0]?.startsWith('outdoor') && rx.styleNotes?.outdoor) {
      styleNote = rx.styleNotes.outdoor[lang] || rx.styleNotes.outdoor.zh
    }

    // Cross checks
    const crossNotes = []
    if (rx.cross_checks) {
      for (const cc of rx.cross_checks) {
        const dimScore = ratings[cc.if_low] || 3
        if (dimScore <= 2) {
          crossNotes.push({
            note: cc.note[lang] || cc.note.zh,
            extra_kps: cc.extra_kps || [],
          })
        }
      }
    }

    // Resolve real KP objects
    const allKpIds = [...(rx.kps || [])]
    crossNotes.forEach((cn) => {
      if (cn.extra_kps) allKpIds.push(...cn.extra_kps)
    })
    const resolvedKps = [...new Set(allKpIds)]
      .map((id) => kpMap[id])
      .filter(Boolean)

    // Resolve real article objects
    const resolvedArticles = (rx.articles || [])
      .map((slug) => articleMap[slug])
      .filter(Boolean)

    return { symId, rx, baseDiag, appendText, actionText, styleNote, crossNotes, resolvedKps, resolvedArticles }
  }).filter(Boolean)

  // Level label
  const levelStep = diagnosisTree.steps.find((s) => s.id === 'level')
  const levelOption = levelStep.options.find((o) => o.id === levelId)
  const levelLabel = levelOption ? (levelOption.label[lang] || levelOption.label.zh) : ''

  // Goal label
  const goalStep = diagnosisTree.steps.find((s) => s.id === 'goal')
  const goalOption = goalStep.options.find((o) => o.id === answers.goal)
  const goalLabel = goalOption ? (goalOption.label[lang] || goalOption.label.zh) : ''

  // Style label
  const styleStep = diagnosisTree.steps.find((s) => s.id === 'style')
  const styleLabels = (answers.style || []).map((sId) => {
    const opt = styleStep?.options?.find((o) => o.id === sId)
    return opt ? (opt.label[lang] || opt.label.zh) : ''
  }).filter(Boolean)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-forest/10 mb-3 text-3xl">
          🐒
        </div>
        <h1 className="text-2xl font-bold">
          {lang === 'zh' ? '测测你的攀岩动物人格' : lang === 'en' ? 'Find Your Climbing Animal' : '나의 클라이밍 동물 찾기'}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {levelLabel} · {styleLabels.join(' / ')} · {goalLabel}
        </p>
      </div>

      {/* Persona Card */}
      {persona && (
        <div className="rounded-2xl border-2 border-forest/30 bg-gradient-to-br from-forest-light/40 to-forest-light/10 p-6 mb-6 text-center">
          <div className="text-5xl mb-3">{persona.emoji}</div>
          <h2 className="text-xl font-bold mb-1">{persona.nameText}</h2>
          <p className="text-sm text-forest font-medium mb-4">{persona.taglineText}</p>
          <div className="text-left space-y-3">
            <div className="rounded-xl bg-white/60 dark:bg-white/10 p-4">
              <div className="flex items-start gap-2">
                <span className="text-base shrink-0">💪</span>
                <p className="text-sm leading-relaxed">{persona.complimentText}</p>
              </div>
            </div>
            <div className="rounded-xl bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/40 dark:border-amber-800/30 p-4">
              <div className="flex items-start gap-2">
                <span className="text-base shrink-0">🔍</span>
                <p className="text-sm leading-relaxed">{persona.issueText}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Radar Chart */}
      <div className="rounded-2xl border border-stone-border bg-stone-card p-5 mb-6">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Icon name="trendingUp" size={16} className="text-forest" />
          {lang === 'zh' ? '六维能力雷达' : lang === 'en' ? 'Ability Radar' : '능력 레이더'}
        </h2>
        <div className="w-full" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
              <PolarGrid stroke="var(--stone-border, #d4d0cb)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'var(--text-secondary, #78716c)', fontSize: 11 }}
              />
              <Radar
                dataKey="value"
                stroke="#4A7C59"
                fill="#4A7C59"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-text-secondary text-center mt-2">
          {lang === 'zh'
            ? `最弱项：${weakest.label.zh}（${ratings[weakest.id] || 1}/5）`
            : lang === 'en'
            ? `Weakest: ${weakest.label.en}（${ratings[weakest.id] || 1}/5）`
            : `가장 약한 영역: ${weakest.label.ko}（${ratings[weakest.id] || 1}/5）`}
        </p>
      </div>

      {/* Fusion Insights — cross-signal discoveries */}
      {fusionInsights.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="text-base">🧬</span>
            {lang === 'zh' ? '综合分析' : lang === 'en' ? 'Combined Analysis' : '종합 분석'}
          </h2>
          <div className="flex flex-col gap-4">
            {fusionInsights.map((fi) => (
              <div key={fi.id} className="rounded-2xl border border-forest/25 bg-forest-light/20 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{fi.emoji}</span>
                  <span className="text-xs font-semibold text-forest">{fi.labelText}</span>
                </div>
                <p className="text-sm leading-relaxed">{fi.text}</p>

                {/* Fusion KPs */}
                {fi.resolvedKps.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    {fi.resolvedKps.map((kp) => (
                      <Link
                        key={kp.id}
                        to={`/section/${kp.sectionSlug}/${kp.subSectionSlug}#${kp.id}`}
                        className="group flex items-center gap-2.5 rounded-lg border border-stone-border/60 dark:border-white/10 bg-white/50 dark:bg-white/5 px-2.5 py-2 hover:border-forest/30 hover:bg-white/80 dark:hover:bg-white/10 transition-colors text-xs"
                      >
                        <Icon name="book" size={12} className="text-forest shrink-0" />
                        <span className="font-medium truncate">{t(kp.title)}</span>
                        <Icon name="chevronRight" size={12} className="text-text-secondary shrink-0 ml-auto group-hover:text-forest" />
                      </Link>
                    ))}
                  </div>
                )}

                {/* Fusion Articles */}
                {fi.resolvedArticles.length > 0 && (
                  <div className="mt-3 flex gap-2.5 overflow-x-auto scrollbar-hide">
                    {fi.resolvedArticles.map((article) => (
                      <div key={article.slug} className="w-[200px] shrink-0">
                        <ArticleCard article={article} variant="small" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prescriptions */}
      {prescriptions.map(({ symId, baseDiag, appendText, actionText, styleNote, crossNotes, resolvedKps, resolvedArticles }) => (
        <div key={symId} className="rounded-2xl border border-stone-border bg-stone-card p-5 mb-5">
          {/* Diagnosis */}
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Icon name="lightbulb" size={16} className="text-forest" />
            {lang === 'zh' ? '诊断' : lang === 'en' ? 'Diagnosis' : '진단'}
          </h2>
          <p className="text-sm leading-relaxed mb-2">{baseDiag}</p>
          {appendText && <p className="text-sm leading-relaxed text-text-secondary">{appendText}</p>}

          {/* Style-specific note */}
          {styleNote && (
            <div className="mt-3 rounded-lg bg-blue-50/60 dark:bg-blue-900/10 border border-blue-200/40 dark:border-blue-800/30 p-3">
              <div className="flex gap-2">
                <Icon name="info" size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-0.5">
                    {lang === 'zh' ? `针对${styleLabels[0] || '你的攀爬方式'}的建议` : lang === 'en' ? `For ${styleLabels[0] || 'your style'}` : `${styleLabels[0] || '스타일'}에 대한 조언`}
                  </p>
                  <p className="text-xs leading-relaxed">{styleNote}</p>
                </div>
              </div>
            </div>
          )}

          {/* Cross-check warnings */}
          {crossNotes.length > 0 && (
            <div className="mt-3 space-y-2">
              {crossNotes.map((cn, i) => (
                <div key={i} className="flex gap-2 rounded-lg bg-amber-light/60 border border-amber/20 p-3">
                  <Icon name="alertTriangle" size={14} className="text-amber shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">{cn.note}</p>
                </div>
              ))}
            </div>
          )}

          {/* Action Plan */}
          {actionText && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                {lang === 'zh' ? '行动建议' : lang === 'en' ? 'Action Plan' : '실행 계획'}
              </h3>
              <div className="rounded-lg bg-forest-light/40 border border-forest/20 p-3">
                <p className="text-sm leading-relaxed">{actionText}</p>
              </div>
            </div>
          )}

          {/* Recommended KPs — clickable links to section pages */}
          {resolvedKps.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                {lang === 'zh' ? '推荐知识点' : lang === 'en' ? 'Recommended Knowledge' : '추천 지식'}
              </h3>
              <div className="flex flex-col gap-2">
                {resolvedKps.map((kp) => (
                  <Link
                    key={kp.id}
                    to={`/section/${kp.sectionSlug}/${kp.subSectionSlug}#${kp.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-stone-border dark:border-white/10 bg-stone-bg/50 dark:bg-white/5 px-3 py-2.5 hover:border-forest/30 hover:bg-forest-light/20 dark:hover:bg-white/10 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-lg bg-forest/10 flex items-center justify-center shrink-0 group-hover:bg-forest/20 transition-colors">
                      <Icon name="book" size={14} className="text-forest" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium leading-tight truncate">{t(kp.title)}</div>
                      <div className="text-xs text-text-secondary truncate mt-0.5">
                        {t(kp.sectionTitle)} › {t(kp.subSectionTitle)}
                      </div>
                    </div>
                    <Icon name="chevronRight" size={14} className="text-text-secondary shrink-0 group-hover:text-forest transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Articles — using ArticleCard */}
          {resolvedArticles.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                {lang === 'zh' ? '推荐文章' : lang === 'en' ? 'Recommended Articles' : '추천 기사'}
              </h3>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
                {resolvedArticles.map((article) => (
                  <div key={article.slug} className="w-[220px] shrink-0">
                    <ArticleCard article={article} variant="small" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Saved confirmation */}
      <div className="rounded-2xl border border-forest/20 bg-forest-light/30 p-5 text-center mb-8">
        <p className="text-sm font-medium mb-1 flex items-center justify-center gap-2">
          ✓ {lang === 'zh' ? '诊断结果已保存' : lang === 'en' ? 'Results saved' : '결과가 저장되었어요'}
        </p>
        <p className="text-xs text-text-secondary">
          {lang === 'zh'
            ? '你可以在个人主页随时查看历史诊断'
            : lang === 'en'
            ? 'View your diagnosis history anytime on your profile'
            : '프로필에서 언제든지 진단 기록을 확인할 수 있어요'}
        </p>
      </div>

      {/* Back to home */}
      <div className="text-center pb-12">
        <Link to="/" className="text-sm text-forest hover:underline">
          ← {lang === 'zh' ? '返回首页' : lang === 'en' ? 'Back to home' : '홈으로 돌아가기'}
        </Link>
        <span className="mx-3 text-stone-border">|</span>
        <button
          type="button"
          onClick={onRetake}
          className="text-sm text-forest hover:underline cursor-pointer"
        >
          {lang === 'zh' ? '重新诊断' : lang === 'en' ? 'Retake diagnosis' : '다시 진단하기'}
        </button>
      </div>
    </div>
  )
}

/* ───────────── Auth Gate for Diagnosis ───────────── */

function DiagnosisAuthGate({ lang, signIn, signUp, onClose }) {
  const [tab, setTab] = useState('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const tt = (zh, en, ko) => lang === 'zh' ? zh : lang === 'en' ? en : ko

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (tab === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
      } else if (tab === 'register') {
        if (!username.trim()) {
          throw { message: tt('请输入昵称', 'Please enter a nickname', '닉네임을 입력해 주세요') }
        }
        const { error } = await signUp(email, password, username.trim())
        if (error) throw error
        setMessage(tt(
          '注册成功！请查看邮箱确认链接。',
          'Registration successful! Check your email for confirmation.',
          '가입 성공! 이메일에서 확인 링크를 확인해 주세요.'
        ))
      }
    } catch (err) {
      setError(err.message || tt('操作失败，请重试', 'Failed. Please try again.', '실패했어요. 다시 시도해 주세요.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-stone-card rounded-2xl border border-stone-border shadow-xl w-full max-w-md overflow-hidden">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md hover:bg-stone-bg transition-colors z-10"
        >
          <Icon name="x" size={18} className="text-text-secondary" />
        </button>

        <div className="p-6 pt-8">
          {/* 测试介绍头部 */}
          <div className="text-center mb-5">
            <div className="text-4xl mb-2">🐒</div>
            <h2 className="text-xl font-bold">
              {tt('测测你的攀岩动物人格', 'Find Your Climbing Animal', '나의 클라이밍 동물 찾기')}
            </h2>
            <p className="text-xs text-text-secondary mt-1.5">
              {tt(
                '注册后即可开始测试，结果会保存到你的账号',
                'Sign up to start the test — results saved to your account',
                '가입하면 테스트 시작, 결과가 계정에 저장돼요'
              )}
            </p>
          </div>

          {/* Tab 切换 */}
          <div className="flex gap-1 bg-stone-bg rounded-lg p-1 mb-5">
            <button
              onClick={() => { setTab('register'); setError(''); setMessage('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === 'register' ? 'bg-stone-card shadow-sm text-text-primary' : 'text-text-secondary'
              }`}
            >
              {tt('注册', 'Sign Up', '회원가입')}
            </button>
            <button
              onClick={() => { setTab('login'); setError(''); setMessage('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === 'login' ? 'bg-stone-card shadow-sm text-text-primary' : 'text-text-secondary'
              }`}
            >
              {tt('已有账号', 'Have Account', '로그인')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {tab === 'register' && (
              <div>
                <label className="block text-sm font-medium mb-1">{tt('昵称', 'Nickname', '닉네임')}</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={tt('你的攀岩昵称', 'Your climbing nickname', '클라이밍 닉네임')}
                  className="w-full px-3 py-2.5 rounded-lg bg-stone-bg border border-stone-border text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">{tt('邮箱', 'Email', '이메일')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2.5 rounded-lg bg-stone-bg border border-stone-border text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{tt('密码', 'Password', '비밀번호')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === 'register'
                  ? tt('至少 6 位', 'At least 6 characters', '6자 이상')
                  : tt('输入密码', 'Enter password', '비밀번호 입력')}
                minLength={tab === 'register' ? 6 : undefined}
                className="w-full px-3 py-2.5 rounded-lg bg-stone-bg border border-stone-border text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            {message && (
              <p className="text-sm text-forest bg-forest-light rounded-lg px-3 py-2">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors disabled:opacity-50"
            >
              {loading
                ? tt('处理中...', 'Processing...', '처리 중...')
                : tab === 'register'
                ? tt('注册并开始测试', 'Sign Up & Start Test', '가입하고 테스트 시작')
                : tt('登录并开始测试', 'Log In & Start Test', '로그인하고 테스트 시작')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

/* ───────────── Main Page ───────────── */

const EMPTY_ANSWERS = {
  gym: null,
  level: null,
  style: [],
  bottleneck: [],
  rating: {},
  symptom: [],
  goal: null,
}

export default function DiagnosisPage() {
  const { lang, t } = useApp()
  const { user, loading: authLoading, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState(EMPTY_ANSWERS)
  const [showResult, setShowResult] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingPrev, setLoadingPrev] = useState(true)

  // On mount: load last completed result from Supabase
  useEffect(() => {
    if (!user) { setLoadingPrev(false); return }
    getLatestDiagnosis().then(({ data }) => {
      if (data?.answers) {
        setAnswers(data.answers)
        setShowResult(true)
      }
      setLoadingPrev(false)
    })
  }, [user])

  const steps = diagnosisTree.steps
  const totalSteps = steps.length

  // Current step config
  const step = steps[currentStep]

  const updateAnswer = useCallback((key, val) => {
    setAnswers((prev) => ({ ...prev, [key]: val }))
  }, [])

  // Can proceed to next step?
  const canProceed = useMemo(() => {
    if (!step) return false
    const val = answers[step.id]
    switch (step.type) {
      case 'single': return val !== null && val !== undefined
      case 'multi': return Array.isArray(val) && val.length > 0
      case 'rating': {
        const dims = step.dimensions || []
        return dims.every((d) => val && val[d.id] && val[d.id] > 0)
      }
      case 'conditional': return Array.isArray(val) && val.length > 0
      default: return false
    }
  }, [step, answers])

  const handleNext = async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      // Save to Supabase
      if (user) {
        setSaving(true)
        const persona = matchPersona(answers, lang)
        const fusions = evaluateFusionRules(answers, lang)
        await saveDiagnosisResult({
          answers,
          personaId: persona?.id || null,
          fusionRuleIds: fusions.map((f) => f.id),
        })
        setSaving(false)
      }

      setShowResult(true)
    }
  }

  const handleBack = () => {
    if (showResult) {
      setShowResult(false)
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  // Auth gate: show custom auth modal instead of the questionnaire
  if (!authLoading && !user) {
    return <DiagnosisAuthGate
      lang={lang}
      signIn={signIn}
      signUp={signUp}
      onClose={() => navigate('/')}
    />
  }

  // Loading previous result from Supabase
  if (loadingPrev) {
    return (
      <div className="relative max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-16 text-text-secondary text-sm">
          {lang === 'zh' ? '加载中...' : lang === 'en' ? 'Loading...' : '로딩 중...'}
        </div>
      </div>
    )
  }

  // Show result page (either from Supabase or just completed)
  if (showResult) {
    return (
      <div className="relative max-w-6xl mx-auto px-4 py-8">
        <PageSEO
          title={lang === 'zh' ? '你的攀岩动物人格' : lang === 'en' ? 'Your Climbing Animal' : '나의 클라이밍 동물'}
          path="/diagnosis"
        />
        <PrescriptionPage answers={answers} lang={lang} t={t} onRetake={() => { setAnswers(EMPTY_ANSWERS); setCurrentStep(0); setShowResult(false) }} />
      </div>
    )
  }

  return (
    <div className="relative max-w-6xl mx-auto px-4 py-8">
      <PageSEO
        title={lang === 'zh' ? '测测你的攀岩动物人格' : lang === 'en' ? 'Find Your Climbing Animal' : '나의 클라이밍 동물 찾기'}
        path="/diagnosis"
      />

      <div className="max-w-lg mx-auto">
        {/* Back link */}
        <div className="mb-6">
          {currentStep === 0 ? (
            <Link to="/" className="text-sm text-text-secondary hover:text-forest transition-colors flex items-center gap-1">
              <Icon name="chevronLeft" size={14} />
              {lang === 'zh' ? '返回首页' : lang === 'en' ? 'Back to home' : '홈으로'}
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-text-secondary hover:text-forest transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Icon name="chevronLeft" size={14} />
              {lang === 'zh' ? '上一步' : lang === 'en' ? 'Previous' : '이전'}
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full flex-1 transition-colors duration-300 ${
                i <= currentStep ? 'bg-forest' : 'bg-stone-border'
              }`}
            />
          ))}
        </div>

        {/* Step counter */}
        <div className="text-xs text-text-secondary mb-2">
          {currentStep + 1} / {totalSteps}
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold mb-1">{step.title[lang] || step.title.zh}</h1>
        <p className="text-sm text-text-secondary mb-6">{step.subtitle[lang] || step.subtitle.zh}</p>

        {/* Step content */}
        {step.type === 'single' && (
          <SingleSelectStep
            step={step}
            value={answers[step.id]}
            onChange={(v) => updateAnswer(step.id, v)}
            lang={lang}
            gradeHintFn={step.id === 'level' && answers.gym ? (levelId) => getGradeHint(answers.gym, levelId, lang) : null}
          />
        )}
        {step.type === 'multi' && (
          <MultiSelectStep step={step} value={answers[step.id]} onChange={(v) => updateAnswer(step.id, v)} lang={lang} />
        )}
        {step.type === 'rating' && (
          <RatingStep step={step} value={answers[step.id]} onChange={(v) => updateAnswer(step.id, v)} lang={lang} />
        )}
        {step.type === 'conditional' && (
          <SymptomStep
            step={step}
            bottlenecks={answers.bottleneck || []}
            value={answers[step.id]}
            onChange={(v) => updateAnswer(step.id, v)}
            lang={lang}
          />
        )}

        {/* Next button */}
        <div className="mt-8 mb-12">
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer
              ${canProceed
                ? 'bg-forest text-white hover:bg-forest/90 shadow-sm'
                : 'bg-stone-border text-text-secondary cursor-not-allowed'}`}
          >
            {currentStep < totalSteps - 1
              ? (lang === 'zh' ? '下一步' : lang === 'en' ? 'Next' : '다음')
              : (lang === 'zh' ? '查看诊断结果' : lang === 'en' ? 'See my results' : '진단 결과 보기')}
          </button>
        </div>
      </div>
    </div>
  )
}
