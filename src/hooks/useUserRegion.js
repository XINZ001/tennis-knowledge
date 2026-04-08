import { useState, useEffect } from 'react'

const SESSION_KEY = 'user_region'

/**
 * Detects user's geographic region via IP geolocation.
 * Results are cached in sessionStorage to avoid repeated requests.
 *
 * @returns {{ region: string, isMainlandChina: boolean, loading: boolean }}
 */
export function useUserRegion() {
  const [region, setRegion] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check session cache first
    const cached = sessionStorage.getItem(SESSION_KEY)
    if (cached) {
      setRegion(cached)
      setLoading(false)
      return
    }

    let cancelled = false

    async function detectRegion() {
      try {
        const res = await fetch('https://api.country.is/', { signal: AbortSignal.timeout(4000) })
        if (!res.ok) throw new Error('Non-OK response')
        const data = await res.json()
        const countryCode = data?.country || ''
        if (!cancelled) {
          sessionStorage.setItem(SESSION_KEY, countryCode)
          setRegion(countryCode)
        }
      } catch {
        // Fallback: treat as non-mainland (YouTube embeds work globally)
        if (!cancelled) {
          sessionStorage.setItem(SESSION_KEY, '')
          setRegion('')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    detectRegion()
    return () => { cancelled = true }
  }, [])

  return {
    region: region ?? '',
    isMainlandChina: region === 'CN',
    loading,
  }
}
