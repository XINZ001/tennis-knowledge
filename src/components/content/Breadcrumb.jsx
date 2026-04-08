import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

export default function Breadcrumb({ section, subSection }) {
  const { t, lang } = useApp()

  return (
    <nav className="flex items-center gap-1.5 text-xs text-text-secondary flex-wrap">
      <Link to="/" className="hover:text-forest transition-colors">
        {lang === 'zh' ? '首页' : lang === 'en' ? 'Home' : '홈'}
      </Link>
      {section && (
        <>
          <span>/</span>
          <Link
            to={`/section/${section.slug}`}
            className="hover:text-forest transition-colors"
          >
            {t(section.title)}
          </Link>
        </>
      )}
      {subSection && (
        <>
          <span>/</span>
          <span className="text-text-primary font-medium">{t(subSection.title)}</span>
        </>
      )}
    </nav>
  )
}
