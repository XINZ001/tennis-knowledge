import { useState } from 'react'
import { useApp } from '../../context/AppContext'

function getEmbedInfo(url) {
  // YouTube: youtube.com/watch?v=ID or youtu.be/ID
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/)
  if (ytMatch) {
    return { platform: 'youtube', id: ytMatch[1] }
  }
  // Bilibili: bilibili.com/video/BVXXXXXXX
  const biliMatch = url.match(/bilibili\.com\/video\/(BV[\w]+)/)
  if (biliMatch) {
    return { platform: 'bilibili', id: biliMatch[1] }
  }
  return null
}

function VideoCard({ video }) {
  const { t, lang } = useApp()
  const [expanded, setExpanded] = useState(false)
  const embed = getEmbedInfo(video.url)
  const isEmbeddable = !!embed

  return (
    <div className="rounded-lg border border-stone-border overflow-hidden bg-stone-card">
      {/* Embed area (lazy load on click) */}
      {isEmbeddable && expanded && (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          {embed.platform === 'youtube' && (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${embed.id}`}
              title={t(video.title)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          )}
          {embed.platform === 'bilibili' && (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://player.bilibili.com/player.html?bvid=${embed.id}&high_quality=1`}
              title={t(video.title)}
              allowFullScreen
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          )}
        </div>
      )}

      {/* Thumbnail / click to play (for embeddable) */}
      {isEmbeddable && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="relative w-full bg-stone-bg group"
          style={{ paddingBottom: '56.25%' }}
        >
          {embed.platform === 'youtube' && (
            <img
              src={`https://img.youtube.com/vi/${embed.id}/mqdefault.jpg`}
              alt={t(video.title)}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          )}
          {embed.platform === 'bilibili' && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-bg">
              <div className="text-center">
                <svg className="w-10 h-10 mx-auto text-text-secondary group-hover:text-[#00A1D6] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.813 10.18l.046-.04c1.021-.9 2.25-.738 2.746.365.263.583.261 1.24.005 1.866-.343.834-.753 1.007-1.669.99l-.064-.002H18.8l-.072-.002c-.753-.023-1.32-.254-1.712-.714a.633.633 0 01-.1-.168l-.032-.085-.021-.087c-.09-.421.044-.86.35-1.2l.044-.049.558-.574zM6.22 10.48l.558.574c.35.397.475.897.326 1.37l-.032.085a.633.633 0 01-.1.168c-.392.46-.96.69-1.712.714l-.072.002h-.076l-.064.001c-.916.018-1.326-.155-1.669-.989-.256-.627-.258-1.283.005-1.866.496-1.103 1.725-1.265 2.746-.365l.046.04.044.266z" />
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm6.67 12.42c-.183 1.469-1.203 2.535-2.718 2.91-.545.134-1.1.181-1.664.18H9.712c-.564.001-1.12-.046-1.664-.18-1.515-.375-2.535-1.441-2.718-2.91-.122-.977-.08-1.963-.016-2.943.065-.978.463-1.793 1.341-2.34.317-.198.666-.32 1.036-.38.09-.015.135-.05.168-.134.264-.684.7-1.218 1.378-1.537.817-.385 1.614-.336 2.367.109.282.166.51.397.69.672.066.102.134.14.258.14h.895c.125 0 .193-.038.258-.14.18-.275.409-.506.69-.672.754-.445 1.55-.494 2.368-.109.678.319 1.114.853 1.378 1.537.033.085.078.119.167.134.37.06.72.182 1.037.38.878.547 1.276 1.362 1.34 2.34.065.98.107 1.966-.015 2.943z" />
                </svg>
                <span className="text-xs text-text-secondary mt-1 block group-hover:text-[#00A1D6] transition-colors">Bilibili</span>
              </div>
            </div>
          )}
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 bg-black/60 rounded-full flex items-center justify-center group-hover:bg-black/80 transition-colors">
              <svg className="w-6 h-6 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>
      )}

      {/* Info bar */}
      <div className="px-3 py-2.5">
        <div className="flex items-start gap-2">
          {/* Platform badge */}
          <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
            video.url.includes('bilibili') ? 'bg-[#00A1D6]/10 text-[#00A1D6]'
            : video.url.includes('youtube') || video.url.includes('youtu.be') ? 'bg-red-50 text-red-600'
            : 'bg-stone-bg text-text-secondary'
          }`}>
            {video.url.includes('bilibili') ? 'B站'
             : video.url.includes('youtube') || video.url.includes('youtu.be') ? 'YouTube'
             : 'Web'}
          </span>
          <div className="min-w-0 flex-1">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:text-forest transition-colors line-clamp-2"
            >
              {t(video.title)}
            </a>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-text-secondary truncate">{video.channel}</span>
              {video.lang && (
                <span className="text-[10px] px-1 py-px rounded bg-stone-bg text-text-secondary">
                  {video.lang === 'zh' ? '中文' : video.lang === 'en' ? 'EN' : '한국어'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VideoSection({ videos }) {
  const { lang } = useApp()

  if (!videos || videos.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
        {lang === 'zh' ? '相关视频' : lang === 'en' ? 'Related Videos' : '관련 영상'}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {videos.map((video, i) => (
          <VideoCard key={i} video={video} />
        ))}
      </div>
    </div>
  )
}
