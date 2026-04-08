import { useParams, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Icon } from '../utils/icons'
import Breadcrumb from '../components/content/Breadcrumb'
import PageSEO from '../components/PageSEO'

export default function SectionPage() {
  const { sectionSlug } = useParams()
  const { sections, t, lang } = useApp()

  const section = sections.find(s => s.slug === sectionSlug)

  if (!section) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-xl font-semibold mb-2">
          {lang === 'zh' ? '未找到该分类' : lang === 'en' ? 'Category not found' : '카테고리를 찾을 수 없습니다'}
        </h1>
        <Link to="/" className="text-forest hover:underline text-sm">
          {lang === 'zh' ? '返回首页' : lang === 'en' ? 'Back to Home' : '홈으로 돌아가기'}
        </Link>
      </div>
    )
  }

  const sectionTitle = lang === 'zh' ? section.title.zh : lang === 'en' ? section.title.en : (section.title.ko || section.title.en)
  const sectionDesc = lang === 'zh' ? section.description.zh : lang === 'en' ? section.description.en : (section.description.ko || section.description.en)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <PageSEO title={sectionTitle} description={sectionDesc} path={`/section/${sectionSlug}`} />
      <Breadcrumb section={section} />

      <div className="mt-6">
        <div className="flex items-center gap-4 mb-6">
          <span
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: section.color }}
          >
            <Icon name={section.icon} size={24} />
          </span>
          <div>
            <h1 className="text-2xl font-bold">{t(section.title)}</h1>
            {lang === 'zh' && section.title.en && (
              <p className="text-sm text-text-secondary">{section.title.en}</p>
            )}
          </div>
        </div>

        <p className="text-text-secondary mb-8">{t(section.description)}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {section.subSections.map((sub, idx) => (
            <Link
              key={sub.id}
              to={`/section/${section.slug}/${sub.slug}`}
              className="card-hover flex items-center gap-3 bg-stone-card rounded-lg border border-stone-border p-4 hover:border-forest/30 transition-colors group"
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: section.color }}
              >
                {section.number}.{idx + 1}
              </span>
              <div className="min-w-0">
                <div className="font-medium text-sm group-hover:text-forest transition-colors">{t(sub.title)}</div>
                {lang === 'zh' && sub.title.en && (
                  <div className="text-xs text-text-secondary">{sub.title.en}</div>
                )}
              </div>
              <Icon name="chevronRight" size={16} className="ml-auto text-text-secondary shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
