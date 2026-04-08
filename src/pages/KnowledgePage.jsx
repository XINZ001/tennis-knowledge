import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Icon } from '../utils/icons'
import PageSEO from '../components/PageSEO'

export default function KnowledgePage() {
  const { sections, t, lang } = useApp()

  return (
    <div className="relative">
      <PageSEO
        title={lang === 'zh' ? '知识库' : lang === 'en' ? 'Knowledge Base' : '지식 라이브러리'}
        description={lang === 'zh'
          ? '系统化的网球知识体系，涵盖技术、战术、心理、装备与体能等十大模块。'
          : lang === 'en'
          ? 'A systematic tennis knowledge base covering technique, tactics, mental game, gear, fitness and more across ten modules.'
          : '체계적인 테니스 지식 베이스 — 기술, 전술, 멘탈, 장비, 체력 등 10개 모듈을 다룹니다.'}
        path="/knowledge"
      />
      {/* 全景渐变背景 */}
      <div className="absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top_left,_rgba(74,124,89,0.18),_transparent_50%),radial-gradient(circle_at_top_right,_rgba(93,64,55,0.14),_transparent_45%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-[240px] h-[80px] bg-gradient-to-b from-transparent to-stone-bg pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-8">
        <div className="max-w-3xl mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {lang === 'zh' ? '网球知识库' : lang === 'en' ? 'Tennis Knowledge Base' : '테니스 지식 라이브러리'}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-text-secondary leading-relaxed">
            {lang === 'zh'
              ? '系统化的网球知识体系，涵盖技术、战术、心理、装备与体能等 10 大领域，助你全面提升网球水平。'
              : lang === 'en'
              ? 'A systematic knowledge base covering technique, tactics, mental game, gear, fitness and more across 10 domains to help you improve.'
              : '기술, 전술, 멘탈, 장비, 체력 등 10개 분야를 아우르는 체계적인 테니스 지식 베이스로 실력을 향상시키세요.'}
          </p>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sections.map((section) => (
          <Link
            key={section.id}
            to={`/section/${section.slug}`}
            className="group card-hover block bg-stone-card rounded-xl border border-stone-border p-5 hover:border-stone-border/80 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform"
                style={{ backgroundColor: section.color }}
              >
                <Icon name={section.icon} size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold text-base leading-tight">{t(section.title)}</h2>
                {lang === 'zh' && section.title.en && (
                  <p className="text-xs text-text-secondary mt-0.5">
                    {section.title.en}
                  </p>
                )}
              </div>
            </div>
            <p className="text-sm text-text-secondary mt-3 line-clamp-2">
              {t(section.description)}
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs text-text-secondary">
              <span>
                {section.subSections.length}
                {lang === 'zh' ? ' 个子分类' : lang === 'en' ? ' subcategories' : '개 하위 카테고리'}
              </span>
            </div>
          </Link>
        ))}
      </div>
      </div>
    </div>
  )
}
