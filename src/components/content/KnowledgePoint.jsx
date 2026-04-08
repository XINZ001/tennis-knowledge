import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useApp } from '../../context/AppContext'
import { resolveCrossRefs } from '../../utils/crossRefResolver'
import { getArticlesForKp } from '../../utils/articleKpMap'
import articleRegistry from '../../data/article-registry.json'
import { Icon } from '../../utils/icons'
import ImageLightbox from '../ui/ImageLightbox'

function getEmbedInfo(url = '') {
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/
  )
  if (ytMatch) return { platform: 'youtube', id: ytMatch[1] }
  const biliMatch = url.match(/bilibili\.com\/video\/(BV[\w]+)/)
  if (biliMatch) return { platform: 'bilibili', id: biliMatch[1] }
  return null
}

function VideoEmbed({ video, t }) {
  const embed = getEmbedInfo(video.url)
  if (embed?.platform === 'youtube') {
    return (
      <div className="space-y-2">
        <div className="relative w-full overflow-hidden rounded-md border border-stone-border" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${embed.id}`}
            title={t(video.title)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
        <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-forest transition-colors">
          {t(video.title)}
        </a>
        <div className="text-xs text-text-secondary">{video.channel}</div>
      </div>
    )
  }
  if (embed?.platform === 'bilibili') {
    return (
      <div className="space-y-2">
        <div className="relative w-full overflow-hidden rounded-md border border-stone-border" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://player.bilibili.com/player.html?bvid=${embed.id}&high_quality=1`}
            title={t(video.title)}
            allowFullScreen
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>
        <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-forest transition-colors">
          {t(video.title)}
        </a>
        <div className="text-xs text-text-secondary">{video.channel}</div>
      </div>
    )
  }
  return null
}

function VideoCard({ video, t, onClick }) {
  const platformLabel = video.platform === 'bilibili' ? 'B站' : 'YouTube'
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-1 p-2 rounded-md border border-stone-border bg-stone-sidebar hover:border-forest/40 hover:bg-forest-light transition-colors text-left w-full"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium line-clamp-2 text-text-primary">{t(video.title)}</span>
        <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] bg-stone-card border border-stone-border text-text-secondary uppercase">{platformLabel}</span>
      </div>
      <div className="text-[11px] text-text-secondary">{video.channel}</div>
    </button>
  )
}

