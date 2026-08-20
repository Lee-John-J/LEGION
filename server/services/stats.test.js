/**
 * Tests for the stats engine — the code most likely to break silently.
 * Run with: npm test (node --test, no dependencies).
 *
 * Focus areas from the 2026-08-19 audit:
 *  - Arena (CHERRY) subteam grouping: same teamId must NOT imply same team
 *  - Remake filtering: early-surrender/short games are voided
 *  - Zero-game roster padding: win_rate must be null, never 0
 */
const test = require('node:test')
const assert = require('node:assert/strict')

const { computeCellStats, isRemake, getSameTeamCellGroup } = require('./stats')

// ── Builders ─────────────────────────────────────────────────────

function participant(puuid, overrides = {}) {
  return {
    puuid,
    teamId: 100,
    playerSubteamId: 0,
    win: true,
    championName: 'Ashe',
    riotIdGameName: puuid,
    kills: 1, deaths: 1, assists: 1,
    gameEndedInEarlySurrender: false,
    ...overrides,
  }
}

function match({ participants, gameDuration = 1800, gameMode = 'CLASSIC', queueId = 420, endTs = 1_755_000_000_000 }) {
  return {
    info: {
      participants,
      gameDuration,
      gameMode,
      queueId,
      gameEndTimestamp: endTs,
      gameStartTimestamp: endTs - gameDuration * 1000,
    },
  }
}

// ── getSameTeamCellGroup ─────────────────────────────────────────

test('normal mode: two cell members on the same team form a joint group', () => {
  const parts = [
    participant('a', { teamId: 100 }),
    participant('b', { teamId: 100 }),
    participant('x', { teamId: 200 }),
  ]
  const group = getSameTeamCellGroup(parts, new Set(['a', 'b']))
  assert.equal(group?.length, 2)
})

test('normal mode: cell members on opposite teams are NOT a joint group', () => {
  const parts = [
    participant('a', { teamId: 100 }),
    participant('b', { teamId: 200 }),
  ]
  assert.equal(getSameTeamCellGroup(parts, new Set(['a', 'b'])), null)
})

test('arena: same teamId but different subteams are OPPONENTS, not a joint group', () => {
  // The exact bug from the audit: Riot stamps only two teamIds in Arena,
  // so subteam 1 and subteam 2 share teamId 100 while fighting each other.
  const parts = [
    participant('a', { teamId: 100, playerSubteamId: 1, win: true }),
    participant('b', { teamId: 100, playerSubteamId: 2, win: false }),
  ]
  assert.equal(getSameTeamCellGroup(parts, new Set(['a', 'b'])), null)
})

test('arena: same subteam IS a joint group', () => {
  const parts = [
    participant('a', { teamId: 100, playerSubteamId: 3 }),
    participant('b', { teamId: 100, playerSubteamId: 3 }),
    participant('x', { teamId: 100, playerSubteamId: 4 }),
  ]
  const group = getSameTeamCellGroup(parts, new Set(['a', 'b', 'x']))
  assert.equal(group?.length, 2)
  assert.deepEqual(group.map((p) => p.puuid).sort(), ['a', 'b'])
})

// ── isRemake ─────────────────────────────────────────────────────

test('remakes are detected by the early-surrender flag', () => {
  const m = match({
    participants: [participant('a', { gameEndedInEarlySurrender: true })],
    gameDuration: 190,
  })
  assert.equal(isRemake(m), true)
})

test('remakes are detected by sub-5-minute duration', () => {
  const m = match({ participants: [participant('a')], gameDuration: 240 })
  assert.equal(isRemake(m), true)
})

test('a normal-length game is not a remake', () => {
  const m = match({ participants: [participant('a')], gameDuration: 1900 })
  assert.equal(isRemake(m), false)
})

// ── computeCellStats ─────────────────────────────────────────────

test('remakes are excluded from every stat', () => {
  const win = match({
    participants: [participant('a', { win: true }), participant('b', { win: true })],
  })
  const remakeLoss = match({
    participants: [
      participant('a', { win: false, gameEndedInEarlySurrender: true }),
      participant('b', { win: false, gameEndedInEarlySurrender: true }),
    ],
    gameDuration: 180,
  })
  const stats = computeCellStats([win, remakeLoss], ['a', 'b'])
  assert.equal(stats.games_together, 1)
  assert.equal(stats.win_rate_together, 1)
  assert.equal(stats.timeline.length, 1)
})

test('arena game with cell members on opposing subteams is not a joint deployment', () => {
  const arenaOpponents = match({
    participants: [
      participant('a', { teamId: 100, playerSubteamId: 1, win: true }),
      participant('b', { teamId: 100, playerSubteamId: 2, win: false }),
    ],
    gameMode: 'CHERRY',
    queueId: 1700,
  })
  const stats = computeCellStats([arenaOpponents], ['a', 'b'])
  assert.equal(stats.games_together, 0)
  assert.equal(stats.win_rate_together, null)
})

test('rostered member with zero joint games gets null win_rate, not 0', () => {
  const m = match({
    participants: [participant('a'), participant('b')],
  })
  const roster = [
    { id: 'u-a', puuid: 'a', riot_game_name: 'a' },
    { id: 'u-b', puuid: 'b', riot_game_name: 'b' },
    { id: 'u-c', puuid: 'c', riot_game_name: 'c' }, // never played
  ]
  const stats = computeCellStats([m], ['a', 'b', 'c'], roster)
  const c = stats.operator_stats.find((o) => o.puuid === 'c')
  assert.equal(c.games, 0)
  assert.equal(c.win_rate, null)
})

test('operator_stats carries user_id resolved from the roster', () => {
  const m = match({
    participants: [participant('a'), participant('b')],
  })
  const roster = [
    { id: 'u-a', puuid: 'a', riot_game_name: 'a' },
    { id: 'u-b', puuid: 'b', riot_game_name: 'b' },
  ]
  const stats = computeCellStats([m], ['a', 'b'], roster)
  const a = stats.operator_stats.find((o) => o.puuid === 'a')
  assert.equal(a.user_id, 'u-a')
})

test('empty dataset degrades to nulls, not NaN or crashes', () => {
  const stats = computeCellStats([], ['a', 'b'], [])
  assert.equal(stats.games_together, 0)
  assert.equal(stats.win_rate_together, null)
  assert.equal(stats.win_rate_apart, null)
  assert.deepEqual(stats.timeline, [])
})
