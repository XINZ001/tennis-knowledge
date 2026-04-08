const STORAGE_KEY = 'illustration-feedback'

export function saveFeedback({ imageId, issues, note }) {
  const feedbacks = getFeedbacks()
  feedbacks.push({
    imageId,
    issues,
    note,
    timestamp: new Date().toISOString(),
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbacks))
}

export function getFeedbacks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function clearFeedback(imageId) {
  const feedbacks = getFeedbacks().filter(f => f.imageId !== imageId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbacks))
}

export function clearAllFeedback() {
  localStorage.removeItem(STORAGE_KEY)
}

export function extractImageId(src) {
  const match = src.match(/\/(kp-[^/]+)\.png$/)
  return match ? match[1] : src
}
