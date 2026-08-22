/**
 * Season boundary helpers (pure — no DB, no Riot).
 *
 * Riot's ranked season resets in mid-January; LEGION scopes every stat and
 * every ingest to the most recent boundary. "Most recent" is the important
 * word: during Jan 1–9 the current year's boundary is still in the future,
 * so the window has to fall back to last year's — otherwise every cell
 * reads as empty for nine days each January.
 */

const SEASON_START_MONTH = 0 // January (0-indexed)
const SEASON_START_DAY = 10

function currentSeasonStart(now = new Date()) {
  const year = now.getUTCFullYear()
  const thisYear = new Date(Date.UTC(year, SEASON_START_MONTH, SEASON_START_DAY))
  if (now >= thisYear) return thisYear
  return new Date(Date.UTC(year - 1, SEASON_START_MONTH, SEASON_START_DAY))
}

// Riot's match-id endpoint takes epoch SECONDS
function currentSeasonStartEpoch(now = new Date()) {
  return Math.floor(currentSeasonStart(now).getTime() / 1000)
}

// A season is named for the year it starts in
function currentSeasonYear(now = new Date()) {
  return currentSeasonStart(now).getUTCFullYear()
}

module.exports = { currentSeasonStart, currentSeasonStartEpoch, currentSeasonYear }
