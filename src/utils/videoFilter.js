/**
 * Filter and rank videos for a knowledge point based on user region and language.
 *
 * Scenario A: isMainlandChina === true
 *   → Show only bilibili videos
 *
 * Scenario B: !isMainlandChina && lang === 'en'
 *   → Show only youtube videos
 *
 * Scenario C: !isMainlandChina && lang === 'zh'
 *   → Show all platforms (youtube + bilibili)
 *
 * Within each scenario, sort by:
 *   1. relevance: "primary" before "secondary"
 *   2. quality descending
 *   3. For ties: prefer platform that matches the scenario's preferred platform
 *
 * @param {Array} videos - All videos for a KP from videos.json
 * @param {boolean} isMainlandChina - True if user IP is in mainland China
 * @param {string} lang - Current UI language: "zh" | "en"
 * @returns {Array} Filtered and sorted videos; first item is the recommended "best" video
 */
export function filterAndRankVideos(videos, isMainlandChina, lang) {
  if (!Array.isArray(videos) || videos.length === 0) return []

  // Step 1: Filter by platform based on scenario
  let filtered
  if (isMainlandChina) {
    // Scenario A: only bilibili
    filtered = videos.filter(v => v.platform === 'bilibili')
  } else if (lang === 'en') {
    // Scenario B: only youtube
    filtered = videos.filter(v => v.platform === 'youtube')
  } else {
    // Scenario C: all platforms
    filtered = [...videos]
  }

  // Step 2: Sort
  const preferredPlatform = isMainlandChina
    ? 'bilibili'
    : lang === 'en'
      ? 'youtube'
      : null // Scenario C: prefer lang-matching

  filtered.sort((a, b) => {
    // 1. relevance: primary > secondary
    const relevanceOrder = { primary: 0, secondary: 1 }
    const rDiff = (relevanceOrder[a.relevance] ?? 1) - (relevanceOrder[b.relevance] ?? 1)
    if (rDiff !== 0) return rDiff

    // 2. quality descending
    const qDiff = (b.quality ?? 0) - (a.quality ?? 0)
    if (qDiff !== 0) return qDiff

    // 3. platform preference
    if (preferredPlatform) {
      const aMatch = a.platform === preferredPlatform ? 0 : 1
      const bMatch = b.platform === preferredPlatform ? 0 : 1
      if (aMatch !== bMatch) return aMatch - bMatch
    } else {
      // Scenario C: prefer video whose lang matches the UI lang
      const aMatch = a.lang === lang ? 0 : 1
      const bMatch = b.lang === lang ? 0 : 1
      if (aMatch !== bMatch) return aMatch - bMatch
    }

    return 0
  })

  return filtered
}
