import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import Fuse from 'fuse.js'
import sectionsIndex from '../data/sections.json'
import searchSynonyms from '../data/search-synonyms.json'
import kpRegistry from '../data/kp-registry.json'
import articleRegistry from '../data/article-registry.json'
import athleteRegistry from '../data/athlete-registry.json'

const AppContext = createContext(null)

const sectionDataModules = import.meta.glob('../data/section-*.json')
const articleContentModules = import.meta.glob('../data/articles/*.json')

export function AppProvider({ children }) {
  const [sections] = useState(sectionsIndex.sections)
  const [loadedSections, setLoadedSections] = useState({})
  const [searchIndex, setSearchIndex] = useState(null)
  const [searchIndexLoose, setSearchIndexLoose] = useState(null)
  const [searchReady, setSearchReady] = useState(false)
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'zh')
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    localStorage.setItem('lang', lang)
  }, [lang])

  useEffect(() => {
    localStorage.setItem('theme', theme)
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  const loadSectionData = useCallback(async (sectionId) => {
    if (loadedSections[sectionId]) return loadedSections[sectionId]

    const section = sections.find(s => s.id === sectionId)
    if (!section) return null

    const fileName = `section-${sectionId.split('-')[1]}`
    const matchingKey = Object.keys(sectionDataModules).find(key => key.includes(fileName))

    if (!matchingKey) return null

    try {
      const mod = await sectionDataModules[matchingKey]()
      const data = mod.default || mod
      setLoadedSections(prev => ({ ...prev, [sectionId]: data }))
      return data
    } catch {
      return null
    }
  }, [loadedSections, sections])

  // Build search index after initial render
  useEffect(() => {
    const buildIndex = async () => {
      try {
      const allDocs = []

      const loadPromises = Object.entries(sectionDataModules).map(async ([key, loader]) => {
        try {
          const mod = await loader()
          return mod.default || mod
        } catch (e) {
          console.warn('[Search] Failed to load section module:', key, e)
          return null
        }
      })

      const allData = await Promise.all(loadPromises)

      allData.forEach(data => {
        if (!data?.subSections) return
        const section = sections.find(s => s.id === data.sectionId)
        if (!section) return

        data.subSections.forEach(sub => {
          if (!sub.knowledgePoints) return
          sub.knowledgePoints.forEach(kp => {
            const registryEntry = kpRegistry.knowledgePoints.find(r => r.id === kp.id)
            const keywords = registryEntry?.keywords?.join(' ') || ''
            allDocs.push({
              id: kp.id,
              _type: 'kp',
              sectionId: data.sectionId,
              sectionSlug: section.slug,
              sectionTitle_zh: section.title.zh,
              sectionTitle_en: section.title.en,
              sectionTitle_ko: section.title.ko || '',
              subSectionSlug: sub.slug,
              subTitle_zh: sub.title.zh,
              subTitle_en: sub.title.en,
              subTitle_ko: sub.title.ko || '',
              title_zh: kp.title.zh,
              title_en: kp.title.en,
              title_ko: kp.title.ko || '',
              content_zh: kp.content?.zh || '',
              content_en: kp.content?.en || '',
              content_ko: kp.content?.ko || '',
              terms_zh: (Array.isArray(kp.terms) ? kp.terms : []).map(t => t?.zh || '').join(' '),
              terms_en: (Array.isArray(kp.terms) ? kp.terms : []).map(t => t?.en || '').join(' '),
              terms_ko: (Array.isArray(kp.terms) ? kp.terms : []).map(t => t?.ko || '').join(' '),
              tags: (kp.tags || []).join(' '),
              keywords,
              synonyms: searchSynonyms[kp.id] || ''
            })
          })
        })

        // Also cache loaded data
        setLoadedSections(prev => ({ ...prev, [data.sectionId]: data }))
      })

      // ── 文章索引（加载正文内容用于全文搜索） ──
      const articleContentMap = {}
      const articleLoadPromises = Object.entries(articleContentModules).map(async ([key, loader]) => {
        try {
          const mod = await loader()
          const data = mod.default || mod
          if (data?.slug) articleContentMap[data.slug] = data
        } catch (e) { console.warn('[Search] Failed to load article:', key, e) }
      })
      await Promise.all(articleLoadPromises)

      articleRegistry.articles.forEach(article => {
        const cat = articleRegistry.categories.find(c => c.id === article.category)
        const fullContent = articleContentMap[article.slug]
        allDocs.push({
          id: article.id,
          _type: 'article',
          slug: article.slug,
          categoryId: article.category,
          categoryTitle_zh: cat?.title?.zh || '',
          categoryTitle_en: cat?.title?.en || '',
          categoryTitle_ko: cat?.title?.ko || '',
          title_zh: article.title?.zh || '',
          title_en: article.title?.en || '',
          title_ko: article.title?.ko || '',
          content_zh: fullContent?.content?.zh || article.subtitle?.zh || '',
          content_en: fullContent?.content?.en || article.subtitle?.en || '',
          content_ko: fullContent?.content?.ko || article.subtitle?.ko || '',
          terms_zh: article.subtitle?.zh || '',
          terms_en: article.subtitle?.en || '',
          terms_ko: article.subtitle?.ko || '',
          tags: (article.tags || []).join(' '),
          keywords: (article.seo?.keywords || []).join(' '),
          synonyms: '',
          emoji: article.emoji || '',
          readingTime: article.readingTime || 0,
        })
      })

      // ── 运动员索引 ──
      athleteRegistry.athletes.forEach(athlete => {
        allDocs.push({
          id: athlete.athleteId,
          _type: 'athlete',
          slug: athlete.slug,
          category: athlete.category,
          title_zh: athlete.athleteName?.zh || '',
          title_en: athlete.athleteName?.en || '',
          title_ko: athlete.athleteName?.ko || '',
          content_zh: (athlete.tagline?.zh || '') + ' ' + (athlete.overview?.zh || ''),
          content_en: (athlete.tagline?.en || '') + ' ' + (athlete.overview?.en || ''),
          content_ko: (athlete.tagline?.ko || '') + ' ' + (athlete.overview?.ko || ''),
          terms_zh: athlete.nationality?.zh || '',
          terms_en: athlete.nationality?.en || '',
          terms_ko: athlete.nationality?.ko || '',
          tags: [athlete.category, athlete.subcategory].filter(Boolean).join(' '),
          keywords: '',
          synonyms: '',
          accentColor: athlete.accentColor || '',
        })
      })

      if (allDocs.length > 0) {
        const fuse = new Fuse(allDocs, {
          keys: [
            { name: 'title_zh', weight: 3.0 },
            { name: 'title_en', weight: 3.0 },
            { name: 'title_ko', weight: 3.0 },
            { name: 'terms_zh', weight: 2.5 },
            { name: 'terms_en', weight: 2.5 },
            { name: 'terms_ko', weight: 2.5 },
            { name: 'synonyms', weight: 2.0 },
            { name: 'keywords', weight: 2.0 },
            { name: 'tags', weight: 1.5 },
            { name: 'content_zh', weight: 1.0 },
            { name: 'content_en', weight: 1.0 },
            { name: 'content_ko', weight: 1.0 }
          ],
          threshold: 0.4,
          includeMatches: true,
          minMatchCharLength: 1,
          ignoreLocation: true
        })
        setSearchIndex(fuse)

        // Loose fallback index for "did you mean" suggestions
        const fuseLoose = new Fuse(allDocs, {
          keys: [
            { name: 'title_zh', weight: 3.0 },
            { name: 'title_en', weight: 3.0 },
            { name: 'title_ko', weight: 3.0 },
            { name: 'terms_zh', weight: 2.5 },
            { name: 'terms_en', weight: 2.5 },
            { name: 'terms_ko', weight: 2.5 },
            { name: 'synonyms', weight: 2.0 },
            { name: 'keywords', weight: 2.0 },
            { name: 'tags', weight: 1.5 },
            { name: 'content_zh', weight: 1.0 },
            { name: 'content_en', weight: 1.0 },
            { name: 'content_ko', weight: 1.0 }
          ],
          threshold: 0.6,
          includeMatches: false,
          minMatchCharLength: 1,
          ignoreLocation: true
        })
        setSearchIndexLoose(fuseLoose)
      }
      setSearchReady(true)
      } catch (e) {
        console.error('[Search] buildIndex crashed:', e)
        setSearchReady(true) // 即使出错也解除加载状态，避免永远卡住
      }
    }

    buildIndex()
  }, [sections])

  const search = useCallback((query) => {
    if (!searchIndex || !query.trim()) return []
    const raw = searchIndex.search(query.trim())
    const q = query.trim().toLowerCase()

    // 二次排序：Fuse.js 分数相同时，标题精确匹配且更短的排前面
    // 解决 "janja" 搜索时文章标题含 Janja 但运动员名字就是 Janja 却排后面的问题
    const scored = raw.map(r => {
      const titles = [r.item.title_zh, r.item.title_en, r.item.title_ko].map(t => (t || '').toLowerCase())
      const titleExact = titles.some(t => t === q)           // 标题完全等于搜索词
      const titleStartsWith = titles.some(t => t.startsWith(q)) // 标题以搜索词开头
      const titleContains = titles.some(t => t.includes(q))  // 标题包含搜索词
      const minTitleLen = Math.min(...titles.filter(t => t.includes(q)).map(t => t.length), 9999)

      // 精确度分（越小越好，用于同分时排序）
      let precision = 0
      if (titleExact) precision = -3
      else if (titleStartsWith) precision = -2
      else if (titleContains) precision = -1 + (minTitleLen / 10000)  // 标题越短越精确

      return { ...r, _precision: precision }
    })

    scored.sort((a, b) => {
      // 先按 Fuse score 排（越小越好）
      const scoreDiff = (a.score || 0) - (b.score || 0)
      if (Math.abs(scoreDiff) > 0.001) return scoreDiff
      // 分数接近时，按精确度排
      return a._precision - b._precision
    })

    return scored.slice(0, 50)
  }, [searchIndex])

  // Loose search for "did you mean" suggestions (threshold 0.6)
  const searchSuggest = useCallback((query) => {
    if (!searchIndexLoose || !query.trim()) return []
    return searchIndexLoose.search(query.trim()).slice(0, 5)
  }, [searchIndexLoose])

  const t = useCallback((obj) => {
    if (!obj) return ''
    if (typeof obj === 'string') return obj
    return obj[lang] || obj.zh || obj.en || obj.ko || ''
  }, [lang])

  // KP ID → route mapping for article KP links
  // Built from static kp-registry.json so it works even before sections are lazy-loaded
  const kpRouteMap = useMemo(() => {
    const map = {}
    kpRegistry.knowledgePoints.forEach(kp => {
      if (kp.sectionSlug && kp.subSectionSlug) {
        map[kp.id] = `/section/${kp.sectionSlug}/${kp.subSectionSlug}`
      }
    })
    return map
  }, [])

  const getKpRoute = useCallback((kpId) => {
    return kpRouteMap[kpId] || null
  }, [kpRouteMap])

  return (
    <AppContext.Provider value={{
      sections,
      loadedSections,
      loadSectionData,
      search,
      searchSuggest,
      searchReady,
      lang,
      setLang,
      theme,
      setTheme,
      t,
      getKpRoute
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
