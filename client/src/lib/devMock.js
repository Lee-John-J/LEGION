/**
 * Dev-only preview switch.
 *
 * In `vite dev` with no real session, useAuth signs in a fake operator on a
 * fully populated mock cell so every page can be inspected without an
 * account. Everything that touches the mock dataset is gated on DEV_MOCK,
 * which Vite replaces with a literal `false` in production builds — so
 * mockData.js (and the fixtures it generates at import time) is tree-shaken
 * out of the bundle that ships. Call sites load it with a dynamic
 * `import('./mockData')` inside that gate; never import it statically.
 */
export const DEV_MOCK = import.meta.env.DEV

export const MOCK_CELL_ID = 'mock-night-shift'

export function isMockCell(cellId) {
  return DEV_MOCK && cellId === MOCK_CELL_ID
}
