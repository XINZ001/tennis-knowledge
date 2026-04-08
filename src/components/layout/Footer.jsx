import { useApp } from '../../context/AppContext'

export default function Footer() {
  const { lang } = useApp()
  return (
    <footer className="border-t border-stone-border bg-stone-card py-4 px-6 text-center text-xs text-text-secondary">
      <p>{lang === 'zh' ? '网球知识库' : lang === 'en' ? 'Xin Library' : '테니스 지식 라이브러리'}</p>
      <p className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span>{lang === 'zh' ? '制作人：行之' : lang === 'en' ? 'Created by Xingzhi' : '제작자: 행지'}</span>
        <a
          href="https://xhslink.com/m/7LQ0G4Nh0oU"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded border border-stone-border bg-stone-card px-2 py-1 text-text-secondary transition-colors hover:border-forest/40 hover:bg-stone-hover"
        >
          <img src="/images/xiaohongshu-logo.png" alt={lang === 'zh' ? '小红书' : 'Xiaohongshu'} className="h-4 w-4 rounded object-contain" />
          <span>{lang === 'zh' ? '小红书' : 'Xiaohongshu'}</span>
        </a>
      </p>
    </footer>
  )
}
