import { Icon } from '../../utils/icons'
import { useApp } from '../../context/AppContext'

const TITLE = { zh: '专家观点', en: 'Expert Insight', ko: '전문가 의견' }

export default function ExpertQuote({ children }) {
  const { lang } = useApp()
  return (
    <div className="my-6 bg-forest-light border-l-4 border-forest rounded-r-lg p-5">
      <div className="flex items-center gap-2 mb-2 text-forest font-semibold text-xs">
        <Icon name="messageCircle" size={16} />
        <span>{TITLE[lang] || TITLE.en}</span>
      </div>
      <div className="text-sm leading-relaxed text-text-primary/90">
        {children}
      </div>
    </div>
  )
}
