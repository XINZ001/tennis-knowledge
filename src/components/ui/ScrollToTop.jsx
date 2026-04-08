import { useState, useEffect } from 'react'
import { Icon } from '../../utils/icons'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`btn-press fixed bottom-6 right-6 z-30 w-10 h-10 bg-forest text-white rounded-full shadow-lg flex items-center justify-center hover:bg-forest-dark transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      aria-label="Back to top"
    >
      <Icon name="arrowUp" size={18} />
    </button>
  )
}
