import { useState, useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Icon } from '../utils/icons'
import ArticleRenderer from '../components/article/ArticleRenderer'
import ArticleCard from '../components/article/ArticleCard'
import PageSEO from '../components/PageSEO'
import articleRegistry from '../data/article-registry.json'

const articleModules = import.meta.glob('../data/articles/*.json')

function hexToRgba(hex, alpha) {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized
  const int = Number.parseInt(value, 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function ArticleDetailPage() {
  const { articleSlug } = useParams()
  const { t, lang, getKpRoute } = useApp()
  const [articleData, setArticleData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Find article metadata from registry
  const articleMeta = useMemo(() =>
    articleRegistry.articles.find(a => a.slug === articleSlug),
    [articleSlug]
  )

  const category = useMemo(() =>
    articleRegistry.categories.find(c => c.id === articleMeta?.category),
    [articleMeta]
  )

  // Related articles (same category, excluding current)
  const relatedArticles = useMemo(() => {
    if (!articleMeta) return []
    return articleRegistry.articles
      .filter(a => a.category === articleMeta.category && a.id !== articleMeta.id)
      .slice(0, 6)
  }, [articleMeta])

  // Load article content
  useEffect(() => {
    setLoading(true)
    setArticleData(null)

    const matchingKey = Object.keys(articleModules).find(key =>
      key.includes(`/${articleSlug}.json`)
    )

    if (matchingKey) {
      articleModules[matchingKey]().then(mod => {
        setArticleData(mod.default || mod)
        setLoading(false)
      }).catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [articleSlug])

  if (!articleMeta) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-text-secondary">
          {lang === 'zh' ? '文章未找到' : lang === 'en' ? 'Article not found' : '글을 찾을 수 없습니다'}
        </p>
        <Link to="/articles" className="text-forest hover:underline mt-4 inline-block">
          {lang === 'zh' ? '← 返回专栏' : lang === 'en' ? '← Back to Column' : '← 칼럼으로 돌아가기'}
        </Link>
      </div>
    )
  }

  const color = category?.color || '#4CAF50'
  const seoTitle = articleData?.seo?.metaTitle
    ? t(articleData.seo.metaTitle)
    : `${t(articleMeta.title)} | ${lang === 'zh' ? '攀岩知识库' : 'Climbing Knowledge Base'}`

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageSEO path={`/articles/${articleSlug}`} title={seoTitle} />

      {/* Back link */}
      <Link
        to="/articles"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-forest transition-colors mb-6"
      >
        <Icon name="chevronLeft" size={16} />
        {lang === 'zh' ? '返回专栏' : lang === 'en' ? 'Back to Column' : '칼럼으로 돌아가기'}
      </Link>

      {/* 文章头部 */}
      <div>

      {/* Category tag */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium" style={{ color }}>
          {t(category?.title)}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold leading-tight mb-2">
        {t(articleMeta.title)}
      </h1>

      {/* 英文副标题 —— 保留数据供搜索，UI 隐藏 */}
      {articleMeta.title.en && (
        <p className="hidden">{articleMeta.title.en}</p>
      )}

      {/* Subtitle */}
      {articleMeta.subtitle && (
        <p className="text-base text-text-secondary mb-4">{t(articleMeta.subtitle)}</p>
      )}

      {/* Meta line */}
      <div className="flex items-center gap-3 text-sm text-text-secondary mb-8">
        <span className="flex items-center gap-1">
          <Icon name="clock" size={14} />
          {articleMeta.readingTime} min {lang !== 'zh' ? 'read' : ''}
        </span>
        {articleData?.sources?.length > 0 && (
          <>
            <span>·</span>
            <span>
              {lang === 'zh' ? `来源 ${articleData.sources.length} 篇` : `${articleData.sources.length} sources`}
            </span>
          </>
        )}
      </div>

      {/* Cover image */}
      {articleMeta.coverImage ? (
        <div className="mb-8 rounded-xl overflow-hidden border border-stone-border">
          <img
            src={`/images/articles/${articleMeta.coverImage}`}
            alt={t(articleMeta.title)}
            className="w-full object-cover"
          />
        </div>
      ) : (
        <div
          className="mb-8 rounded-xl h-[200px] flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${hexToRgba(color, 0.8)}, ${hexToRgba(color, 0.4)})`
          }}
        >
          <span className={`${articleMeta.emoji ? 'text-7xl' : 'text-6xl font-bold text-white/30'} select-none`}>
            {articleMeta.emoji || (t(articleMeta.title) || '?')[0]}
          </span>
        </div>
      )}

      </div>{/* /文章头部 */}

      {/* Article content */}
      {loading ? (
        <div className="py-16 text-center text-text-secondary">
          <p>{lang === 'zh' ? '加载中...' : 'Loading...'}</p>
        </div>
      ) : articleData?.content ? (
        <ArticleRenderer content={t(articleData.content)} />
      ) : (
        <div className="py-16 text-center text-text-secondary rounded-xl bg-stone-bg/50 border border-dashed border-stone-border">
          <Icon name="fileText" size={32} className="mx-auto mb-3 text-text-secondary/50" />
          <p className="font-medium">
            {lang === 'zh' ? '文章内容即将上线' : lang === 'en' ? 'Article content coming soon' : '글 내용이 곧 제공됩니다'}
          </p>
          <p className="text-xs mt-1">Placeholder</p>
        </div>
      )}

      {/* Related KP tags */}
      {articleMeta.relatedKpIds?.length > 0 && (
        <div className="mt-12 pt-8 border-t border-stone-border">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Icon name="link" size={14} />
            {lang === 'zh' ? '相关知识点' : lang === 'en' ? 'Related Knowledge Points' : '관련 지식 포인트'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {articleMeta.relatedKpIds.map(kpId => {
              const route = getKpRoute?.(kpId)
              if (route) {
                return (
                  <Link
                    key={kpId}
                    to={route}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-forest-light text-forest hover:bg-forest hover:text-white transition-colors"
                  >
                    {kpId}
                  </Link>
                )
              }
              return (
                <span
                  key={kpId}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-stone-bg text-text-secondary"
                >
                  {kpId}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Sources */}
      {articleData?.sources?.length > 0 && (
        <div className="mt-8 pt-6 border-t border-stone-border">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Icon name="externalLink" size={14} />
            {lang === 'zh' ? '参考来源' : lang === 'en' ? 'Sources' : '참고 자료'}
          </h3>
          <ul className="space-y-2">
            {articleData.sources.map((source, i) => (
              <li key={i}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-forest hover:underline inline-flex items-center gap-1.5"
                >
                  {source.type === 'video' && <Icon name="play" size={12} />}
                  {source.type === 'article' && <Icon name="fileText" size={12} />}
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <div className="mt-8 pt-6 border-t border-stone-border">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Icon name="book" size={14} />
            {lang === 'zh' ? '推荐阅读' : lang === 'en' ? 'Recommended Reading' : '추천 읽기'}
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {relatedArticles.map(article => (
              <div key={article.id} className="shrink-0 w-[224px]">
                <ArticleCard article={article} variant="small" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
