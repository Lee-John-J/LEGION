/**
 * Champion metadata database.
 * Keys match Riot API `championName` from match-v5 participant data.
 *
 * c = classes, r = primary roles, g = gender (M/F/N), t = trait tags
 */

const CHAMPIONS = {
  Aatrox:      { c: ['Fighter'],          r: ['TOP'],             g: 'M', t: ['edgy', 'drain'] },
  Ahri:        { c: ['Mage', 'Assassin'], r: ['MID'],             g: 'F', t: ['dash'] },
  Akali:       { c: ['Assassin'],         r: ['MID', 'TOP'],      g: 'F', t: ['stealth', 'dash'] },
  Akshan:      { c: ['Marksman'],         r: ['MID', 'TOP'],      g: 'M', t: ['stealth', 'dash'] },
  Alistar:     { c: ['Tank'],             r: ['SUPPORT'],         g: 'M', t: ['cc'] },
  Ambessa:     { c: ['Fighter'],          r: ['TOP'],             g: 'F', t: ['dash'] },
  Amumu:       { c: ['Tank'],             r: ['JUNGLE'],          g: 'M', t: ['cc', 'aoe'] },
  Anivia:      { c: ['Mage'],             r: ['MID'],             g: 'F', t: ['monster'] },
  Annie:       { c: ['Mage'],             r: ['MID', 'SUPPORT'],  g: 'F', t: ['pet', 'aoe'] },
  Aphelios:    { c: ['Marksman'],         r: ['BOT'],             g: 'M', t: ['edgy'] },
  Ashe:        { c: ['Marksman'],         r: ['BOT'],             g: 'F', t: ['global', 'poke'] },
  AurelionSol: { c: ['Mage'],             r: ['MID'],             g: 'M', t: ['monster'] },
  Aurora:      { c: ['Mage'],             r: ['MID', 'TOP'],      g: 'F', t: ['dash'] },
  Azir:        { c: ['Mage'],             r: ['MID'],             g: 'M', t: ['pet'] },
  Bard:        { c: ['Enchanter'],        r: ['SUPPORT'],         g: 'M', t: ['global'] },
  Belveth:     { c: ['Fighter'],          r: ['JUNGLE'],          g: 'F', t: ['void', 'dash', 'monster'] },
  Blitzcrank:  { c: ['Tank'],             r: ['SUPPORT'],         g: 'N', t: ['hook', 'monster'] },
  Brand:       { c: ['Mage'],             r: ['SUPPORT', 'MID'],  g: 'M', t: ['dot', 'aoe'] },
  Braum:       { c: ['Tank'],             r: ['SUPPORT'],         g: 'M', t: ['shield'] },
  Briar:       { c: ['Fighter'],          r: ['JUNGLE'],          g: 'F', t: ['drain', 'dash'] },
  Caitlyn:     { c: ['Marksman'],         r: ['BOT'],             g: 'F', t: ['poke'] },
  Camille:     { c: ['Fighter'],          r: ['TOP'],             g: 'F', t: ['dash'] },
  Cassiopeia:  { c: ['Mage'],             r: ['MID'],             g: 'F', t: ['dot'] },
  Chogath:     { c: ['Tank', 'Mage'],     r: ['TOP'],             g: 'N', t: ['void', 'monster', 'cc'] },
  Corki:       { c: ['Marksman'],         r: ['MID'],             g: 'M', t: ['yordle', 'poke'] },
  Darius:      { c: ['Fighter'],          r: ['TOP'],             g: 'M', t: ['dot'] },
  Diana:       { c: ['Assassin', 'Fighter'], r: ['JUNGLE', 'MID'], g: 'F', t: ['dash', 'aoe'] },
  DrMundo:     { c: ['Fighter', 'Tank'],  r: ['TOP'],             g: 'M', t: ['drain'] },
  Draven:      { c: ['Marksman'],         r: ['BOT'],             g: 'M', t: ['edgy'] },
  Ekko:        { c: ['Assassin'],         r: ['JUNGLE', 'MID'],   g: 'M', t: ['dash'] },
  Elise:       { c: ['Mage', 'Assassin'], r: ['JUNGLE'],          g: 'F', t: ['pet', 'monster'] },
  Evelynn:     { c: ['Assassin'],         r: ['JUNGLE'],          g: 'F', t: ['stealth'] },
  Ezreal:      { c: ['Marksman'],         r: ['BOT'],             g: 'M', t: ['poke', 'dash', 'global'] },
  Fiddlesticks:{ c: ['Mage'],             r: ['JUNGLE'],          g: 'N', t: ['monster', 'aoe', 'dot'] },
  Fiora:       { c: ['Fighter'],          r: ['TOP'],             g: 'F', t: ['dash'] },
  Fizz:        { c: ['Assassin'],         r: ['MID'],             g: 'M', t: ['dash'] },
  Galio:       { c: ['Tank', 'Mage'],     r: ['MID', 'SUPPORT'],  g: 'M', t: ['cc', 'global'] },
  Gangplank:   { c: ['Fighter'],          r: ['TOP'],             g: 'M', t: ['global', 'dot'] },
  Garen:       { c: ['Fighter', 'Tank'],  r: ['TOP'],             g: 'M', t: [] },
  Gnar:        { c: ['Fighter', 'Tank'],  r: ['TOP'],             g: 'M', t: ['yordle', 'cc'] },
  Gragas:      { c: ['Fighter', 'Mage'],  r: ['TOP', 'JUNGLE'],   g: 'M', t: ['cc'] },
  Graves:      { c: ['Marksman'],         r: ['JUNGLE'],          g: 'M', t: ['dash'] },
  Gwen:        { c: ['Fighter'],          r: ['TOP'],             g: 'F', t: ['dash'] },
  Hecarim:     { c: ['Fighter'],          r: ['JUNGLE'],          g: 'M', t: ['dash', 'monster'] },
  Heimerdinger:{ c: ['Mage'],             r: ['MID', 'TOP'],      g: 'M', t: ['yordle', 'pet', 'poke'] },
  Hwei:        { c: ['Mage'],             r: ['MID', 'SUPPORT'],  g: 'M', t: ['poke', 'aoe'] },
  Illaoi:      { c: ['Fighter'],          r: ['TOP'],             g: 'F', t: [] },
  Irelia:      { c: ['Fighter'],          r: ['TOP', 'MID'],      g: 'F', t: ['dash'] },
  Ivern:       { c: ['Enchanter'],        r: ['JUNGLE'],          g: 'M', t: ['pet', 'shield'] },
  Janna:       { c: ['Enchanter'],        r: ['SUPPORT'],         g: 'F', t: ['shield', 'heal'] },
  JarvanIV:    { c: ['Fighter', 'Tank'],  r: ['JUNGLE', 'TOP'],   g: 'M', t: ['cc', 'dash'] },
  Jax:         { c: ['Fighter'],          r: ['TOP', 'JUNGLE'],   g: 'M', t: ['dash'] },
  Jayce:       { c: ['Fighter', 'Marksman'],r: ['TOP', 'MID'],    g: 'M', t: ['poke'] },
  Jhin:        { c: ['Marksman'],         r: ['BOT'],             g: 'M', t: ['poke'] },
  Jinx:        { c: ['Marksman'],         r: ['BOT'],             g: 'F', t: ['global', 'aoe'] },
  Kaisa:       { c: ['Marksman'],         r: ['BOT'],             g: 'F', t: ['void', 'dash'] },
  Kalista:     { c: ['Marksman'],         r: ['BOT'],             g: 'F', t: ['dash', 'edgy'] },
  Karma:       { c: ['Mage', 'Enchanter'],r: ['SUPPORT', 'MID'],  g: 'F', t: ['shield', 'poke'] },
  Karthus:     { c: ['Mage'],             r: ['JUNGLE', 'MID'],   g: 'M', t: ['global', 'aoe', 'dot', 'edgy'] },
  Kassadin:    { c: ['Assassin', 'Mage'], r: ['MID'],             g: 'M', t: ['void', 'dash'] },
  Katarina:    { c: ['Assassin'],         r: ['MID'],             g: 'F', t: ['dash', 'aoe'] },
  Kayle:       { c: ['Fighter', 'Mage'],  r: ['TOP'],             g: 'F', t: [] },
  Kayn:        { c: ['Assassin', 'Fighter'],r: ['JUNGLE'],         g: 'M', t: ['edgy', 'dash'] },
  Kennen:      { c: ['Mage'],             r: ['TOP'],             g: 'M', t: ['yordle', 'aoe', 'cc'] },
  Khazix:      { c: ['Assassin'],         r: ['JUNGLE'],          g: 'M', t: ['void', 'stealth', 'dash'] },
  Kindred:     { c: ['Marksman'],         r: ['JUNGLE'],          g: 'N', t: ['dash', 'monster'] },
  Kled:        { c: ['Fighter'],          r: ['TOP'],             g: 'M', t: ['yordle', 'dash'] },
  KogMaw:      { c: ['Marksman', 'Mage'], r: ['BOT'],             g: 'M', t: ['void', 'poke', 'monster'] },
  KSante:      { c: ['Fighter', 'Tank'],  r: ['TOP'],             g: 'M', t: ['dash', 'cc'] },
  LeBlanc:     { c: ['Assassin', 'Mage'], r: ['MID'],             g: 'F', t: ['dash'] },
  LeeSin:      { c: ['Fighter'],          r: ['JUNGLE'],          g: 'M', t: ['dash'] },
  Leona:       { c: ['Tank'],             r: ['SUPPORT'],         g: 'F', t: ['cc'] },
  Lillia:      { c: ['Fighter', 'Mage'],  r: ['JUNGLE', 'TOP'],   g: 'F', t: ['dot', 'aoe'] },
  Lissandra:   { c: ['Mage'],             r: ['MID'],             g: 'F', t: ['cc', 'aoe'] },
  Lucian:      { c: ['Marksman'],         r: ['BOT', 'MID'],      g: 'M', t: ['dash'] },
  Lulu:        { c: ['Enchanter'],        r: ['SUPPORT'],         g: 'F', t: ['yordle', 'shield', 'heal'] },
  Lux:         { c: ['Mage', 'Enchanter'],r: ['SUPPORT', 'MID'],  g: 'F', t: ['poke', 'shield'] },
  Malphite:    { c: ['Tank'],             r: ['TOP'],             g: 'M', t: ['aoe', 'cc', 'monster'] },
  Malzahar:    { c: ['Mage'],             r: ['MID'],             g: 'M', t: ['void', 'dot', 'pet'] },
  Maokai:      { c: ['Tank'],             r: ['SUPPORT', 'JUNGLE'],g: 'M', t: ['cc', 'monster'] },
  MasterYi:    { c: ['Assassin', 'Fighter'],r: ['JUNGLE'],         g: 'M', t: ['dash'] },
  Mel:         { c: ['Mage'],             r: ['MID'],             g: 'F', t: ['poke'] },
  Milio:       { c: ['Enchanter'],        r: ['SUPPORT'],         g: 'M', t: ['heal', 'shield'] },
  MissFortune: { c: ['Marksman'],         r: ['BOT'],             g: 'F', t: ['aoe', 'poke'] },
  MonkeyKing:  { c: ['Fighter'],          r: ['TOP', 'JUNGLE'],   g: 'M', t: ['stealth', 'dash'] },
  Mordekaiser: { c: ['Fighter'],          r: ['TOP'],             g: 'M', t: ['edgy', 'monster'] },
  Morgana:     { c: ['Mage', 'Enchanter'],r: ['SUPPORT', 'MID'],  g: 'F', t: ['cc', 'shield'] },
  Naafiri:     { c: ['Assassin'],         r: ['MID', 'JUNGLE'],   g: 'F', t: ['dash', 'pet'] },
  Nami:        { c: ['Enchanter'],        r: ['SUPPORT'],         g: 'F', t: ['heal', 'cc'] },
  Nasus:       { c: ['Fighter', 'Tank'],  r: ['TOP'],             g: 'M', t: ['monster'] },
  Nautilus:    { c: ['Tank'],             r: ['SUPPORT'],         g: 'M', t: ['hook', 'cc'] },
  Neeko:       { c: ['Mage'],             r: ['MID', 'SUPPORT'],  g: 'F', t: ['cc', 'aoe', 'stealth'] },
  Nidalee:     { c: ['Assassin'],         r: ['JUNGLE'],          g: 'F', t: ['poke'] },
  Nilah:       { c: ['Fighter', 'Marksman'],r: ['BOT'],            g: 'F', t: ['dash'] },
  Nocturne:    { c: ['Assassin'],         r: ['JUNGLE'],          g: 'M', t: ['edgy', 'dash', 'global'] },
  Nunu:        { c: ['Tank'],             r: ['JUNGLE'],          g: 'M', t: ['cc', 'monster'] },
  Olaf:        { c: ['Fighter'],          r: ['TOP', 'JUNGLE'],   g: 'M', t: ['drain'] },
  Orianna:     { c: ['Mage'],             r: ['MID'],             g: 'F', t: ['aoe', 'shield', 'pet'] },
  Ornn:        { c: ['Tank'],             r: ['TOP'],             g: 'M', t: ['cc', 'monster'] },
  Pantheon:    { c: ['Fighter'],          r: ['TOP', 'MID', 'SUPPORT'], g: 'M', t: ['global', 'dash'] },
  Poppy:       { c: ['Tank'],             r: ['SUPPORT', 'TOP', 'JUNGLE'], g: 'F', t: ['yordle', 'cc'] },
  Pyke:        { c: ['Assassin'],         r: ['SUPPORT'],         g: 'M', t: ['hook', 'stealth', 'edgy', 'dash'] },
  Qiyana:      { c: ['Assassin'],         r: ['MID'],             g: 'F', t: ['dash', 'stealth'] },
  Quinn:       { c: ['Marksman'],         r: ['TOP'],             g: 'F', t: ['global'] },
  Rakan:       { c: ['Enchanter'],        r: ['SUPPORT'],         g: 'M', t: ['dash', 'cc'] },
  Rammus:      { c: ['Tank'],             r: ['JUNGLE'],          g: 'M', t: ['cc', 'monster'] },
  RekSai:      { c: ['Fighter'],          r: ['JUNGLE'],          g: 'F', t: ['void', 'monster', 'dash'] },
  Rell:        { c: ['Tank'],             r: ['SUPPORT'],         g: 'F', t: ['cc'] },
  Renata:      { c: ['Enchanter'],        r: ['SUPPORT'],         g: 'F', t: ['shield'] },
  Renekton:    { c: ['Fighter'],          r: ['TOP'],             g: 'M', t: ['dash', 'monster'] },
  Rengar:      { c: ['Assassin', 'Fighter'],r: ['JUNGLE', 'TOP'],  g: 'M', t: ['stealth', 'dash', 'monster'] },
  Riven:       { c: ['Fighter'],          r: ['TOP'],             g: 'F', t: ['dash'] },
  Rumble:      { c: ['Fighter', 'Mage'],  r: ['TOP'],             g: 'M', t: ['yordle', 'dot', 'aoe'] },
  Ryze:        { c: ['Mage'],             r: ['MID'],             g: 'M', t: [] },
  Samira:      { c: ['Marksman'],         r: ['BOT'],             g: 'F', t: ['dash', 'aoe'] },
  Sejuani:     { c: ['Tank'],             r: ['JUNGLE'],          g: 'F', t: ['cc'] },
  Senna:       { c: ['Marksman', 'Enchanter'],r: ['SUPPORT', 'BOT'], g: 'F', t: ['stealth', 'global', 'heal'] },
  Seraphine:   { c: ['Mage', 'Enchanter'],r: ['SUPPORT', 'MID'],  g: 'F', t: ['heal', 'shield', 'aoe'] },
  Sett:        { c: ['Fighter', 'Tank'],  r: ['TOP'],             g: 'M', t: ['cc'] },
  Shaco:       { c: ['Assassin'],         r: ['JUNGLE'],          g: 'M', t: ['stealth', 'pet'] },
  Shen:        { c: ['Tank'],             r: ['TOP'],             g: 'M', t: ['global', 'shield'] },
  Shyvana:     { c: ['Fighter'],          r: ['JUNGLE'],          g: 'F', t: ['monster', 'dash'] },
  Singed:      { c: ['Tank', 'Mage'],     r: ['TOP'],             g: 'M', t: ['dot'] },
  Sion:        { c: ['Tank'],             r: ['TOP'],             g: 'M', t: ['cc', 'edgy'] },
  Sivir:       { c: ['Marksman'],         r: ['BOT'],             g: 'F', t: ['poke'] },
  Skarner:     { c: ['Tank', 'Fighter'],  r: ['JUNGLE'],          g: 'M', t: ['cc', 'monster'] },
  Smolder:     { c: ['Marksman'],         r: ['BOT', 'MID'],      g: 'M', t: ['poke', 'monster'] },
  Sona:        { c: ['Enchanter'],        r: ['SUPPORT'],         g: 'F', t: ['heal', 'shield', 'aoe'] },
  Soraka:      { c: ['Enchanter'],        r: ['SUPPORT'],         g: 'F', t: ['heal', 'global'] },
  Swain:       { c: ['Mage', 'Fighter'],  r: ['SUPPORT', 'MID'],  g: 'M', t: ['drain', 'dot', 'cc'] },
  Sylas:       { c: ['Mage', 'Assassin'], r: ['MID'],             g: 'M', t: ['dash', 'drain'] },
  Syndra:      { c: ['Mage'],             r: ['MID'],             g: 'F', t: ['cc'] },
  TahmKench:   { c: ['Tank'],             r: ['TOP', 'SUPPORT'],  g: 'M', t: ['cc', 'monster'] },
  Taliyah:     { c: ['Mage'],             r: ['MID', 'JUNGLE'],   g: 'F', t: ['aoe', 'cc'] },
  Talon:       { c: ['Assassin'],         r: ['MID', 'JUNGLE'],   g: 'M', t: ['stealth', 'dash', 'edgy'] },
  Taric:       { c: ['Enchanter', 'Tank'],r: ['SUPPORT'],         g: 'M', t: ['heal', 'shield'] },
  Teemo:       { c: ['Marksman', 'Mage'], r: ['TOP'],             g: 'M', t: ['yordle', 'stealth', 'dot'] },
  Thresh:      { c: ['Tank'],             r: ['SUPPORT'],         g: 'M', t: ['hook', 'cc', 'edgy'] },
  Tristana:    { c: ['Marksman'],         r: ['BOT', 'MID'],      g: 'F', t: ['yordle', 'dash'] },
  Trundle:     { c: ['Fighter'],          r: ['JUNGLE', 'TOP'],   g: 'M', t: ['drain'] },
  Tryndamere:  { c: ['Fighter'],          r: ['TOP'],             g: 'M', t: ['dash'] },
  TwistedFate: { c: ['Mage'],             r: ['MID'],             g: 'M', t: ['global', 'cc'] },
  Twitch:      { c: ['Marksman'],         r: ['BOT'],             g: 'M', t: ['stealth', 'dot', 'monster'] },
  Udyr:        { c: ['Fighter', 'Tank'],  r: ['JUNGLE'],          g: 'M', t: ['cc'] },
  Urgot:       { c: ['Fighter'],          r: ['TOP'],             g: 'M', t: ['monster'] },
  Varus:       { c: ['Marksman'],         r: ['BOT'],             g: 'M', t: ['poke'] },
  Vayne:       { c: ['Marksman'],         r: ['BOT', 'TOP'],      g: 'F', t: ['stealth', 'dash'] },
  Veigar:      { c: ['Mage'],             r: ['MID'],             g: 'M', t: ['yordle', 'cc'] },
  Velkoz:      { c: ['Mage'],             r: ['SUPPORT', 'MID'],  g: 'N', t: ['void', 'poke', 'monster'] },
  Vex:         { c: ['Mage'],             r: ['MID'],             g: 'F', t: ['yordle', 'aoe', 'dash'] },
  Vi:          { c: ['Fighter'],          r: ['JUNGLE'],          g: 'F', t: ['dash', 'cc'] },
  Viego:       { c: ['Assassin', 'Fighter'],r: ['JUNGLE'],         g: 'M', t: ['stealth', 'edgy', 'dash'] },
  Viktor:      { c: ['Mage'],             r: ['MID'],             g: 'M', t: ['poke', 'aoe'] },
  Vladimir:    { c: ['Mage'],             r: ['MID', 'TOP'],      g: 'M', t: ['drain', 'aoe'] },
  Volibear:    { c: ['Fighter', 'Tank'],  r: ['TOP', 'JUNGLE'],   g: 'M', t: ['cc', 'monster'] },
  Warwick:     { c: ['Fighter'],          r: ['JUNGLE', 'TOP'],   g: 'M', t: ['drain', 'cc', 'monster'] },
  Xayah:       { c: ['Marksman'],         r: ['BOT'],             g: 'F', t: [] },
  Xerath:      { c: ['Mage'],             r: ['MID', 'SUPPORT'],  g: 'M', t: ['poke'] },
  XinZhao:     { c: ['Fighter'],          r: ['JUNGLE'],          g: 'M', t: ['dash', 'cc'] },
  Yasuo:       { c: ['Fighter'],          r: ['MID', 'TOP', 'BOT'],g: 'M', t: ['dash', 'edgy'] },
  Yone:        { c: ['Assassin', 'Fighter'],r: ['MID', 'TOP'],     g: 'M', t: ['dash', 'edgy'] },
  Yorick:      { c: ['Fighter'],          r: ['TOP'],             g: 'M', t: ['pet'] },
  Yuumi:       { c: ['Enchanter'],        r: ['SUPPORT'],         g: 'F', t: ['heal', 'shield', 'monster'] },
  Zac:         { c: ['Tank'],             r: ['JUNGLE'],          g: 'M', t: ['cc', 'monster', 'dash'] },
  Zed:         { c: ['Assassin'],         r: ['MID'],             g: 'M', t: ['edgy', 'stealth', 'dash'] },
  Zeri:        { c: ['Marksman'],         r: ['BOT'],             g: 'F', t: ['dash'] },
  Ziggs:       { c: ['Mage'],             r: ['MID', 'BOT'],      g: 'M', t: ['yordle', 'poke', 'aoe'] },
  Zilean:      { c: ['Mage', 'Enchanter'],r: ['SUPPORT', 'MID'],  g: 'M', t: ['cc'] },
  Zoe:         { c: ['Mage'],             r: ['MID'],             g: 'F', t: ['poke'] },
  Zyra:        { c: ['Mage'],             r: ['SUPPORT'],         g: 'F', t: ['pet', 'dot', 'cc'] },
}

