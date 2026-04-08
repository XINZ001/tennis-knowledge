import { Helmet } from 'react-helmet-async'
import { useApp } from '../context/AppContext'

const BASE_URL = 'https://xinlibrary.com'

const DEFAULTS = {
  zh: {
    title: '网球知识库',
    desc: '系统化的网球知识库——涵盖技术、战术、心理、装备与体能等领域。帮助网球爱好者从入门到进阶，科学提升网球水平。',
    locale: 'zh_CN'
  },
  en: {
    title: 'Xin Library',
    desc: 'A systematic tennis knowledge base — covering technique, tactics, mental game, gear and fitness. Helping tennis players progress from beginner to advanced.',
    locale: 'en_US'
  },
  ko: {
    title: '테니스 라이브러리',
    desc: '체계적인 테니스 지식 라이브러리 — 기술, 전술, 멘탈, 장비, 체력을 다룹니다. 초보자부터 상급자까지 과학적으로 테니스 실력을 향상시킵니다.',
    locale: 'ko_KR'
  }
}

const DEFAULT_IMAGE = `${BASE_URL}/images/og-cover.png`

export default function PageSEO({ title, description, path, image }) {
  const { lang } = useApp()
  const d = DEFAULTS[lang] || DEFAULTS.zh
  const fullTitle = title ? `${title} — ${d.title}` : d.title
  const desc = description || d.desc
  const url = path ? `${BASE_URL}${path}` : BASE_URL
  const img = image || DEFAULT_IMAGE

  return (
    <Helmet>
      <html lang={lang === 'zh' ? 'zh-CN' : lang === 'ko' ? 'ko' : 'en'} />
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:locale" content={d.locale} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  )
}
