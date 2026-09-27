import { useCallback, useSyncExternalStore } from 'react'

/**
 * Live boolean for a CSS media query. Charts use it to switch to a
 * phone-sized geometry: an SVG drawn on a desktop canvas and scaled down to
 * a phone renders its labels at 4-7px.
 */
export function useMediaQuery(query) {
  const subscribe = useCallback((onChange) => {
    const mql = window.matchMedia(query)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** The phone breakpoint shared with index.css (max-width: 560px) */
export const PHONE_QUERY = '(max-width: 560px)'
