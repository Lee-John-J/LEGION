import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Copy text to the clipboard and expose a short-lived `copied` flag so the
 * triggering button can confirm the action ("COPIED") instead of succeeding
 * silently.
 */
export function useClipboard(resetMs = 1600) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), resetMs)
    } catch {
      // Clipboard access can be denied (permissions, insecure context). The
      // code stays visible on screen to copy by hand, so fail quietly.
      setCopied(false)
    }
  }, [resetMs])

  return { copied, copy }
}