// Trait -> intelligence-dossier label + minimum threshold (fraction of games)
const TRAIT_TAGS = {
  stealth:  { label: 'SHADOW OPERATIVE',         threshold: 0.40 },
  dot:      { label: 'CHEMICAL WARFARE DIVISION', threshold: 0.40 },
  hook:     { label: 'EXTRACTION UNIT',           threshold: 0.40 },
  global:   { label: 'ORBITAL STRIKE CLEARANCE',  threshold: 0.35 },
  yordle:   { label: 'YORDLE SYMPATHIZER',        threshold: 0.40 },
  void:     { label: 'VOID CLEARANCE: GRANTED',   threshold: 0.35 },
  edgy:     { label: 'EDGE DIVISION',             threshold: 0.40 },
  monster:  { label: 'CREATURE UNIT',             threshold: 0.40 },
  dash:     { label: 'HIGH MOBILITY ASSET',       threshold: 0.55 },
  poke:     { label: 'ARTILLERY BATTERY',         threshold: 0.40 },
  heal:     { label: 'MEDICAL DIVISION',          threshold: 0.40 },
  shield:   { label: 'PROTECTIVE DETAIL',         threshold: 0.40 },
  cc:       { label: 'CROWD SUPPRESSION UNIT',    threshold: 0.50 },
  aoe:      { label: 'AREA DENIAL SPECIALIST',    threshold: 0.40 },
  pet:      { label: 'HANDLER — AUXILIARY ASSETS', threshold: 0.35 },
  drain:    { label: 'ATTRITION WARFARE DIVISION', threshold: 0.40 },
}

