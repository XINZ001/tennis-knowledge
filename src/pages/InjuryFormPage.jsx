import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { submitInjuryReport, updateInjuryReport, fetchInjuryReport } from '../lib/injuries'
import { uploadMedia } from '../lib/community'
import { supabase } from '../lib/supabase'
import {
  BODY_PARTS, INJURY_TYPES, CLIMBING_TYPES,
  EXPERIENCE_LEVELS, FREQUENCY_OPTIONS, RECOVERY_DURATIONS,
} from '../lib/injuries'
import { Icon } from '../utils/icons'

function SelectField({ label, value, onChange, options, lang, required, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2.5 rounded-lg bg-stone-bg border border-stone-border text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors"
      >
        <option value="">{placeholder || '请选择'}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {lang === 'zh' ? opt.label.zh : lang === 'en' ? opt.label.en : (opt.label.ko || opt.label.en)}
          </option>
        ))}
      </select>
    </div>
  )
}

function MultiSelectChips({ label, selected, onChange, options, lang }) {
  const toggle = (val) => {
    onChange(
      selected.includes(val)
        ? selected.filter((v) => v !== val)
        : [...selected, val]
    )
  }
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                active
                  ? 'bg-forest text-white border-forest'
                  : 'bg-stone-bg border-stone-border hover:border-forest text-text-secondary'
              }`}
            >
              {lang === 'zh' ? opt.label.zh : lang === 'en' ? opt.label.en : (opt.label.ko || opt.label.en)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TriStateField({ label, value, onChange, lang }) {
  const opts = [
    { val: 'yes', text: { zh: '是', en: 'Yes', ko: '예' } },
    { val: 'no', text: { zh: '否', en: 'No', ko: '아니오' } },
    { val: 'unsure', text: { zh: '不确定', en: 'Unsure', ko: '잘 모르겠음' } },
  ]
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex gap-2">
        {opts.map((o) => (
          <button
            key={o.val}
            type="button"
            onClick={() => onChange(o.val)}
            className={`px-4 py-1.5 rounded-lg text-sm border transition-colors ${
              value === o.val
                ? 'bg-forest text-white border-forest'
                : 'bg-stone-bg border-stone-border hover:border-forest text-text-secondary'
            }`}
          >
            {lang === 'zh' ? o.text.zh : lang === 'en' ? o.text.en : o.text.ko}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function InjuryFormPage() {
  const { id: editId } = useParams()
  const isEdit = Boolean(editId)
  const { user } = useAuth()
  const { lang } = useApp()
  const { onOpenAuth } = useOutletContext()
  const navigate = useNavigate()

  // 必填
  const [bodyParts, setBodyParts] = useState([])
  const [injuryType, setInjuryType] = useState('')
  const [description, setDescription] = useState('')
  const [injuryCause, setInjuryCause] = useState('')
  const [climbingType, setClimbingType] = useState('')

  // 攀岩背景
  const [usualGrade, setUsualGrade] = useState('')
  const [injuryGrade, setInjuryGrade] = useState('')
  const [experience, setExperience] = useState('')
  const [frequency, setFrequency] = useState('')

  // 选填
  const [didWarmUp, setDidWarmUp] = useState('')
  const [wasFatigued, setWasFatigued] = useState('')
  const [soughtMedical, setSoughtMedical] = useState(null)
  const [diagnosis, setDiagnosis] = useState('')
  const [recoveryDuration, setRecoveryDuration] = useState('')
  const [advice, setAdvice] = useState('')

  // "其他"自定义输入
  const [otherBodyPart, setOtherBodyPart] = useState('')
  const [otherInjuryType, setOtherInjuryType] = useState('')

  // 媒体
  const [files, setFiles] = useState([])

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 攀岩档案数据（用于自动填充和回写）
  const [climbingProfile, setClimbingProfile] = useState(null)

  const [loadingEdit, setLoadingEdit] = useState(isEdit)

  // 编辑模式：加载已有数据
  useEffect(() => {
    if (!isEdit || !user) return
    async function loadExisting() {
      const { data } = await fetchInjuryReport(editId)
      if (data && data.user_id === user.id) {
        const d = data.injury_details?.[0] || data.injury_details
        setDescription(data.description || '')
        if (d) {
          // 处理 body_parts 中的 other:xxx 格式
          const bps = (d.body_parts || []).map(bp => {
            if (bp.startsWith('other:')) { setOtherBodyPart(bp.slice(6)); return 'other' }
            return bp
          })
          setBodyParts(bps)
          // 处理 injury_type 中的 other:xxx 格式
          if (d.injury_type?.startsWith('other:')) {
            setOtherInjuryType(d.injury_type.slice(6))
            setInjuryType('other')
          } else {
            setInjuryType(d.injury_type || '')
          }
          setInjuryCause(d.injury_cause || '')
          setClimbingType(d.climbing_type || '')
          setUsualGrade(d.usual_grade || '')
          setInjuryGrade(d.injury_grade || '')
          setExperience(d.climbing_experience || '')
          setFrequency(d.climbing_frequency || '')
          setDidWarmUp(d.did_warm_up || '')
          setWasFatigued(d.was_fatigued || '')
          setSoughtMedical(d.sought_medical)
          setDiagnosis(d.diagnosis || '')
          setRecoveryDuration(d.recovery_duration || '')
          setAdvice(d.advice_to_others || '')
        }
      }
      setLoadingEdit(false)
    }
    loadExisting()
  }, [isEdit, editId, user])

  // 新建模式：自动填充攀岩档案
  useEffect(() => {
    if (!user || isEdit) return
    async function loadProfile() {
      const { data } = await supabase
        .from('climbing_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (data) {
        setClimbingProfile(data)
        if (!experience && data.experience) setExperience(data.experience)
        if (!frequency && data.frequency) setFrequency(data.frequency)
        if (!usualGrade) {
          const grade = data.boulder_grade || data.sport_grade
          if (grade) setUsualGrade(grade)
        }
      }
    }
    loadProfile()
  }, [user])

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Icon name="alertTriangle" size={48} className="text-amber mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">{lang === 'zh' ? '需要登录' : lang === 'en' ? 'Login Required' : '로그인 필요'}</h2>
        <p className="text-text-secondary mb-6">{lang === 'zh' ? '请先登录后再提交你的伤痛经历。' : lang === 'en' ? 'Please sign in before submitting your injury story.' : '부상 경험을 제출하기 전에 로그인해 주세요.'}</p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 rounded-lg bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors"
        >
          {lang === 'zh' ? '登录 / 注册' : lang === 'en' ? 'Sign in / Register' : '로그인 / 회원가입'}
        </button>
      </div>
    )
  }

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files)
    if (files.length + newFiles.length > 5) {
      setError('最多上传 5 个文件')
      return
    }
    setFiles([...files, ...newFiles])
  }

  const removeFile = (idx) => {
    setFiles(files.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (bodyParts.length === 0) { setError('请选择受伤部位'); return }
    setError('')
    setSubmitting(true)

    // 处理"其他"自定义值
    const finalBodyParts = bodyParts.map(bp =>
      bp === 'other' && otherBodyPart ? `other:${otherBodyPart}` : bp
    )
    const finalInjuryType = injuryType === 'other' && otherInjuryType
      ? `other:${otherInjuryType}`
      : injuryType

    const bodyPartLabel = bodyParts[0] === 'other' && otherBodyPart
      ? otherBodyPart
      : BODY_PARTS.find(b => b.value === bodyParts[0])?.label.zh || bodyParts[0]
    const injuryTypeLabel = injuryType === 'other' && otherInjuryType
      ? otherInjuryType
      : INJURY_TYPES.find(t => t.value === injuryType)?.label.zh || injuryType

    const payload = {
      title: `${bodyPartLabel}${injuryTypeLabel}`,
      description,
      bodyParts: finalBodyParts,
      injuryType: finalInjuryType,
      injuryCause,
      climbingType,
      usualGrade,
      injuryGrade,
      climbingExperience: experience,
      climbingFrequency: frequency,
      didWarmUp: didWarmUp || null,
      wasFatigued: wasFatigued || null,
      soughtMedical: soughtMedical,
      diagnosis: diagnosis || null,
      recoveryDuration: recoveryDuration || null,
      adviceToOthers: advice || null,
    }

    let resultId
    if (isEdit) {
      const { error: updateError } = await updateInjuryReport(editId, payload)
      if (updateError) {
        setError(updateError.message)
        setSubmitting(false)
        return
      }
      resultId = editId
    } else {
      const { data, error: submitError } = await submitInjuryReport(payload)
      if (submitError) {
        setError(submitError.message)
        setSubmitting(false)
        return
      }
      resultId = data.post.id

      // 上传媒体文件
      if (files.length > 0 && resultId) {
        for (let i = 0; i < files.length; i++) {
          await uploadMedia(resultId, files[i], i)
        }
      }
    }

    // 将本次填写的数据回写到攀岩档案（仅填充空字段）
    try {
      const updates = {}
      if (experience && (!climbingProfile || !climbingProfile.experience)) {
        updates.experience = experience
      }
      if (frequency && (!climbingProfile || !climbingProfile.frequency)) {
        updates.frequency = frequency
      }
      if (usualGrade && climbingProfile && !climbingProfile.boulder_grade && !climbingProfile.sport_grade) {
        // 尝试判断是抱石还是运动攀难度
        if (usualGrade.toUpperCase().startsWith('V')) {
          updates.boulder_grade = usualGrade
        } else {
          updates.sport_grade = usualGrade
        }
      }
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString()
        if (climbingProfile) {
          await supabase.from('climbing_profiles').update(updates).eq('user_id', user.id)
        } else {
          await supabase.from('climbing_profiles').insert({ user_id: user.id, ...updates })
        }
      }
    } catch (e) {
      // 回写失败不影响主流程
    }

    setSubmitting(false)
    navigate(`/injuries/${resultId}`)
  }

  if (loadingEdit) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-text-secondary">加载中...</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">
        {isEdit
          ? (lang === 'zh' ? '编辑伤痛记录' : lang === 'en' ? 'Edit Injury Report' : '부상 기록 편집')
          : (lang === 'zh' ? '分享你的伤痛经历' : lang === 'en' ? 'Share Your Injury Story' : '부상 경험 공유하기')
        }
      </h1>
      <p className="text-text-secondary text-sm mb-8">
        {isEdit
          ? (lang === 'zh' ? '修改你之前提交的伤痛记录。' : lang === 'en' ? 'Edit your previously submitted injury report.' : '이전에 제출한 부상 기록을 수정하세요.')
          : (lang === 'zh' ? '你的经历可以帮助其他攀岩者了解风险、做好预防。所有提交内容将公开展示。' : lang === 'en' ? 'Your story can help other climbers understand risks and prevent injuries. All submissions are publicly displayed.' : '여러분의 경험은 다른 클라이머들이 위험을 이해하고 부상을 예방하는 데 도움이 됩니다. 모든 제출 내용은 공개됩니다.')
        }
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── 受伤信息 ── */}
        <section className="bg-stone-card rounded-xl border border-stone-border p-6 space-y-5">
          <h2 className="font-semibold text-lg">{lang === 'zh' ? '受伤信息' : lang === 'en' ? 'Injury Info' : '부상 정보'}</h2>

          <MultiSelectChips
            label={lang === 'zh' ? '受伤部位（可多选）*' : lang === 'en' ? 'Body Part (multi-select) *' : '부상 부위 (복수 선택) *'}
            selected={bodyParts}
            onChange={setBodyParts}
            options={BODY_PARTS}
            lang={lang}
          />
          {bodyParts.includes('other') && (
            <div className="-mt-2">
              <input
                type="text"
                value={otherBodyPart}
                onChange={(e) => setOtherBodyPart(e.target.value)}
                placeholder={lang === 'zh' ? '请输入具体部位' : lang === 'en' ? 'Please specify' : '구체적인 부위를 입력하세요'}
                className="w-full px-3 py-2.5 rounded-lg bg-stone-bg border border-stone-border text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors"
              />
            </div>
          )}

          <SelectField
            label={lang === 'zh' ? '受伤类型 *' : lang === 'en' ? 'Injury Type *' : '부상 유형 *'}
            value={injuryType}
            onChange={setInjuryType}
            options={INJURY_TYPES}
            lang={lang}
            required
          />
          {injuryType === 'other' && (
            <div className="-mt-2">
              <input
                type="text"
                value={otherInjuryType}
                onChange={(e) => setOtherInjuryType(e.target.value)}
                placeholder={lang === 'zh' ? '请输入具体伤害类型' : lang === 'en' ? 'Please specify' : '구체적인 부상 유형을 입력하세요'}
                className="w-full px-3 py-2.5 rounded-lg bg-stone-bg border border-stone-border text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">{lang === 'zh' ? '受伤经过 *' : lang === 'en' ? 'What Happened *' : '부상 경위 *'}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={lang === 'zh' ? '当时发生了什么？怎么受伤的？' : lang === 'en' ? 'What happened? How did you get injured?' : '무슨 일이 있었나요? 어떻게 다쳤나요?'}
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg bg-stone-bg border border-stone-border text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors resize-y"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{lang === 'zh' ? '自己认为的原因 *' : lang === 'en' ? 'Perceived Cause *' : '본인이 생각하는 원인 *'}</label>
            <textarea
              value={injuryCause}
              onChange={(e) => setInjuryCause(e.target.value)}
              placeholder={lang === 'zh' ? '你觉得是什么导致了这次受伤？' : lang === 'en' ? 'What do you think caused the injury?' : '부상의 원인이 무엇이라고 생각하나요?'}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg bg-stone-bg border border-stone-border text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors resize-y"
              required
            />
          </div>

          <SelectField
            label={lang === 'zh' ? '攀岩类型 *' : lang === 'en' ? 'Climbing Type *' : '클라이밍 유형 *'}
            value={climbingType}
            onChange={setClimbingType}
            options={CLIMBING_TYPES}
            lang={lang}
            required
          />
        </section>

        {/* ── 攀岩背景（关于你） ── */}
        <section className="bg-stone-card rounded-xl border border-stone-border p-6 space-y-5">
          <h2 className="font-semibold text-lg">{lang === 'zh' ? '攀岩背景' : lang === 'en' ? 'Climbing Background' : '클라이밍 배경'}</h2>
          {climbingProfile && (experience || usualGrade || frequency) && (
            <p className="text-xs text-text-secondary -mt-2">{lang === 'zh' ? '以下信息已从你的攀岩档案中自动填入' : lang === 'en' ? 'Auto-filled from your climbing profile' : '클라이밍 프로필에서 자동으로 입력되었습니다'}</p>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">{lang === 'zh' ? '日常水平 *' : lang === 'en' ? 'Usual Grade *' : '평소 등급 *'}</label>
            <input
              type="text"
              value={usualGrade}
              onChange={(e) => setUsualGrade(e.target.value)}
              placeholder="如 V3, 5.10a"
              className="w-full px-3 py-2.5 rounded-lg bg-stone-bg border border-stone-border text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label={lang === 'zh' ? '攀岩年限 *' : lang === 'en' ? 'Experience *' : '경력 *'}
              value={experience}
              onChange={setExperience}
              options={EXPERIENCE_LEVELS}
              lang={lang}
              required
            />
            <SelectField
              label={lang === 'zh' ? '攀岩频率 *' : lang === 'en' ? 'Frequency *' : '빈도 *'}
              value={frequency}
              onChange={setFrequency}
              options={FREQUENCY_OPTIONS}
              lang={lang}
              required
            />
          </div>
        </section>

        {/* ── 受伤场景（受伤那一刻） ── */}
        <section className="bg-stone-card rounded-xl border border-stone-border p-6 space-y-5">
          <h2 className="font-semibold text-lg">{lang === 'zh' ? '受伤场景' : lang === 'en' ? 'Injury Context' : '부상 상황'}</h2>

          <div>
            <label className="block text-sm font-medium mb-1.5">{lang === 'zh' ? '受伤时攀爬的难度 *' : lang === 'en' ? 'Grade at Injury *' : '부상 시 등급 *'}</label>
            <input
              type="text"
              value={injuryGrade}
              onChange={(e) => setInjuryGrade(e.target.value)}
              placeholder="如 V5, 5.11c"
              className="w-full px-3 py-2.5 rounded-lg bg-stone-bg border border-stone-border text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors"
              required
            />
          </div>

          <TriStateField label={lang === 'zh' ? '受伤前是否热身？' : lang === 'en' ? 'Did you warm up?' : '부상 전에 워밍업을 했나요?'} value={didWarmUp} onChange={setDidWarmUp} lang={lang} />
          <TriStateField label={lang === 'zh' ? '当时是否处于疲劳状态？' : lang === 'en' ? 'Were you fatigued?' : '피로한 상태였나요?'} value={wasFatigued} onChange={setWasFatigued} lang={lang} />
        </section>

        {/* ── 就医与恢复 ── */}
        <section className="bg-stone-card rounded-xl border border-stone-border p-6 space-y-5">
          <h2 className="font-semibold text-lg">
            {lang === 'zh' ? '就医与恢复' : lang === 'en' ? 'Medical & Recovery' : '의료 및 회복'}
            <span className="text-sm font-normal text-text-secondary ml-2">{lang === 'zh' ? '（选填）' : lang === 'en' ? '(optional)' : '(선택)'}</span>
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2">{lang === 'zh' ? '是否就医？' : lang === 'en' ? 'Sought medical attention?' : '의료 진료를 받았나요?'}</label>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setSoughtMedical(val)}
                  className={`px-4 py-1.5 rounded-lg text-sm border transition-colors ${
                    soughtMedical === val
                      ? 'bg-forest text-white border-forest'
                      : 'bg-stone-bg border-stone-border hover:border-forest text-text-secondary'
                  }`}
                >
                  {val ? (lang === 'zh' ? '是' : lang === 'en' ? 'Yes' : '예') : (lang === 'zh' ? '否' : lang === 'en' ? 'No' : '아니오')}
                </button>
              ))}
            </div>
          </div>

          {soughtMedical && (
            <div>
              <label className="block text-sm font-medium mb-1.5">{lang === 'zh' ? '诊断结果' : lang === 'en' ? 'Diagnosis' : '진단 결과'}</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder={lang === 'zh' ? '医生怎么说的？' : lang === 'en' ? 'What did the doctor say?' : '의사가 뭐라고 했나요?'}
                className="w-full px-3 py-2.5 rounded-lg bg-stone-bg border border-stone-border text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors"
              />
            </div>
          )}

          <SelectField
            label={lang === 'zh' ? '恢复时长' : lang === 'en' ? 'Recovery Duration' : '회복 기간'}
            value={recoveryDuration}
            onChange={setRecoveryDuration}
            options={RECOVERY_DURATIONS}
            lang={lang}
          />
        </section>

        {/* ── 经验分享 ── */}
        <section className="bg-stone-card rounded-xl border border-stone-border p-6 space-y-5">
          <h2 className="font-semibold text-lg">
            {lang === 'zh' ? '经验分享' : lang === 'en' ? 'Advice' : '경험 공유'}
            <span className="text-sm font-normal text-text-secondary ml-2">{lang === 'zh' ? '（选填，鼓励填写）' : lang === 'en' ? '(optional, encouraged)' : '(선택, 권장)'}</span>
          </h2>

          <div>
            <label className="block text-sm font-medium mb-1.5">{lang === 'zh' ? '给其他攀岩者的建议' : lang === 'en' ? 'Advice for other climbers' : '다른 클라이머에게 전하는 조언'}</label>
            <textarea
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              placeholder={lang === 'zh' ? '经历这次受伤后，你想提醒其他人什么？' : lang === 'en' ? 'What would you like to remind others after this injury?' : '이 부상을 겪은 후, 다른 사람들에게 어떤 조언을 하고 싶나요?'}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-stone-bg border border-stone-border text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors resize-y"
            />
          </div>
        </section>

        {/* ── 媒体上传（仅新建时） ── */}
        {!isEdit && <section className="bg-stone-card rounded-xl border border-stone-border p-6 space-y-4">
          <h2 className="font-semibold text-lg">
            {lang === 'zh' ? '照片 / 视频' : lang === 'en' ? 'Photos / Videos' : '사진 / 동영상'}
            <span className="text-sm font-normal text-text-secondary ml-2">{lang === 'zh' ? '（选填，最多 5 个）' : lang === 'en' ? '(optional, max 5)' : '(선택, 최대 5개)'}</span>
          </h2>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-stone-bg rounded-lg text-sm">
                  <Icon name={f.type.startsWith('video') ? 'camera' : 'camera'} size={14} className="text-text-secondary" />
                  <span className="max-w-[120px] truncate">{f.name}</span>
                  <button type="button" onClick={() => removeFile(i)} className="text-red-400 hover:text-red-600">
                    <Icon name="x" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length < 5 && (
            <label className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-stone-border rounded-xl cursor-pointer hover:border-forest hover:bg-forest-light/30 transition-colors">
              <Icon name="plus" size={20} className="text-text-secondary" />
              <span className="text-sm text-text-secondary">点击上传照片或视频</span>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </section>}

        {/* 错误提示 */}
        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}

        {/* 提交 */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-text-secondary">
            {isEdit
              ? (lang === 'zh' ? '修改后将即时更新' : lang === 'en' ? 'Changes will be updated immediately' : '수정 사항이 즉시 반영됩니다')
              : (lang === 'zh' ? '提交即表示同意公开展示此内容' : lang === 'en' ? 'By submitting, you agree to display this content publicly' : '제출 시 이 내용이 공개됨에 동의하는 것입니다')}
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 rounded-xl bg-forest text-white font-medium hover:bg-forest-dark transition-colors disabled:opacity-50"
          >
            {submitting
              ? (isEdit ? (lang === 'zh' ? '保存中...' : lang === 'en' ? 'Saving...' : '저장 중...') : (lang === 'zh' ? '提交中...' : lang === 'en' ? 'Submitting...' : '제출 중...'))
              : (isEdit ? (lang === 'zh' ? '保存' : lang === 'en' ? 'Save' : '저장') : (lang === 'zh' ? '提交' : lang === 'en' ? 'Submit' : '제출'))}
          </button>
        </div>
      </form>
    </div>
  )
}
