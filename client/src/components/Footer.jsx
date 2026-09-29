import { Link } from 'react-router-dom'
import { Redacted as R } from './Redacted'

export default function Footer({ docCode = '', office = 'LEGION/OPS', extra }) {
  return (
    <footer className="site-footer">
      DOCUMENT REF: LGN-2026-{docCode}<R w={24} />
      &nbsp;//&nbsp; ORIGINATING OFFICE: {office}
      &nbsp;//&nbsp; OVERSIGHT: <R w={38} />
      &nbsp;//&nbsp; {extra || (<>DISTRIBUTION LIMITED &nbsp;//&nbsp; DECLASSIFY ON: <R w={54} /></>)}
      {/* Riot Games legal boilerplate — the exact notice Riot's developer
          policies require (developer.riotgames.com/policies/general),
          contractions and comma included. Never reword, redact, abbreviate,
          or restyle it into the dossier voice. */}
      <p className="footer-legal">
        LEGION isn&rsquo;t endorsed by Riot Games and doesn&rsquo;t reflect the
        views or opinions of Riot Games or anyone officially involved in
        producing or managing Riot Games properties. Riot Games, and all
        associated properties are trademarks or registered trademarks of Riot
        Games, Inc.
      </p>
      <nav className="footer-legal-links" aria-label="Legal">
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
      </nav>
    </footer>
  )
}
