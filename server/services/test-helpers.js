/**
 * Builders shared by the stats-engine test files. They produce the minimal
 * slice of a Riot match-v5 payload that the engine reads.
 */

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

module.exports = { participant, match }
