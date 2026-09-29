import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import { Redacted as R } from '../components/Redacted'

// Setup, in the order a new cell actually goes through it. Plain enough to
// follow without the glossary; the dossier voice lives in the headings.
const PROCEDURE = [
  ['Open an operator file', <>
    On the Authenticate page, choose New Operator and enter your email, a
    passcode, and your Riot ID (game name and tagline). LEGION reads Americas
    servers only (NA, BR, LAN, LAS). Confirm the link sent to your email, then
    sign in.
  </>],
  ['Designate the cell', <>
    On the intake page, name your cell to create it. You become its handler,
    and the cell is issued an invite code. Joining someone else&rsquo;s cell
    instead? Enter their invite code on the same page.
  </>],
  ['Distribute the invite code', <>
    Share the invite code shown on your briefing with the rest of your group.
    Each of them opens their own operator file, then enters the code on the
    intake page. A cell holds up to 10 operators.
  </>],
  ['Deploy together', <>
    Queue with at least one other operator from your cell on the same team.
    Only these joint deployments are filed; solo matches are out of scope.
  </>],
  ['Sync intel', <>
    After you play, press Sync Intel on the briefing to pull the cell&rsquo;s
    latest matches from Riot Games. LEGION does not sync on its own; the
    briefing and operation log update with each sync.
  </>],
]

// Every term the interface uses without explaining it. ZOO stays redacted
// per the lore rules, and the last row is decorative.
const GLOSSARY = [
  ['CELL', 'Your group on LEGION: up to 10 operators who play together.'],
  ['OPERATOR', 'A player on file with a cell, identified by Riot ID.'],
  ['HANDLER', 'The operator who created the cell. Can remove operators or dissolve the cell.'],
  ['INVITE CODE', <>The cell&rsquo;s LGN-XXXX-XXXX code, shown on the briefing. Anyone who has it can join, so share it only with your group.</>],
  ['OPEN NEW FILE', 'Create a new cell, or join an existing one with its invite code.'],
  ['AUTHENTICATE', 'Sign in. New operators open their file from the same page.'],
  ['DISENGAGE', 'Sign out.'],
  ['SYNC INTEL', 'The briefing button that pulls your latest matches from Riot Games. Run it after you play.'],
  ['BRIEFING', <>The cell&rsquo;s dashboard: every statistic LEGION tracks, refreshed with each sync.</>],
  ['OPERATION LOG', <>The cell&rsquo;s joint deployment history, filterable by theater, outcome, and operator.</>],
  ['JOINT DEPLOYMENT', 'A match in which two or more cell operators were on the same team. Counted as OPS on the briefing.'],
  ['THEATER', <>Where a match was played. Game modes roll up into three maps: Summoner&rsquo;s Rift, Howling Abyss (ARAM), and Rings of Wrath (Arena).</>],
  ['CAMPAIGN RECORD', 'Season trend of the rolling 20-game joint win rate, plotted one step per deployment.'],
  ['FIELD ASSESSMENT', 'Automated analyst notes on the cell\u2019s synergies, weak spots, and habits. Cards marked CLASSIFIED are decorative.'],
  ['ZOO', <><R w={62} h={13} />. Parent agency. <R w={118} h={13} />.</>],
  [<R w={88} h={13} />, <>
    <R w={62} h={13} /> <R w={142} h={13} />.{' '}
    <R w={74} h={13} /> following <R w={54} h={13} /> protocol.
  </>],
]

export default function About() {
  return (
    <>
      <section className="about-hero intel-reveal">
        <div className="doc-stamp">
          <div className="stamp-block">
            DOCUMENT<br />
            <strong>LGN-ABOUT-001</strong>
          </div>
          <div className="stamp-block accent">
            STATUS<br />
            <strong>PUBLIC RELEASE</strong>
          </div>
          <div className="stamp-block">
            INITIATIVE<br />
            <strong>LEGION</strong>
          </div>
        </div>
        <div className="hero-body">
          <div className="eyebrow eyebrow-green">
            <span className="live-dot"></span> ORIENTATION &middot; DECLASSIFIED
            FOR PUBLIC RELEASE &middot; AUTHORITY <R w={34} h={9} />
          </div>
          <h1 className="title-hero">About LEGION</h1>
          <p className="lead">
            LEGION is a stats tracker for groups of League of Legends players.
            Instead of how you do on your own, LEGION shows how your friend
            group does when you queue up <em>together</em>: your combined win
            rate, which pairs of you win the most, your most active hours, and
            how your record trends across the season. Create a group, link your
            Riot accounts, and LEGION pulls your shared matches from the
            official Riot Games API.
          </p>
          <p className="lead">
            LEGION operates under ZOO directive <R w={54} h={13} />. Files are
            maintained on cells of two or more cooperating operators conducting
            joint deployments. Engagements are logged, indexed, and assessed
            against <R w={78} h={13} /> baselines.
          </p>
          <p className="lead">
            Solo activity falls outside operational scope; that signal is
            well-served by adjacent agencies. Subjects volunteering cell
            membership for surveillance are processed through standard intake.
            Petitioning instructions follow.
          </p>
        </div>
      </section>

      <section className="section intel-reveal reveal-d1" id="intake">
        <div className="section-header">
          <div className="eyebrow">&bull; INTAKE PROCEDURE</div>
          <h2>How to open a file.</h2>
          <p className="section-lede">
            Five steps from sign-up to first briefing. Every operator completes
            step one; the cell&rsquo;s handler completes step two.
          </p>
        </div>
        <div className="intake-list intel-stagger">
          {PROCEDURE.map(([title, body], i) => (
            <div className="intake-step" key={title}>
              <div className="intake-num">{String(i + 1).padStart(2, '0')}</div>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section intel-reveal reveal-d3">
        <div className="section-header">
          <div className="eyebrow">&bull; TERMINOLOGY</div>
          <h2>Glossary of field terms.</h2>
          <p className="section-lede">
            LEGION uses intelligence-community vocabulary throughout the
            interface. Plain meanings follow.
          </p>
        </div>
        <div className="term-grid">
          {GLOSSARY.map(([label, def], i) => (
            <div className="term-row" key={i}>
              <div className="term-label">{label}</div>
              <div className="term-arrow">&rarr;</div>
              <div className="term-def">{def}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="about-cta intel-reveal reveal-d4">
        <div className="eyebrow eyebrow-green">&bull; INTAKE OPEN</div>
        <h3>Open a new file on your cell.</h3>
        <p>
          Submit the cell to LEGION for surveillance. Open an operator file,
          designate the cell, and distribute its invite code. The first briefing
          is filed after the next joint deployment is synced.
        </p>
        <div className="cta-group">
          <Link to="/authenticate" className="btn btn-accent">Open New File</Link>
          <Link to="/" className="btn btn-secondary">Return to Home</Link>
        </div>
      </section>

      <Footer
        docCode="ABOUT-"
        office="LEGION/ANALYSIS"
        extra="CLEARED FOR EXTERNAL DISTRIBUTION"
      />
    </>
  )
}
