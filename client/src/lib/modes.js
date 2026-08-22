/**
 * Game-mode naming shared by the Briefing and the Operation Log.
 *
 * The server already resolves human-readable mode names (services/stats.js
 * resolves by queueId first). These maps are the client-side fallback for
 * any raw Riot queueId / gameMode string that slips through unresolved.
 */

// Always shown on the Game Mode Breakdown, in this order, even with 0 games
export const STAPLE_MODES = ['Ranked', 'Ranked Flex', 'Normal', 'ARAM', 'ARAM Mayhem', 'Arena']

const QUEUE_NAMES = {
  420: 'Ranked',
  440: 'Ranked Flex',
  400: 'Normal',
  430: 'Normal',
  450: 'ARAM',
  2400: 'ARAM Mayhem',
  900: 'URF',
  1020: 'One for All',
  1300: 'Nexus Blitz',
  1700: 'Arena',
  1900: 'URF',
}

const MODE_NAMES = {
  CLASSIC: 'Normal',
  RANKED: 'Ranked',
  RANKED_FLEX: 'Ranked Flex',
  ARAM: 'ARAM',
  CHERRY: 'Arena',
  NEXUSBLITZ: 'Nexus Blitz',
  URF: 'URF',
  ARURF: 'ARURF',
  ULTBOOK: 'Ultimate Spellbook',
  ODIN: 'Dominion',
  ONEFORALL: 'One for All',
}

export function resolveMode(gameMode, queueId) {
  if (queueId != null && QUEUE_NAMES[queueId]) return QUEUE_NAMES[queueId]
  return MODE_NAMES[gameMode?.toUpperCase?.()] || gameMode || 'UNKNOWN'
}

export function isRotating(modeName) {
  return !STAPLE_MODES.includes(modeName)
}