// Gender pattern labels
const GENDER_TAGS = {
  all_male:   'ALL-MALE ROSTER',
  all_female: 'ALL-FEMALE ROSTER',
}

// Class -> label for class-dominant profiles
const CLASS_LABELS = {
  Fighter:   'FRONTLINE DOCTRINE',
  Tank:      'FORTIFICATION DOCTRINE',
  Mage:      'ARCANE DOCTRINE',
  Assassin:  'ELIMINATION PROTOCOL',
  Marksman:  'PRECISION DOCTRINE',
  Enchanter: 'SUPPORT CORPS',
}

// Role -> label for role-dominant profiles
const ROLE_LABELS = {
  TOP:     'TOP',
  JUNGLE:  'JUNGLE',
  MIDDLE:  'MID',
  BOTTOM:  'BOT',
  UTILITY: 'SUPPORT',
}

function getChampionData(name) {
  return CHAMPIONS[name] || null
}

/**
 * Compute profile analysis from champion play data.
 *
 * @param {Map} champions - Map of championName -> { games, wins }
 * @param {Object} roleCounts - { TOP: n, JUNGLE: n, MIDDLE: n, BOTTOM: n, UTILITY: n }
 * @param {number} totalGames - total games in this scope
 * @returns {{ role_distribution, class_distribution, profile_tags, primary_role, primary_class }}
 */
