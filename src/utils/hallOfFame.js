import athleteRegistry from '../data/athlete-registry.json'
import crossReferences from '../data/cross-references.json'
import hallOfFameMedia from '../data/hall-of-fame-media'
import athleteAvatars from '../data/athlete-avatars.json'

export const hallOfFameRegistry = athleteRegistry

// Category order controls how athletes are sorted on the list page.
// 'chinese-rep' is a virtual cross-cutting filter (not a real category),
// so it is intentionally excluded from this sort order.
export const hallOfFameCategoryOrder = ['legend', 'elite', 'explorer', 'innovator']

// Tab filter keys: all, then 8 category+subcategory columns, then chinese-rep.
export const hallOfFameTabOrder = [
  'all',
  'elite-lead-sport',
  'elite-bouldering',
  'elite-speed',
  'explorer-free-climbing',
  'explorer-big-wall',
  'explorer-free-solo',
  'legend',
  'innovator',
  'chinese-rep'
]

// --- Two-level navigation: main categories first, then sub for 竞技 / 探险 ---
// Order of main buttons on the page (no athletes shown until one is selected).
// 'all' (全部人物) removed so users browse by category only and avoid duplicate-looking entries.
export const hallOfFameMainOrder = ['elite', 'explorer', 'legend', 'innovator', 'chinese-rep']

export const hallOfFameMainCategories = {
  all: {
    zh: '全部人物',
    en: 'All Athletes',
    ko: '전체 선수',
    description: { zh: '名人堂全量条目', en: 'Complete Hall of Fame roster', ko: '명예의 전당 전체 목록' },
    intro: {
      zh: '涵盖竞技精英、探险攀登、历史先驱与训练革新等所有栏目，一次浏览名人堂全部收录人物。',
      en: 'Browse the full Hall of Fame across competition, adventure, legends, and innovators.',
      ko: '대회, 모험, 전설, 혁신가 등 명예의 전당에 등재된 모든 인물을 한눈에 살펴보세요.'
    }
  },
  elite: {
    zh: '竞技运动员',
    en: 'Competition Athletes',
    ko: '대회 선수',
    description: { zh: '国际赛场先锋、抱石、速度项目代表', en: 'Lead, bouldering, and speed competition athletes', ko: '리드, 볼더링, 스피드 대회 선수' },
    intro: {
      zh: '在国际赛场改写难度与速度上限的运动员：IFSC 世界杯与奥运赛场上的先锋、抱石、速度项目代表，无论国籍，以成绩与风格说话。',
      en: 'Athletes who redefined limits on the world stage — lead, bouldering, and speed — at World Cups and the Olympics.',
      ko: '월드컵과 올림픽 무대에서 리드, 볼더링, 스피드 종목의 한계를 다시 쓴 선수들이에요.'
    }
  },
  explorer: {
    zh: '攀岩探险家',
    en: 'Adventure Climbers',
    ko: '모험 클라이머',
    description: { zh: '自由攀登、大岩壁、无保护独攀代表', en: 'Free climbing, big wall, and free solo', ko: '프리 클라이밍, 빅월, 프리 솔로' },
    intro: {
      zh: '把户外技术攀登推入新境界的人：自由攀登与极限路线开拓者、大岩壁多日攀登传奇、无保护独攀与 FreeBASE 的代表人物。',
      en: 'Those who pushed outdoor climbing into new territory: free ascent pioneers, big-wall legends, and free soloists.',
      ko: '아웃도어 클라이밍을 새로운 영역으로 이끈 인물들: 프리 클라이밍 개척자, 빅월 전설, 프리 솔로이스트.'
    }
  },
  legend: {
    zh: '历史先驱',
    en: 'Pioneering Legends',
    ko: '역사적 선구자',
    description: {
      zh: '奠定现代攀岩的底层逻辑——动作语言、训练观念、文化身份',
      en: 'Foundational figures: movement language, training ideas, cultural identity',
      ko: '무브먼트, 훈련 철학, 문화적 정체성을 확립한 인물'
    },
    intro: {
      zh: '从抱石之父、红点与运动攀奠基人，到分级体系与风格哲学的创立者——他们定义了现代攀岩的动作语言与文化身份。',
      en: 'From the father of bouldering to the originators of redpoint and sport climbing — they defined modern climbing\'s movement and culture.',
      ko: '볼더링의 아버지부터 레드포인트와 스포츠 클라이밍의 창시자까지 — 현대 클라이밍의 무브먼트와 문화를 정의한 인물들이에요.'
    }
  },
  innovator: {
    zh: '训练革新',
    en: 'Training Innovators',
    ko: '훈련 혁신가',
    description: {
      zh: '发明或系统化了对攀岩训练界产生深远影响的方法与工具',
      en: 'Training methods and tools with lasting impact across the sport',
      ko: '클라이밍 훈련에 지속적인 영향을 미친 방법과 도구'
    },
    intro: {
      zh: 'Campus board、Moonboard、指力板与周期化训练等发明或系统化者，以及将科学方法与数据带入攀岩训练的推动者。',
      en: 'Inventors and systematizers of campus board, Moonboard, fingerboards, periodization, and data-driven training.',
      ko: '캠퍼스 보드, 문보드, 핑거보드, 주기화 훈련 등을 발명하거나 체계화하고, 과학적 방법을 클라이밍 훈련에 도입한 인물들이에요.'
    }
  },
  'chinese-rep': {
    zh: '中国运动员',
    en: 'Chinese Athletes',
    ko: '중국 선수',
    description: {
      zh: '横跨各类别的中国代表人物——成就属于攀岩世界，背景根植于中国',
      en: 'Chinese representatives across categories — achievements in climbing, roots in China',
      ko: '모든 카테고리에 걸친 중국 대표 인물 — 클라이밍 세계의 업적, 중국에 뿌리를 둔 배경'
    },
    intro: {
      zh: '横跨竞技、探险等栏目的中国代表人物：奥运奖牌得主、世锦赛冠军与本土攀登文化的推动者，成就属于攀岩世界，背景根植于中国。',
      en: 'Chinese representatives across categories — Olympic and world champions, and pioneers of climbing in China.',
      ko: '올림픽과 세계선수권 챔피언, 그리고 중국 클라이밍 문화의 개척자들이에요.'
    }
  }
}

