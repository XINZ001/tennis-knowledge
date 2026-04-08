import { Icon } from '../../utils/icons'
import { useApp } from '../../context/AppContext'

const TITLE = { zh: '注意', en: 'Warning', ko: '주의' }

export default function WarningBlock({ children }) {
  const { lang } = useApp()
  return (
    <div className="my-6 warning-block border-l-4 rounded-r-lg p-5">
      <div className="flex items-center gap-2 mb-2 warning-block-title font-semibold text-xs">
        <Icon name="alertTriangle" size={16} />
        <span>{TITLE[lang] || TITLE.en}</span>
      </div>
      <div className="text-sm leading-relaxed text-text-primary/90">
        {children}
      </div>
    </div>
  )
}
