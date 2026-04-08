import { useState, useEffect } from 'react'
import { useParams, Link, useOutletContext } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { fetchInjuryReport, fetchInjuryComments, fetchNextInjuryId, fetchPrevInjuryId, deleteInjuryReport, BODY_PARTS, INJURY_TYPES, CLIMBING_TYPES, EXPERIENCE_LEVELS, FREQUENCY_OPTIONS, RECOVERY_DURATIONS } from '../lib/injuries'
import { toggleLike, createComment } from '../lib/community'
import { supabase } from '../lib/supabase'
import { Icon } from '../utils/icons'
import UserAvatar from '../components/ui/UserAvatar'

function InfoCard({ label, value }) {
  if (!value) return null
  return (
    <div className="bg-stone-bg rounded-lg px-3 py-2">
      <div className="text-xs text-text-secondary mb-0.5">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}

function getLabel(list, value, lang) {
  const found = list.find((item) => item.value === value)
  return found ? (lang === 'zh' ? found.label.zh : lang === 'en' ? found.label.en : (found.label.ko || found.label.en)) : value
}

function MediaPanel({ mediaItems }) {
  const [current, setCurrent] = useState(0)

  if (mediaItems.length === 0) return null

  const item = mediaItems[current]
  const url = supabase.storage.from('community-media').getPublicUrl(item.storage_path).data.publicUrl

  return (
    <div className="relative rounded-xl overflow-hidden bg-black/5">
      {/* 主图/视频 — 竖版比例 */}
      <div className="relative w-full" style={{ aspectRatio: '3 / 4' }}>
        {item.media_type === 'video' ? (
          <video src={url} controls className="absolute inset-0 w-full h-full object-contain bg-black/5" />
        ) : (
          <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        )}

        {/* 左右箭头 */}
        {mediaItems.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((c) => (c - 1 + mediaItems.length) % mediaItems.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <Icon name="chevronLeft" size={16} />
            </button>
            <button
              onClick={() => setCurrent((c) => (c + 1) % mediaItems.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <Icon name="chevronRight" size={16} />
            </button>
          </>
        )}

        {/* 计数 */}
        {mediaItems.length > 1 && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/40 text-white text-xs">
            {current + 1} / {mediaItems.length}
          </div>
        )}
      </div>

      {/* 缩略图导航 */}
      {mediaItems.length > 1 && (
        <div className="flex gap-1.5 p-2 overflow-x-auto">
          {mediaItems.map((m, i) => {
            const thumbUrl = supabase.storage.from('community-media').getPublicUrl(m.storage_path).data.publicUrl
            return (
              <button
                key={m.id}
                onClick={() => setCurrent(i)}
                className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === current ? 'border-forest' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                {m.media_type === 'video' ? (
                  <div className="w-full h-full bg-black/10 flex items-center justify-center">
                    <Icon name="camera" size={14} className="text-text-secondary" />
                  </div>
                ) : (
                  <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function InjuryDetailPage() {
  const { id } = useParams()
  const { lang } = useApp()
  const { user } = useAuth()
  const { onOpenAuth } = useOutletContext()
  const navigate = useNavigate()

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)       // 仅首次加载
  const [transitioning, setTransitioning] = useState(false) // 切换中（保留旧内容）
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [nextId, setNextId] = useState(null)
  const [prevId, setPrevId] = useState(null)

  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    loadReport()
  }, [id])

  async function loadReport() {
    const isFirstLoad = !report
    if (isFirstLoad) {
      setLoading(true)
    } else {
      setTransitioning(true)
    }

    // 第一阶段：拿核心内容（post + injury_details + media + likes），先渲染页面
    const { data } = await fetchInjuryReport(id)
    if (data) {
      setReport(data)
      setLikeCount(data.likes?.length || 0)
      setLiked(data.likes?.some((l) => l.user_id === user?.id) || false)
      // 先清空旧评论和导航，让页面立刻渲染
      setComments([])
      setNextId(null)
      setPrevId(null)
    }
    setLoading(false)
    setTransitioning(false)

    // 第二阶段：异步加载评论 + prev/next（不阻塞页面渲染）
    if (data) {
      const [commentsResult, nid, pid] = await Promise.all([
        fetchInjuryComments(id),
        fetchNextInjuryId(data.id, data.created_at),
        fetchPrevInjuryId(data.id, data.created_at),
      ])
      setComments(commentsResult.data || [])
      setNextId(nid)
      setPrevId(pid)
    }
  }

  const handleLike = async () => {
    if (!user) { onOpenAuth(); return }
    const { liked: nowLiked } = await toggleLike(id)
    setLiked(nowLiked)
    setLikeCount((c) => nowLiked ? c + 1 : c - 1)
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!user) { onOpenAuth(); return }
    if (!newComment.trim()) return
    setCommentLoading(true)
    const { data } = await createComment(id, newComment.trim())
    if (data) {
      setComments([...comments, data])
      setNewComment('')
    }
    setCommentLoading(false)
  }

  const isOwner = user && report?.user_id === user.id

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await deleteInjuryReport(id)
    if (error) {
      setDeleting(false)
      setShowDeleteConfirm(false)
      return
    }
    navigate('/injuries')
  }

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-text-secondary">{lang === 'zh' ? '加载中...' : lang === 'en' ? 'Loading...' : '로딩 중...'}</div>
  }

  if (!report) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-text-secondary mb-4">{lang === 'zh' ? '找不到这条记录' : lang === 'en' ? 'Record not found' : '기록을 찾을 수 없습니다'}</p>
        <Link to="/injuries" className="text-forest hover:underline">← {lang === 'zh' ? '返回伤痛档案' : lang === 'en' ? 'Back to Archive' : '기록으로 돌아가기'}</Link>
      </div>
    )
  }

  const details = report.injury_details?.[0] || report.injury_details
  const mediaItems = (report.media || []).sort((a, b) => a.display_order - b.display_order)
  const hasMedia = mediaItems.length > 0

  const bodyPartLabels = (details?.body_parts || []).map((bp) => getLabel(BODY_PARTS, bp, lang))

  return (
    <div className={`max-w-5xl mx-auto px-4 py-8 transition-opacity duration-200 ${transitioning ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
      {/* 无媒体时的返回链接 */}
      {!hasMedia && (
        <div className="mb-6">
          <Link to="/injuries" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-forest">
            ← {lang === 'zh' ? '返回伤痛档案' : lang === 'en' ? 'Back to Archive' : '기록으로 돌아가기'}
          </Link>
        </div>
      )}

      {/* 主体：左右分栏（桌面端）/ 上下排列（手机端） */}
      <div className={`flex flex-col ${hasMedia ? 'md:flex-row' : ''} gap-6`}>

        {/* 左侧：媒体区域 */}
        {hasMedia && (
          <div className="w-full md:w-[420px] lg:w-[480px] shrink-0 md:sticky md:top-[72px] md:self-start">
            {/* 返回链接 — 在左侧列内 */}
            <div className="mb-3">
              <Link to="/injuries" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-forest">
                ← {lang === 'zh' ? '返回伤痛档案' : lang === 'en' ? 'Back to Archive' : '기록으로 돌아가기'}
              </Link>
            </div>
            <MediaPanel mediaItems={mediaItems} />
            {/* 上一个 / 下一个 */}
            {(prevId || nextId) && (
              <div className="flex items-center justify-between mt-3">
                {prevId ? (
                  <Link to={`/injuries/${prevId}`} className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-forest transition-colors">
                    <Icon name="chevronLeft" size={14} />
                    {lang === 'zh' ? '上一个' : lang === 'en' ? 'Previous' : '이전'}
                  </Link>
                ) : <span />}
                {nextId ? (
                  <Link to={`/injuries/${nextId}`} className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-forest transition-colors">
                    {lang === 'zh' ? '下一个' : lang === 'en' ? 'Next' : '다음'}
                    <Icon name="chevronRight" size={14} />
                  </Link>
                ) : <span />}
              </div>
            )}
          </div>
        )}

        {/* 右侧：文字内容 */}
        <div className="flex-1 min-w-0">
          {/* 标签 */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {bodyPartLabels.map((label) => (
              <span key={label} className="px-2.5 py-1 bg-amber-light text-amber text-xs font-medium rounded-full">
                {label}
              </span>
            ))}
            {details?.climbing_type && (
              <span className="px-2.5 py-1 bg-forest-light text-forest text-xs font-medium rounded-full">
                {getLabel(CLIMBING_TYPES, details.climbing_type, lang)}
              </span>
            )}
            {details?.injury_type && (
              <span className="px-2.5 py-1 bg-stone-bg text-text-secondary text-xs font-medium rounded-full">
                {getLabel(INJURY_TYPES, details.injury_type, lang)}
              </span>
            )}
          </div>

          {/* 标题 + 用户信息 + 操作菜单 */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl font-bold">{report.title}</h1>
            {isOwner && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-text-secondary hover:bg-stone-bg hover:border-stone-border transition-colors"
                >
                  <Icon name="moreHorizontal" size={18} />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-stone-card rounded-lg border border-stone-border shadow-lg py-1 min-w-[120px]">
                      <Link
                        to={`/injuries/${id}/edit`}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-stone-bg transition-colors"
                        onClick={() => setShowMenu(false)}
                      >
                        <Icon name="edit" size={14} />
                        {lang === 'zh' ? '编辑' : lang === 'en' ? 'Edit' : '편집'}
                      </Link>
                      <button
                        onClick={() => { setShowMenu(false); setShowDeleteConfirm(true) }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-stone-bg transition-colors w-full text-left"
                      >
                        <Icon name="trash" size={14} />
                        {lang === 'zh' ? '删除' : lang === 'en' ? 'Delete' : '삭제'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-5">
            <span>{report.profiles?.username || '匿名'}</span>
            <span>·</span>
            <span>{new Date(report.created_at).toLocaleDateString('zh-CN')}</span>
          </div>

          {/* ── 受伤信息 ── */}
          <section className="bg-stone-card rounded-xl border border-stone-border p-5 mb-5">
            <h2 className="font-semibold mb-3">{lang === 'zh' ? '受伤信息' : lang === 'en' ? 'Injury Info' : '부상 정보'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InfoCard label={lang === 'zh' ? '受伤部位' : lang === 'en' ? 'Body Part' : '부상 부위'} value={bodyPartLabels.join(lang === 'zh' ? '、' : ', ')} />
                <InfoCard label={lang === 'zh' ? '受伤类型' : lang === 'en' ? 'Injury Type' : '부상 유형'} value={details?.injury_type ? getLabel(INJURY_TYPES, details.injury_type, lang) : null} />
                <InfoCard label={lang === 'zh' ? '攀岩类型' : lang === 'en' ? 'Climbing Type' : '클라이밍 유형'} value={details?.climbing_type ? getLabel(CLIMBING_TYPES, details.climbing_type, lang) : null} />
              </div>
              {report.description && (
                <div>
                  <h3 className="font-semibold text-sm mb-1.5">{lang === 'zh' ? '受伤经过' : lang === 'en' ? 'What Happened' : '부상 경위'}</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.description}</p>
                </div>
              )}
              {details?.injury_cause && (
                <div>
                  <h3 className="font-semibold text-sm mb-1.5">{lang === 'zh' ? '自己认为的原因' : lang === 'en' ? 'Perceived Cause' : '본인이 생각하는 원인'}</h3>
                  <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">{details.injury_cause}</p>
                </div>
              )}
            </div>
          </section>

          {/* ── 攀岩背景 ── */}
          {details && (details.usual_grade || details.climbing_experience || details.climbing_frequency) && (
            <section className="bg-stone-card rounded-xl border border-stone-border p-5 mb-5">
              <h2 className="font-semibold mb-4">{lang === 'zh' ? '攀岩背景' : lang === 'en' ? 'Climbing Background' : '클라이밍 배경'}</h2>
              <div className="grid grid-cols-2 gap-3">
                <InfoCard label={lang === 'zh' ? '日常水平' : lang === 'en' ? 'Usual Grade' : '평소 등급'} value={details.usual_grade} />
                <InfoCard label={lang === 'zh' ? '攀岩年限' : lang === 'en' ? 'Experience' : '경력'} value={getLabel(EXPERIENCE_LEVELS, details.climbing_experience, lang)} />
                <InfoCard label={lang === 'zh' ? '攀岩频率' : lang === 'en' ? 'Frequency' : '빈도'} value={getLabel(FREQUENCY_OPTIONS, details.climbing_frequency, lang)} />
              </div>
            </section>
          )}

          {/* ── 受伤场景 ── */}
          {details && (details.injury_grade || details.did_warm_up || details.was_fatigued) && (
            <section className="bg-stone-card rounded-xl border border-stone-border p-5 mb-5">
              <h2 className="font-semibold mb-4">{lang === 'zh' ? '受伤场景' : lang === 'en' ? 'Injury Context' : '부상 상황'}</h2>
              <div className="grid grid-cols-2 gap-3">
                <InfoCard label={lang === 'zh' ? '受伤时攀爬的难度' : lang === 'en' ? 'Grade at Injury' : '부상 시 등급'} value={details.injury_grade} />
                <InfoCard label={lang === 'zh' ? '是否热身' : lang === 'en' ? 'Warmed Up' : '워밍업 여부'} value={details.did_warm_up === 'yes' ? (lang === 'zh' ? '是' : lang === 'en' ? 'Yes' : '예') : details.did_warm_up === 'no' ? (lang === 'zh' ? '否' : lang === 'en' ? 'No' : '아니오') : details.did_warm_up === 'unsure' ? (lang === 'zh' ? '不确定' : lang === 'en' ? 'Unsure' : '잘 모르겠음') : null} />
                <InfoCard label={lang === 'zh' ? '是否疲劳' : lang === 'en' ? 'Fatigued' : '피로 상태'} value={details.was_fatigued === 'yes' ? (lang === 'zh' ? '是' : lang === 'en' ? 'Yes' : '예') : details.was_fatigued === 'no' ? (lang === 'zh' ? '否' : lang === 'en' ? 'No' : '아니오') : details.was_fatigued === 'unsure' ? (lang === 'zh' ? '不确定' : lang === 'en' ? 'Unsure' : '잘 모르겠음') : null} />
              </div>
            </section>
          )}

          {/* ── 就医与恢复 ── */}
          {details && (details.sought_medical != null || details.diagnosis || details.recovery_duration) && (
            <section className="bg-stone-card rounded-xl border border-stone-border p-5 mb-5">
              <h2 className="font-semibold mb-4">{lang === 'zh' ? '就医与恢复' : lang === 'en' ? 'Medical & Recovery' : '의료 및 회복'}</h2>
              <div className="grid grid-cols-2 gap-3">
                <InfoCard label={lang === 'zh' ? '是否就医' : lang === 'en' ? 'Sought Medical' : '의료 진료'} value={details.sought_medical === true ? (lang === 'zh' ? '是' : lang === 'en' ? 'Yes' : '예') : details.sought_medical === false ? (lang === 'zh' ? '否' : lang === 'en' ? 'No' : '아니오') : null} />
                <InfoCard label={lang === 'zh' ? '诊断结果' : lang === 'en' ? 'Diagnosis' : '진단 결과'} value={details.diagnosis} />
                <InfoCard label={lang === 'zh' ? '恢复时长' : lang === 'en' ? 'Recovery Duration' : '회복 기간'} value={getLabel(RECOVERY_DURATIONS, details.recovery_duration, lang)} />
              </div>
            </section>
          )}

          {/* ── 经验分享 ── */}
          {details?.advice_to_others && (
            <section className="bg-amber-light border border-amber/20 rounded-xl p-5 mb-5">
              <h2 className="font-semibold mb-2 flex items-center gap-2">
                <Icon name="alertTriangle" size={16} className="text-amber" />
                {lang === 'zh' ? '经验分享' : lang === 'en' ? 'Advice' : '경험 공유'}
              </h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{details.advice_to_others}</p>
            </section>
          )}

          {/* 点赞 */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                liked
                  ? 'bg-red-50 border-red-200 text-red-500'
                  : 'bg-stone-card border-stone-border text-text-secondary hover:border-red-200 hover:text-red-400'
              }`}
            >
              <Icon name={liked ? 'heartFilled' : 'heart'} size={16} />
              {likeCount}
            </button>
          </div>

          {/* 删除确认弹窗 */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-stone-card rounded-xl border border-stone-border p-6 max-w-sm mx-4 shadow-lg">
                <h3 className="font-semibold text-lg mb-2">{lang === 'zh' ? '确认删除' : lang === 'en' ? 'Confirm Delete' : '삭제 확인'}</h3>
                <p className="text-sm text-text-secondary mb-5">{lang === 'zh' ? '删除后无法恢复，确定要删除这条伤痛记录吗？' : lang === 'en' ? 'This cannot be undone. Are you sure you want to delete this injury report?' : '삭제 후 복구할 수 없습니다. 이 부상 기록을 삭제하시겠습니까?'}</p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="px-4 py-2 rounded-lg border border-stone-border text-sm hover:bg-stone-bg transition-colors"
                  >
                    {lang === 'zh' ? '取消' : lang === 'en' ? 'Cancel' : '취소'}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {deleting ? (lang === 'zh' ? '删除中...' : lang === 'en' ? 'Deleting...' : '삭제 중...') : (lang === 'zh' ? '确认删除' : lang === 'en' ? 'Confirm Delete' : '삭제 확인')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 评论区 */}
          <section className="bg-stone-card rounded-xl border border-stone-border p-5">
            <h2 className="font-semibold mb-4">
              {lang === 'zh' ? '评论' : lang === 'en' ? 'Comments' : '댓글'} ({comments.length})
            </h2>

            {comments.length > 0 && (
              <div className="space-y-4 mb-6">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <UserAvatar name={c.profiles?.username || '匿名'} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{c.profiles?.username || '匿名'}</span>
                        <span className="text-xs text-text-secondary">
                          {new Date(c.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={user
                  ? (lang === 'zh' ? '写下你的评论...' : lang === 'en' ? 'Write a comment...' : '댓글을 작성하세요...')
                  : (lang === 'zh' ? '登录后评论' : lang === 'en' ? 'Sign in to comment' : '로그인 후 댓글 작성')}
                onClick={() => !user && onOpenAuth()}
                className="flex-1 px-3 py-2.5 rounded-lg bg-stone-bg border border-stone-border text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors"
              />
              <button
                type="submit"
                disabled={commentLoading || !newComment.trim()}
                className="px-4 py-2.5 rounded-lg bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors disabled:opacity-50 shrink-0"
              >
                <Icon name="send" size={16} />
              </button>
            </form>
          </section>

          {/* 无媒体时的上一个 / 下一个 */}
          {!hasMedia && (prevId || nextId) && (
            <div className="flex items-center justify-between mt-6">
              {prevId ? (
                <Link to={`/injuries/${prevId}`} className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-forest transition-colors">
                  <Icon name="chevronLeft" size={14} />
                  {lang === 'zh' ? '上一个' : lang === 'en' ? 'Previous' : '이전'}
                </Link>
              ) : <span />}
              {nextId ? (
                <Link to={`/injuries/${nextId}`} className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-forest transition-colors">
                  {lang === 'zh' ? '下一个' : lang === 'en' ? 'Next' : '다음'}
                  <Icon name="chevronRight" size={14} />
                </Link>
              ) : <span />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
