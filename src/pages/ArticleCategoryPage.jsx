import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Icon } from '../utils/icons'
import ArticleCard from '../components/article/ArticleCard'
import PageSEO from '../components/PageSEO'
import articleRegistry from '../data/article-registry.json'

const categoryIcons = { beginner: 'rocket', women: 'heart', progression: 'trendingUp', training: 'dumbbell', outdoor: 'sun' }

export default function ArticleCategoryPage() {
  const { categoryId } = useParams()
  const { t, lang } = useApp()

  const category = useMemo(() =>
    articleRegistry.categories.find(c => c.id === categoryId),
    [categoryId]
  )

  const catArticles = useMemo(() =>
    articleRegistry.articles.filter(a => a.category === categoryId),
    [categoryId]
  )

  // Other categories for bottom navigation
  const otherCategories = useMemo(() =>
    articleRegistry.categories.filter(c => c.id !== categoryId),
    [categoryId]
  )

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-text-secondary">
          {lang === 'zh' ? '分类未找到' : lang === 'en' ? 'Category not found' : '카테고리를 찾을 수 없습니다'}
        </p>
        <Link to="/articles" className="text-forest hover:underline mt-4 inline-block">
          {lang === 'zh' ? '← 返回专栏' : lang === 'en' ? '← Back to Column' : '← 칼럼으로 돌아가기'}
        </Link>
      </div>
    )
  }

  const color = category.color

  return (
    <div className="relative">
      <PageSEO
        path={`/articles/category/${categoryId}`}
        title={`${t(category.title)} | ${lang === 'zh' ? '攀岩专栏' : 'Climbing Column'}`}
      />

      {/* 全景渐变背景 — teal 色系 */}
      <div className="absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(circle_at_top_left,_rgba(91,127,191,0.16),_transparent_50%),radial-gradient(circle_at_top_right,_rgba(74,107,166,0.12),_transparent_45%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-[200px] h-[80px] bg-gradient-to-b from-transparent to-stone-bg pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-8">

      {/* Back link */}
      <Link
        to="/articles"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-teal transition-colors mb-6"
      >
        <Icon name="chevronLeft" size={16} />
        {lang === 'zh' ? '返回专栏' : lang === 'en' ? 'Back to Column' : '칼럼으로 돌아가기'}
      </Link>

      {/* Category header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: color }}
          >
            <Icon name={categoryIcons[categoryId] || 'book'} size={20} />
          </span>
          <div>
            <h1 className="text-2xl font-bold leading-tight">{t(category.title)}</h1>
            {lang === 'zh' && category.title.en && (
              <p className="text-sm text-text-secondary">{category.title.en}</p>
            )}
          </div>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          {t(category.description)}
        </p>
        <p className="text-xs text-text-secondary mt-2">
          {lang === 'zh'
            ? `共 ${catArticles.length} 篇文章`
            : lang === 'en'
            ? `${catArticles.length} articles`
            : `총 ${catArticles.length}편`}
        </p>
      </div>

      {/* All articles in this category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {catArticles.map(article => (
          <ArticleCard key={article.id} article={article} variant="large" />
        ))}
      </div>

      {catArticles.length === 0 && (
        <div className="text-center py-16 text-text-secondary text-sm rounded-xl bg-stone-bg/50 border border-dashed border-stone-border">
          {lang === 'zh' ? '文章即将上线' : lang === 'en' ? 'Articles coming soon' : '글이 곧 제공됩니다'}
        </div>
      )}

      {/* Other categories navigation */}
      {otherCategories.length > 0 && (
        <div className="mt-12 pt-8 border-t border-stone-border">
          <h3 className="text-sm font-semibold mb-4">
            {lang === 'zh' ? '浏览其他专题' : lang === 'en' ? 'Browse other topics' : '다른 주제 탐색'}
          </h3>
          <div className="flex flex-wrap gap-3">
            {otherCategories.map(cat => {
              const count = articleRegistry.articles.filter(a => a.category === cat.id).length
              return (
                <Link
                  key={cat.id}
                  to={`/articles/category/${cat.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-border bg-stone-card/80 hover:shadow-md hover:border-teal/30 transition-all"
                >
                  <span
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: cat.color }}
                  >
                    <Icon name={categoryIcons[cat.id] || 'book'} size={12} />
                  </span>
                  <span className="text-sm font-medium">{t(cat.title)}</span>
                  <span className="text-xs text-text-secondary">({count})</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
