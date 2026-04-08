import { useApp } from '../../context/AppContext'

export default function IllustrationEmbed({ kpId, caption }) {
  const { t } = useApp()
  const src = `/images/illustrations/${kpId}.png`

  return (
    <figure className="my-6">
      <div className="rounded-xl overflow-hidden border border-stone-border">
        <img
          src={src}
          alt={typeof caption === 'object' ? t(caption) : (caption || kpId)}
          className="w-full object-contain"
          loading="lazy"
          onError={(e) => {
            // Hide broken images gracefully
            e.target.closest('figure').style.display = 'none'
          }}
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-xs text-text-secondary">
          {typeof caption === 'object' ? t(caption) : caption}
        </figcaption>
      )}
    </figure>
  )
}
