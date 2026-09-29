// "1 game" / "2 games" — counts in UI copy are dynamic, so singular forms
// must be chosen at render time rather than hardcoded as plurals.
export function plural(n, word, pluralWord = `${word}s`) {
  return `${n} ${n === 1 ? word : pluralWord}`
}