/* ─── 小节标题 ─── */
function SectionLabel({ icon, children, className = '' }) {
  return (
    <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-secondary ${className}`}>
      <Icon name={icon} size={12} className="opacity-60" />
      {children}
    </div>
  )
}

export default function KnowledgePoint({ point, videos, illustrations }) {
  const { t, lang } = useApp()
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [videosExpanded, setVideosExpanded] = useState(false)
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0)

  useEffect(() => { setSelectedVideoIndex(0) }, [point.id])

  if (!point) return null

  const content = lang === 'zh' ? point.content?.zh : lang === 'en' ? point.content?.en : (point.content?.ko || point.content?.en)
  const crossRefs = resolveCrossRefs(point.crossRefs)
  const relatedArticles = getArticlesForKp(point.id)
  const getCat = (id) => articleRegistry.categories.find(c => c.id === id)

  const videoList = Array.isArray(videos) ? videos : []
  const clampedIndex = Math.min(selectedVideoIndex, videoList.length - 1)
  const primaryVideo = videoList[clampedIndex] || null
  const extraVideos = videoList.filter((_, i) => i !== clampedIndex)

  const hasCrossRefs = crossRefs.length > 0
  const hasArticles = relatedArticles.length > 0
  const hasFurtherReading = point.furtherReading && point.furtherReading.length > 0
  const hasFooter = hasCrossRefs || hasArticles || hasFurtherReading || primaryVideo

  return (
    <div id={point.id} className="scroll-mt-20">

      {/* ════════════════════════════════════════════
          第一层：主体内容
          ════════════════════════════════════════════ */}

      {/* 标题 */}
      <h3 className="text-[24px] font-bold mb-4 tracking-tight">
        {t(point.title)}
      </h3>
      {/* 英文副标题 —— 保留数据供搜索，UI 隐藏 */}
      {point.title.en && (
        <p className="hidden">{point.title.en}</p>
      )}

      {/* 术语标签 —— 保留数据供搜索使用，UI 隐藏 */}
      {point.terms && point.terms.length > 0 && (
        <div className="hidden">
          {point.terms.map((term, i) => (
            <span key={i}>{term.zh} {term.en}</span>
          ))}
        </div>
      )}

      {/* 正文 */}
      {content && (
        <div className="markdown-content text-sm leading-relaxed text-text-primary/90">
          <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
        </div>
      )}

      {/* 专家观点 */}
      {point.expertInsights && point.expertInsights.length > 0 && (
        <div className="mt-5 space-y-3">
          {point.expertInsights.map((insight, i) => (
            <div
              key={i}
              className="bg-forest-light border-l-4 border-forest rounded-r-lg p-4"
            >
              <div className="text-xs font-semibold text-forest mb-1.5">
                {lang === 'zh' ? '💡 专家补充' : lang === 'en' ? '💡 Expert Insight' : '💡 전문가 보충'}
              </div>
              <p className="text-sm leading-relaxed text-text-primary/90">
                {lang === 'zh' ? insight.zh : lang === 'en' ? insight.en : (insight.ko || insight.en)}
              </p>
              {insight.source && (
                <div className="mt-2">
                  {insight.sourceUrl ? (
                    <a
                      href={insight.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-forest hover:text-forest-dark transition-colors"
                    >
                      — {insight.source} ↗
                    </a>
                  ) : (
                    <span className="text-xs text-text-secondary">
                      — {insight.source}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 插图：第一张大图 + 其余小缩略图 */}
      {illustrations && illustrations.length > 0 && (
        <div className="mt-5 space-y-2.5">
          {/* 主图 */}
          <div
            className="group relative rounded-lg overflow-hidden border border-stone-border bg-stone-card cursor-pointer hover:border-forest/40 transition-colors"
            style={{ maxWidth: 480 }}
            onClick={() => setLightboxIndex(0)}
          >
            <img src={illustrations[0]} alt="" className="w-full h-auto block" loading="lazy" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
            <div className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </div>
          </div>
          {/* 缩略图行 */}
          {illustrations.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {illustrations.slice(1).map((src, i) => (
                <div
                  key={i + 1}
                  className="group relative rounded-md overflow-hidden border border-stone-border bg-stone-card cursor-pointer hover:border-forest/40 transition-colors shrink-0"
                  style={{ width: 100, height: 100 }}
                  onClick={() => setLightboxIndex(i + 1)}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex >= 0 && illustrations && (
        <ImageLightbox
          images={illustrations}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(-1)}
        />
      )}

      {/* ════════════════════════════════════════════
          第二层：附属信息卡片
          ════════════════════════════════════════════ */}
      {hasFooter && (
        <div className="mt-6 rounded-xl bg-stone-sidebar/50 border border-stone-border/60 p-4 space-y-4">

          {/* 相关专栏（最高优先级） */}
          {hasArticles && (
            <div>
              <SectionLabel icon="fileText">
                {lang === 'zh' ? '相关专栏' : lang === 'en' ? 'Related Articles' : '관련 칼럼'}
              </SectionLabel>
              <div className="mt-2 space-y-1.5">
                {relatedArticles.map(article => {
                  const cat = getCat(article.category)
                  return (
                    <Link
                      key={article.id}
                      to={`/articles/${article.slug}`}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-stone-card hover:bg-teal-light border border-stone-border/60 hover:border-teal/25 transition-colors group"
                    >
                      {article.emoji && (
                        <span className="text-base shrink-0">{article.emoji}</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-text-primary group-hover:text-teal transition-colors truncate">
                          {t(article.title)}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-text-secondary mt-0.5">
                          {cat && <span style={{ color: cat.color }}>{t(cat.title)}</span>}
                          <span>·</span>
                          <span>{article.readingTime} min</span>
                        </div>
                      </div>
                      <Icon name="chevronRight" size={14} className="text-text-secondary/40 group-hover:text-teal transition-colors shrink-0" />
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* 相关知识点 */}
          {hasCrossRefs && (
            <div>
              <SectionLabel icon="link">
                {lang === 'zh' ? '相关知识点' : lang === 'en' ? 'Related' : '관련'}
              </SectionLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {crossRefs.map(ref => (
                  <Link
                    key={ref.id}
                    to={ref.path}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-stone-card border border-stone-border/60 text-forest hover:bg-forest hover:text-white hover:border-forest transition-colors"
                  >
                    {t(ref.title)}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 分割线 —— 上面是导航类，下面是资源类 */}
          {(hasArticles || hasCrossRefs) && (hasFurtherReading || primaryVideo) && (
            <div className="border-t border-stone-border/40" />
          )}

          {/* 延伸阅读 */}
          {hasFurtherReading && (
            <div>
              <SectionLabel icon="book">
                {lang === 'zh' ? '延伸阅读' : lang === 'en' ? 'Further Reading' : '추가 읽기'}
              </SectionLabel>
              <div className="mt-2 space-y-1">
                {point.furtherReading.map((item, i) => (
                  <div key={i} className="flex items-baseline gap-1.5 text-xs">
                    <span className="text-text-secondary/50 shrink-0">•</span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-forest hover:text-forest-dark transition-colors truncate"
                    >
                      {item.title}
                    </a>
                    <span className="text-text-secondary shrink-0">{item.source}</span>
                    <span className="px-1 py-0 rounded text-[10px] bg-stone-card text-text-secondary uppercase shrink-0 border border-stone-border/40">
                      {item.language}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 视频 */}
          {primaryVideo && (
            <div>
              <SectionLabel icon="play" className="mb-2">
                {lang === 'zh' ? '相关视频' : lang === 'en' ? 'Video' : '관련 영상'}
              </SectionLabel>

              <VideoEmbed video={primaryVideo} t={t} />

              {extraVideos.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => setVideosExpanded(v => !v)}
                    className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-forest transition-colors"
                  >
                    <span>{videosExpanded ? '▼' : '▶'}</span>
                    <span>
                      {videosExpanded
                        ? (lang === 'zh' ? '收起' : lang === 'en' ? 'Collapse' : '접기')
                        : lang === 'zh'
                          ? `更多相关视频 (${extraVideos.length})`
                          : lang === 'en'
                            ? `More videos (${extraVideos.length})`
                            : `영상 더 보기 (${extraVideos.length})`}
                    </span>
                  </button>

                  {videosExpanded && (
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {extraVideos.map((v, i) => (
                        <VideoCard
                          key={v.url}
                          video={v}
                          t={t}
                          onClick={() => {
                            const realIndex = videoList.indexOf(v)
                            setSelectedVideoIndex(realIndex)
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
