import { useApp } from '../../context/AppContext'
import { Icon } from '../../utils/icons'

export default function ThemeToggle({ size = 18, className = '' }) {
  const { theme, setTheme } = useApp()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`btn-press flex items-center justify-center rounded-md hover:bg-stone-sidebar transition-colors ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Icon name={isDark ? 'sun' : 'moon'} size={size} className="text-text-secondary" />
    </button>
  )
}
