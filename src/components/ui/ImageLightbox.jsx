import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../../context/AppContext'
import { saveFeedback, extractImageId } from '../../utils/feedbackStore'

const ISSUE_OPTIONS = [
  { key: 'action', zh: '动作错误', en: 'Wrong action/pose', ko: '잘못된 액션/포즈' },
  { key: 'structure', zh: '结构错误', en: 'Structural error', ko: '구조 오류' },
  { key: 'anatomy', zh: '解剖错误', en: 'Anatomy error', ko: '해부학적 오류' },
  { key: 'equipment', zh: '装备外形错误', en: 'Equipment appearance', ko: '장비 외형 오류' },
  { key: 'proportion', zh: '比例错误', en: 'Wrong proportions', ko: '잘못된 비율' },
  { key: 'other', zh: '其他', en: 'Other', ko: '기타' },
]

function FeedbackForm({ imageSrc, onClose, onSubmitted }) {
  const { lang } = useApp()
  const [selected, setSelected] = useState([])
  const [note, setNote] = useState('')

  const toggle = (key) => {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const handleSubmit = () => {
    if (selected.length === 0 && !note.trim()) return
    saveFeedback({
      imageId: extractImageId(imageSrc),
      issues: selected,
      note: note.trim(),
    })
    onSubmitted()
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-10 w-80 bg-white rounded-xl shadow-2xl p-5 animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-sm font-semibold mb-1">
          {lang === 'zh' ? '反馈图片问题' : lang === 'en' ? 'Report Image Issue' : '이미지 문제 신고'}
        </div>
        <div className="text-xs text-text-secondary mb-3">
          {extractImageId(imageSrc)}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {ISSUE_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => toggle(opt.key)}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                selected.includes(opt.key)
                  ? 'bg-forest text-white'
                  : 'bg-stone-sidebar text-text-primary hover:bg-stone-border'
              }`}
            >
              {lang === 'zh' ? opt.zh : lang === 'en' ? opt.en : opt.ko}
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={lang === 'zh' ? '补充说明（可选）' : lang === 'en' ? 'Additional notes (optional)' : '추가 설명 (선택사항)'}
          className="w-full h-20 px-3 py-2 text-xs rounded-lg border border-stone-border bg-stone-sidebar resize-none focus:outline-none focus:border-forest"
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-stone-border hover:bg-stone-sidebar transition-colors"
          >
            {lang === 'zh' ? '取消' : lang === 'en' ? 'Cancel' : '취소'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={selected.length === 0 && !note.trim()}
            className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-forest text-white hover:bg-forest-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {lang === 'zh' ? '提交' : lang === 'en' ? 'Submit' : '제출'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Toast({ message }) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] px-4 py-2 bg-forest text-white text-sm rounded-lg shadow-lg animate-fadeInUp">
      {message}
    </div>
  )
}

export default function ImageLightbox({ images, initialIndex = 0, onClose }) {
  const { lang } = useApp()
  const [index, setIndex] = useState(initialIndex)
  const [showFeedback, setShowFeedback] = useState(false)
  const [toast, setToast] = useState(null)

  const currentSrc = images[index]
  const total = images.length

  const prev = useCallback(() => {
    setIndex(i => (i > 0 ? i - 1 : i))
    setShowFeedback(false)
  }, [])

  const next = useCallback(() => {
    setIndex(i => (i < total - 1 ? i + 1 : i))
    setShowFeedback(false)
  }, [total])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showFeedback) {
          setShowFeedback(false)
        } else {
          onClose()
        }
      }
      if (!showFeedback && e.key === 'ArrowLeft') prev()
      if (!showFeedback && e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, prev, next, showFeedback])

  const handleFeedbackSubmitted = () => {
    setShowFeedback(false)
    setToast(lang === 'zh' ? '反馈已记录，感谢！' : lang === 'en' ? 'Feedback recorded, thanks!' : '피드백이 기록되었어요, 감사합니다!')
    setTimeout(() => setToast(null), 2000)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85" />

      {/* Content column - image + controls together */}
      <div
        className="relative z-10 flex flex-col items-center px-4"
        style={{ maxWidth: '92vw' }}
        onClick={e => e.stopPropagation()}
      >
        <img
          src={currentSrc}
          alt=""
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl animate-scaleIn select-none"
          draggable={false}
        />

        {/* Controls - directly below image */}
        <div className="flex items-center justify-center gap-4 mt-3">
          {/* Navigation */}
          {total > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                disabled={index === 0}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <span className="text-white/70 text-sm tabular-nums min-w-[3rem] text-center">
                {index + 1} / {total}
              </span>
              <button
                onClick={next}
                disabled={index === total - 1}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          )}

          {/* Feedback button */}
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs hover:bg-white/20 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
            {lang === 'zh' ? '反馈问题' : lang === 'en' ? 'Report' : '문제 신고'}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Feedback form */}
      {showFeedback && (
        <FeedbackForm
          imageSrc={currentSrc}
          onClose={() => setShowFeedback(false)}
          onSubmitted={handleFeedbackSubmitted}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} />}
    </div>,
    document.body
  )
}
