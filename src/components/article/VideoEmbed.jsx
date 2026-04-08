export default function VideoEmbed({ platform, videoId }) {
  if (!videoId) return null

  const src = platform === 'bilibili'
    ? `https://player.bilibili.com/player.html?bvid=${videoId}&high_quality=1`
    : `https://www.youtube.com/embed/${videoId}`

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-stone-border shadow-sm">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={src}
          title={platform === 'bilibili' ? 'Bilibili video' : 'YouTube video'}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  )
}