// Sub-buttons when main = elite or explorer. Key is the filter key used in athleteMatchesTabKey.
export const hallOfFameSubCategories = {
  elite: [
    { key: 'elite-lead-sport', zh: '竞技·先锋', en: 'Lead', ko: '리드' },
    { key: 'elite-bouldering', zh: '竞技·抱石', en: 'Bouldering', ko: '볼더링' },
    { key: 'elite-speed', zh: '竞技·速度', en: 'Speed', ko: '스피드' }
  ],
  explorer: [
    { key: 'explorer-free-climbing', zh: '探险·自由攀', en: 'Free climbing', ko: '프리 클라이밍' },
    { key: 'explorer-big-wall', zh: '探险·大岩壁', en: 'Big wall', ko: '빅월' },
    { key: 'explorer-free-solo', zh: '探险·无保护独攀', en: 'Free solo', ko: '프리 솔로' }
  ]
}

/** Whether athlete matches (mainCategory, subKey). subKey '' = entire main category. */
export function athleteMatchesMainSub(athlete, mainCategory, subKey) {
  if (mainCategory === 'all') return true
  if (mainCategory === 'chinese-rep') return !!athlete.isChineseRepresentative
  if (mainCategory === 'legend') return athlete.category === 'legend'
  if (mainCategory === 'innovator') return athlete.category === 'innovator'
  if (mainCategory === 'elite') {
    if (athlete.category !== 'elite') return false
    if (!subKey) return true
    return athlete.subcategory === subKey
  }
  if (mainCategory === 'explorer') {
    if (athlete.category !== 'explorer') return false
    if (!subKey) return true
    return athlete.subcategory === subKey
  }
  return false
}

export const hallOfFameCategories = {
  all: {
    zh: '全部人物',
    en: 'All Athletes',
    ko: '전체 선수',
    description: { zh: '名人堂全量条目', en: 'Complete Hall of Fame roster', ko: '명예의 전당 전체 목록' }
  },
  'elite-lead-sport': {
    zh: '竞技·先锋',
    en: 'Elite · Lead',
    ko: '대회 · 리드',
    description: { zh: '国际赛场先锋/难度项目代表', en: 'Lead sport competition athletes', ko: '리드 대회 선수' }
  },
  'elite-bouldering': {
    zh: '竞技·抱石',
    en: 'Elite · Bouldering',
    ko: '대회 · 볼더링',
    description: { zh: '国际赛场抱石项目代表', en: 'Bouldering competition athletes', ko: '볼더링 대회 선수' }
  },
  'elite-speed': {
    zh: '竞技·速度',
    en: 'Elite · Speed',
    ko: '대회 · 스피드',
    description: { zh: '国际赛场速度项目代表', en: 'Speed climbing athletes', ko: '스피드 클라이밍 선수' }
  },
  'explorer-free-climbing': {
    zh: '探险·自由攀',
    en: 'Explorer · Free climbing',
    ko: '모험 · 프리 클라이밍',
    description: { zh: '户外自由攀登与极限路线开拓者', en: 'Free climbing and hard route pioneers', ko: '프리 클라이밍과 극한 루트 개척자' }
  },
  'explorer-big-wall': {
    zh: '探险·大岩壁',
    en: 'Explorer · Big wall',
    ko: '모험 · 빅월',
    description: { zh: '大岩壁多日攀登代表', en: 'Big wall climbers', ko: '빅월 클라이머' }
  },
  'explorer-free-solo': {
    zh: '探险·无保护独攀',
    en: 'Explorer · Free solo',
    ko: '모험 · 프리 솔로',
    description: { zh: '无保护独攀与 FreeBASE 代表', en: 'Free solo and FreeBASE', ko: '프리 솔로 및 FreeBASE' }
  },
  legend: {
    zh: '历史先驱',
    en: 'Pioneering Legends',
    ko: '역사적 선구자',
    description: {
      zh: '奠定现代攀岩的底层逻辑——动作语言、训练观念、文化身份',
      en: 'Foundational figures: movement language, training ideas, cultural identity',
      ko: '무브먼트, 훈련 철학, 문화적 정체성을 확립한 인물'
    }
  },
  innovator: {
    zh: '训练革新',
    en: 'Training Innovators',
    ko: '훈련 혁신가',
    description: {
      zh: '发明或系统化了对攀岩训练界产生深远影响的方法与工具',
      en: 'Training methods and tools with lasting impact across the sport',
      ko: '클라이밍 훈련에 지속적인 영향을 미친 방법과 도구'
    }
  },
  'chinese-rep': {
    zh: '中国运动员',
    en: 'Chinese Athletes',
    ko: '중국 선수',
    description: {
      zh: '横跨各类别的中国代表人物——成就属于攀岩世界，背景根植于中国',
      en: 'Chinese representatives across categories — achievements in climbing, roots in China',
      ko: '모든 카테고리에 걸친 중국 대표 인물'
    }
  }
}

