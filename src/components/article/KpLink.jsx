import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

export default function KpLink({ kpId, children }) {
  const { getKpRoute } = useApp()
  const navigate = useNavigate()
  const route = getKpRoute?.(kpId)

  if (route) {
    // Append #kp-id so TopicPage scrolls to the exact knowledge point
    const fullRoute = `${route}#${kpId}`
    return (
      <a
        href={fullRoute}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          navigate(fullRoute)
        }}
        className="text-forest border-b border-forest/30 hover:border-forest/60 transition-colors cursor-pointer"
      >
        {children}
      </a>
    )
  }

  // Fallback: no route found, render as styled text
  return <span className="text-forest font-medium">{children}</span>
}
