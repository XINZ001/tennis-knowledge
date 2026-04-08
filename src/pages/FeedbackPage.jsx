import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { getFeedbacks, clearFeedback, clearAllFeedback } from '../utils/feedbackStore'
import kpRegistry from '../data/kp-registry.json'
import illustrationRegistry from '../data/illustration-registry.json'

const ISSUE_LABELS = {
  action: { zh: '动作错误', en: 'Wrong action/pose', ko: '잘못된 액션/포즈' },
  structure: { zh: '结构错误', en: 'Structural error', ko: '구조 오류' },
  anatomy: { zh: '解剖错误', en: 'Anatomy error', ko: '해부학적 오류' },
  equipment: { zh: '装备外形错误', en: 'Equipment appearance', ko: '장비 외형 오류' },
  proportion: { zh: '比例错误', en: 'Wrong proportions', ko: '잘못된 비율' },
  other: { zh: '其他', en: 'Other', ko: '기타' },
}

// Find the KP entry whose id is the longest prefix match for the imageId
function findKpForImage(imageId) {
  const kps = kpRegistry.knowledgePoints
  let best = null
  for (const kp of kps) {
    if (imageId.startsWith(kp.id) && (!best || kp.id.length > best.id.length)) {
      best = kp
    }
  }
  return best
}

function findImagePath(imageId) {
  for (const [kpId, paths] of Object.entries(illustrationRegistry)) {
    for (const p of paths) {
      if (p.includes(imageId)) return p
    }
  }
  return null
}

export default function FeedbackPage() {
  const { lang } = useApp()
  const [feedbacks, setFeedbacks] = useState(() => getFeedbacks())
  const [copiedToast, setCopiedToast] = useState(false)

  const enriched = useMemo(() =>
    feedbacks.map(fb => ({
      ...fb,
      kp: findKpForImage(fb.imageId),
      imagePath: findImagePath(fb.imageId),
    })),
    [feedbacks]
  )

  const handleDismiss = (imageId) => {
    clearFeedback(imageId)
    setFeedbacks(getFeedbacks())
  }

  const handleClearAll = () => {
    clearAllFeedback()
    setFeedbacks([])
  }

  const handleExport = () => {
    const json = JSON.stringify(feedbacks, null, 2)
    navigator.clipboard.writeText(json).then(() => {
      setCopiedToast(true)
      setTimeout(() => setCopiedToast(false), 2000)
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            {lang === 'zh' ? '图片反馈管理' : lang === 'en' ? 'Image Feedback Admin' : '이미지 피드백 관리'}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {lang === 'zh'
              ? `共 ${feedbacks.length} 条反馈`
              : lang === 'en'
              ? `${feedbacks.length} feedback item${feedbacks.length !== 1 ? 's' : ''}`
              : `${feedbacks.length}개의 피드백`}
          </p>
        </div>
        {feedbacks.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-xs rounded-lg border border-stone-border hover:bg-stone-sidebar transition-colors"
            >
              {lang === 'zh' ? '导出 JSON' : lang === 'en' ? 'Export JSON' : 'JSON 내보내기'}
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
            >
              {lang === 'zh' ? '清空全部' : lang === 'en' ? 'Clear All' : '전체 삭제'}
            </button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {feedbacks.length === 0 && (
        <div className="text-center py-20 text-text-secondary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mx-auto mb-3 opacity-40">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">{lang === 'zh' ? '暂无反馈' : lang === 'en' ? 'No feedback yet' : '피드백 없음'}</p>
        </div>
      )}

      {/* Feedback cards */}
      <div className="space-y-4">
        {enriched.map((fb, i) => (
          <FeedbackCard
            key={`${fb.imageId}-${fb.timestamp}-${i}`}
            fb={fb}
            lang={lang}
            onDismiss={() => handleDismiss(fb.imageId)}
          />
        ))}
      </div>

      {/* Copied toast */}
      {copiedToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-forest text-white text-sm rounded-lg shadow-lg animate-fadeInUp">
          {lang === 'zh' ? '已复制到剪贴板' : lang === 'en' ? 'Copied to clipboard' : '클립보드에 복사됨'}
        </div>
      )}
    </div>
  )
}

function FeedbackCard({ fb, lang, onDismiss }) {
  const t = (zh, en, ko) => lang === 'zh' ? zh : lang === 'en' ? en : (ko || en)

  return (
    <div className="bg-stone-card border border-stone-border rounded-xl p-4 flex gap-4">
      {/* Thumbnail */}
      <div className="shrink-0">
        {fb.imagePath ? (
          <img
            src={fb.imagePath}
            alt={fb.imageId}
            className="w-28 h-28 object-contain rounded-lg bg-stone-sidebar"
          />
        ) : (
          <div className="w-28 h-28 rounded-lg bg-stone-sidebar flex items-center justify-center text-text-secondary text-xs">
            {t('图片未找到', 'Not found', '사진을 찾을 수 없음')}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        {/* Image ID */}
        <p className="text-xs font-mono text-text-secondary truncate">{fb.imageId}</p>

        {/* KP info */}
        {fb.kp && (
          <div className="mt-1">
            <p className="text-sm font-semibold text-text-primary truncate">
              {lang === 'zh' ? fb.kp.title.zh : lang === 'en' ? fb.kp.title.en : (fb.kp.title.ko || fb.kp.title.en)}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {lang === 'zh' ? fb.kp.sectionTitle.zh : lang === 'en' ? fb.kp.sectionTitle.en : (fb.kp.sectionTitle.ko || fb.kp.sectionTitle.en)}
              {' / '}
              {lang === 'zh' ? fb.kp.subSectionTitle.zh : lang === 'en' ? fb.kp.subSectionTitle.en : (fb.kp.subSectionTitle.ko || fb.kp.subSectionTitle.en)}
            </p>
          </div>
        )}

        {/* Issue tags */}
        {fb.issues && fb.issues.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {fb.issues.map(key => {
              const label = ISSUE_LABELS[key]
              return (
                <span
                  key={key}
                  className="px-2 py-0.5 rounded-full text-xs bg-amber-light text-amber"
                >
                  {label ? (lang === 'zh' ? label.zh : lang === 'en' ? label.en : label.ko) : key}
                </span>
              )
            })}
          </div>
        )}

        {/* Note */}
        {fb.note && (
          <p className="mt-2 text-xs text-text-secondary bg-stone-sidebar rounded-lg px-3 py-2">
            {fb.note}
          </p>
        )}

        {/* Footer: timestamp + dismiss */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-text-secondary">
            {new Date(fb.timestamp).toLocaleString(lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : 'ko-KR')}
          </span>
          <button
            onClick={onDismiss}
            className="text-xs text-text-secondary hover:text-red-500 transition-colors"
          >
            {t('移除', 'Dismiss', '제거')}
          </button>
        </div>
      </div>
    </div>
  )
}
