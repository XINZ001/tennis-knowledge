import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Icon } from '../../utils/icons'
import articleRegistry from '../../data/article-registry.json'

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

function getCategoryById(id) {
  return articleRegistry.categories.find(c => c.id === id)
}

/**
 * ArticleCard — used in homepage, article list page, and detail page
 *
 * variant="small"  → horizontal scroll cards (fixed w-[220px])
 * variant="grid"   → homepage grid (auto width, fills parent)
 * variant="large"  → article list page grid (auto width, taller cover)
 */
export default function ArticleCard({ article, variant = 'small' }) {
  const { t, lang } = useApp()
  const category = getCategoryById(article.category)
  const color = category?.color || '#4CAF50'
  const isLarge = variant === 'large'
  const isSmall = variant === 'small'

  // Cover image fallback: color block + emoji (or first char of title)
  const titleText = t(article.title)
  const fallbackChar = article.emoji || titleText?.[0] || '?'

  const sizeClass = isSmall ? 'min-w-0' : ''

  // Cover image / emoji block (shared between layouts)
  const coverBg = article.coverImage
    ? undefined
    : `linear-gradient(135deg, ${hexToRgba(color, 0.85)}, ${hexToRgba(color, 0.55)})`

  const coverContent = article.coverImage ? (
    <img
      src={`/images/articles/${article.coverImage}`}
      alt={titleText}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      loading="lazy"
    />
  ) : (
    <div className="flex items-center justify-center h-full">
      <span className={`${article.emoji ? 'text-5xl' : 'text-4xl font-bold text-white/40'} select-none`}>
        {fallbackChar}
      </span>
    </div>
  )

  // Large variant: horizontal on mobile, vertical on sm+
  if (isLarge) {
    return (
      <Link
        to={`/articles/${article.slug}`}
        className="group card-hover flex flex-row sm:flex-col h-full overflow-hidden rounded-xl border border-stone-border/60 bg-stone-card backdrop-blur-sm hover:border-forest/30 transition-colors"
      >
        {/* Cover — left on mobile, top on sm+ */}
        <div
          className="relative overflow-hidden w-[110px] shrink-0 sm:w-auto sm:h-[180px]"
          style={{ background: coverBg }}
        >
          {coverContent}
        </div>

        {/* Body — right on mobile, bottom on sm+ */}
        <div className="flex flex-col flex-1 min-w-0 p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-xs font-medium" style={{ color }}>{t(category?.title)}</span>
          </div>
          <h3 className="font-semibold leading-tight line-clamp-2 text-sm sm:text-base mb-1 sm:mb-1.5">
            {titleText}
          </h3>
          <p className="text-text-secondary flex-1 text-xs sm:text-sm mb-1.5 sm:mb-2 line-clamp-2">
            {article.subtitle ? t(article.subtitle) : '\u00A0'}
          </p>
          <div className="mt-auto flex items-center gap-2 text-xs text-text-secondary">
            <Icon name="clock" size={12} />
            <span>{article.readingTime} min{lang !== 'zh' ? ' read' : ''}</span>
            {article.relatedKpIds?.length > 0 && (
              <>
                <span>·</span>
                <span>{article.relatedKpIds.length} KP</span>
              </>
            )}
          </div>
        </div>
      </Link>
    )
  }

  // Small variant (unchanged)
  return (
    <Link
      to={`/articles/${article.slug}`}
      className={`group card-hover flex flex-col h-full overflow-hidden rounded-xl border border-stone-border/60 bg-stone-card backdrop-blur-sm hover:border-forest/30 transition-colors ${sizeClass}`}
    >
      <div
        className="relative overflow-hidden h-[120px]"
        style={{ background: coverBg }}
      >
        {coverContent}
      </div>
      <div className="flex flex-col flex-1 p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-xs font-medium" style={{ color }}>{t(category?.title)}</span>
        </div>
        <h3 className="font-semibold leading-tight line-clamp-2 text-sm mb-1">{titleText}</h3>
        <p className="text-text-secondary flex-1 text-xs mb-1.5 line-clamp-1">
          {article.subtitle ? t(article.subtitle) : '\u00A0'}
        </p>
        <div className="mt-auto flex items-center gap-2 text-xs text-text-secondary">
          <Icon name="clock" size={12} />
          <span>{article.readingTime} min{lang !== 'zh' ? ' read' : ''}</span>
        </div>
      </div>
    </Link>
  )
}

/**
 * CategoryCard — large card for homepage horizontal scroll
 */
export function CategoryCard({ category, articleCount }) {
  const { t, lang } = useApp()

  return (
    <Link
      to={`/articles#${category.id}`}
      className="group card-hover flex flex-col overflow-hidden rounded-[1.25rem] shrink-0 w-[260px] sm:w-[300px] h-[160px] transition-colors"
      style={{
        background: `linear-gradient(135deg, ${hexToRgba(category.color, 0.95)}, ${hexToRgba(category.color, 0.75)})`
      }}
    >
      <div className="flex flex-col flex-1 p-5 text-white">
        <div className="mb-2">
          <Icon name={category.icon} size={24} className="text-white/90" />
        </div>
        <h3 className="text-lg font-bold leading-tight">{t(category.title)}</h3>
        {lang === 'zh' && category.title.en && (
          <p className="text-xs text-white/60 mt-0.5">{category.title.en}</p>
        )}
        <p className="text-xs text-white/70 mt-1.5 line-clamp-2 flex-1">
          {t(category.description)}
        </p>
        <div className="flex justify-end mt-auto">
          <span className="text-sm font-medium text-white/80">
            {articleCount} {lang === 'zh' ? '篇' : ''} →
          </span>
        </div>
      </div>
    </Link>
  )
}