export const hallOfFameChapterTypes = {
  'career-arc': { zh: '人生轨迹', en: 'Career Arc', ko: '커리어 궤적' },
  'competition-record': { zh: '竞技档案', en: 'Competition Record', ko: '대회 기록' },
  'training-system': { zh: '训练体系', en: 'Training System', ko: '훈련 체계' },
  'mental-game': { zh: '竞技心理', en: 'Mental Game', ko: '멘탈 게임' },
  'signature-routes': { zh: '标志性路线', en: 'Signature Routes', ko: '시그니처 루트' },
  'philosophy': { zh: '攀登哲学', en: 'Philosophy', ko: '클라이밍 철학' },
  'innovation': { zh: '革新贡献', en: 'Innovation', ko: '혁신 기여' },
  'quotes': { zh: '精选引语', en: 'Selected Quotes', ko: '명언 모음' },
  'china-context': { zh: '中国视角', en: 'China Context', ko: '중국 관점' }
}

export function getHallOfFameAthletes() {
  return [...hallOfFameRegistry.athletes].sort((a, b) => {
    const categoryDiff =
      hallOfFameCategoryOrder.indexOf(a.category) - hallOfFameCategoryOrder.indexOf(b.category)
    if (categoryDiff !== 0) return categoryDiff
    return a.athleteId.localeCompare(b.athleteId)
  })
}

/** Tab key for an athlete (category + subcategory, or legend/innovator). Used for filtering and card label. */
export function getTabKeyForAthlete(athlete) {
  if (athlete.category === 'elite' && athlete.subcategory)
    return `elite-${athlete.subcategory}`
  if (athlete.category === 'explorer' && athlete.subcategory)
    return `explorer-${athlete.subcategory}`
  if (athlete.category === 'legend' || athlete.category === 'innovator')
    return athlete.category
  return athlete.category
}

/** Whether athlete matches a tab filter key. */
export function athleteMatchesTabKey(athlete, tabKey) {
  if (tabKey === 'all') return true
  if (tabKey === 'chinese-rep') return !!athlete.isChineseRepresentative
  return getTabKeyForAthlete(athlete) === tabKey
}

export function getChineseRepresentativeAthletes() {
  return hallOfFameRegistry.athletes.filter((athlete) => !!athlete.isChineseRepresentative)
}

export function getHallOfFameAthleteBySlug(slug) {
  return hallOfFameRegistry.athletes.find((athlete) => athlete.slug === slug) || null
}

export function getHallOfFameChaptersForAthlete(athleteId) {
  const athlete = hallOfFameRegistry.athletes.find((entry) => entry.athleteId === athleteId)
  if (!athlete) return []
  const chapterMap = new Map(hallOfFameRegistry.chapters.map((chapter) => [chapter.id, chapter]))
  return (athlete.chapterIds || []).map((chapterId) => chapterMap.get(chapterId)).filter(Boolean)
}

export function getHallOfFameCrossReference(kpId) {
  return crossReferences.references[kpId] || null
}

export function getHallOfFameMedia(athleteId) {
  const base = hallOfFameMedia[athleteId] || {
    images: [],
    videos: [],
    bilibiliVideos: [],
    podcasts: [],
    timeline: [],
    interviewNotes: [],
    furtherReading: []
  }
  const avatarPath = athleteAvatars[athleteId]
  const athlete = hallOfFameRegistry.athletes.find((a) => a.athleteId === athleteId)
  const cardImage =
    base.cardImage ||
    (avatarPath && {
      src: avatarPath,
      alt: athlete ? athlete.athleteName : { zh: '', en: '' },
      objectPosition: 'center center'
    })
  return { ...base, ...(cardImage && { cardImage }) }
}
