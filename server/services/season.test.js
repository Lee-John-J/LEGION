const test = require('node:test')
const assert = require('node:assert/strict')
const { currentSeasonStart, currentSeasonStartEpoch, currentSeasonYear } = require('./season')

test('mid-season: the window starts on January 10 of the current year', () => {
  const now = new Date(Date.UTC(2026, 7, 21)) // 2026-08-21
  assert.equal(currentSeasonStart(now).toISOString(), '2026-01-10T00:00:00.000Z')
  assert.equal(currentSeasonYear(now), 2026)
})

test('January 1-9: the window falls back to LAST year\'s boundary, never the future', () => {
  const now = new Date(Date.UTC(2027, 0, 5, 12)) // 2027-01-05 12:00Z
  assert.equal(currentSeasonStart(now).toISOString(), '2026-01-10T00:00:00.000Z')
  assert.equal(currentSeasonYear(now), 2026)
  assert.ok(currentSeasonStart(now) <= now, 'season start must never be in the future')
})

test('the boundary instant itself belongs to the new season', () => {
  const now = new Date(Date.UTC(2027, 0, 10))
  assert.equal(currentSeasonStart(now).toISOString(), '2027-01-10T00:00:00.000Z')
  assert.equal(currentSeasonYear(now), 2027)
})

test('epoch form is whole seconds (what Riot\'s match-id endpoint expects)', () => {
  const now = new Date(Date.UTC(2026, 7, 21))
  assert.equal(currentSeasonStartEpoch(now), Date.UTC(2026, 0, 10) / 1000)
  assert.ok(Number.isInteger(currentSeasonStartEpoch(now)))
})