function analyzeProfile(champions, roleCounts, totalGames) {
  if (totalGames < 3) {
    return {
      role_distribution: roleCounts,
      class_distribution: {},
      profile_tags: [],
      primary_role: null,
      primary_class: null,
    }
  }

  // Accumulate class, gender, and trait counts weighted by games played
  const classCounts = {}
  const genderCounts = { M: 0, F: 0, N: 0 }
  const traitCounts = {}
  let knownGames = 0

  for (const [champName, { games }] of champions) {
    const data = getChampionData(champName)
    if (!data) continue
    knownGames += games

    for (const cls of data.c) {
      classCounts[cls] = (classCounts[cls] || 0) + games
    }
    genderCounts[data.g] = (genderCounts[data.g] || 0) + games
    for (const tag of data.t) {
      traitCounts[tag] = (traitCounts[tag] || 0) + games
    }
  }

  // Primary role (from teamPosition data)
  const roleEntries = Object.entries(roleCounts).filter(([, n]) => n > 0)
  const primaryRole = roleEntries.length > 0
    ? roleEntries.sort((a, b) => b[1] - a[1])[0][0]
    : null

  // Primary class
  const classEntries = Object.entries(classCounts).filter(([, n]) => n > 0)
  const primaryClass = classEntries.length > 0
    ? classEntries.sort((a, b) => b[1] - a[1])[0][0]
    : null

  // Build profile tags (ordered by strength)
  const tags = []
  const base = knownGames || totalGames

  // Role-based tag (SR only — roleCounts will be empty for non-SR theaters)
  const roleTotal = Object.values(roleCounts).reduce((a, b) => a + b, 0)
  if (roleTotal >= 3 && primaryRole) {
    const primaryRolePct = roleCounts[primaryRole] / roleTotal
    if (primaryRolePct >= 0.65) {
      tags.push({
        label: `${ROLE_LABELS[primaryRole] || primaryRole} SPECIALIST`,
        category: 'role',
        strength: primaryRolePct,
      })
    } else {
      const sorted = roleEntries.sort((a, b) => b[1] - a[1])
      if (sorted.length >= 2 && sorted[1][1] / roleTotal >= 0.25) {
        tags.push({
          label: `${ROLE_LABELS[sorted[0][0]] || sorted[0][0]} / ${ROLE_LABELS[sorted[1][0]] || sorted[1][0]} FLEX`,
          category: 'role',
          strength: (sorted[0][1] + sorted[1][1]) / roleTotal,
        })
      } else if (sorted.length >= 3 && sorted[2][1] / roleTotal >= 0.15) {
        tags.push({ label: 'FILL AGENT', category: 'role', strength: 0.5 })
      }
    }
  }

  // Class-based tag
  if (base >= 3 && primaryClass) {
    const primaryClassPct = classCounts[primaryClass] / base
    if (primaryClassPct >= 0.55 && CLASS_LABELS[primaryClass]) {
      tags.push({
        label: CLASS_LABELS[primaryClass],
        category: 'class',
        strength: primaryClassPct,
      })
    }
  }

  // Gender pattern tag (only when very dominant and enough games)
  if (base >= 5) {
    if (genderCounts.M === base) {
      tags.push({ label: GENDER_TAGS.all_male, category: 'gender', strength: 1.0 })
    } else if (genderCounts.F === base) {
      tags.push({ label: GENDER_TAGS.all_female, category: 'gender', strength: 1.0 })
    }
  }

  // Trait-based tags (fun/meme)
  for (const [trait, { label, threshold }] of Object.entries(TRAIT_TAGS)) {
    const count = traitCounts[trait] || 0
    const pct = base > 0 ? count / base : 0
    if (pct >= threshold && count >= 2) {
      tags.push({ label, category: 'trait', strength: pct })
    }
  }

  // Sort by strength descending, keep top 3
  tags.sort((a, b) => b.strength - a.strength)

  return {
    role_distribution: roleCounts,
    class_distribution: classCounts,
    profile_tags: tags.slice(0, 3),
    primary_role: primaryRole,
    primary_class: primaryClass,
  }
}

module.exports = { CHAMPIONS, TRAIT_TAGS, CLASS_LABELS, ROLE_LABELS, getChampionData, analyzeProfile }
