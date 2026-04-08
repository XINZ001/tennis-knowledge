import { Icon } from '../../utils/icons'
import { useApp } from '../../context/AppContext'

const TITLE = { zh: '小贴士', en: 'Tip', ko: '팁' }

export default function TipBlock({ children }) {
  const { lang } = useApp()
  return (
    <div className="my-6 tip-block border-l-4 rounded-r-lg p-5">
      <div className="flex items-center gap-2 mb-2 tip-block-title font-semibold text-xs">
        <Icon name="lightbulb" size={16} />
        <span>{TITLE[lang] || TITLE.en}</span>
      </div>
      <div className="text-sm leading-relaxed text-text-primary/90">
        {children}
      </div>
    </div>
  )
}
