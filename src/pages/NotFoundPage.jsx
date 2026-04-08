import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function NotFoundPage() {
  const { lang } = useApp()

  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <h1 className="text-6xl font-bold text-stone-border mb-4">404</h1>
      <p className="text-lg text-text-secondary mb-6">
        {lang === 'zh' ? '页面未找到' : lang === 'en' ? 'Page not found' : '페이지를 찾을 수 없습니다'}
      </p>
      <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-forest text-white rounded-lg hover:bg-forest-dark transition-colors text-sm">
        {lang === 'zh' ? '返回首页' : lang === 'en' ? 'Back to Home' : '홈으로 돌아가기'}
      </Link>
    </div>
  )
}
