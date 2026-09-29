import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import { CONTACT_EMAIL, PRIVACY_EFFECTIVE } from '../lib/legal'

// Legal document: the chrome (stamp, eyebrow, headings) may carry the dossier
// voice, but every provision body is plain English and nothing is redacted.
// The policy must describe what the code actually does — a new stored key,
// data flow, or service provider means revising it and its effective date.
const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>

const PROVISIONS = [
  {
    title: 'Information on file',
    body: (
      <>
        <p>
          <strong>Account.</strong> Your email address and a password. Sign-in
          is handled by Supabase Auth, our authentication provider, which
          stores passwords only in hashed form; LEGION never sees or stores
          your password in readable form.
        </p>
        <p>
          <strong>Riot account.</strong> Your Riot ID (game name and tagline)
          and your PUUID, the permanent player identifier Riot Games assigns
          to your account.
        </p>
        <p>
          <strong>Cells.</strong> The names of cells you create or join, when
          you joined them, and which cells you handle.
        </p>
        <p>
          <strong>Match data.</strong> Public League of Legends match records
          for your linked account, retrieved from the Riot Games API. This
          covers your matches from the current season, including matches
          played without your cell, although LEGION only reports matches
          played with it. Each match record also contains the Riot IDs and
          in-game statistics of the other players in that match, exactly as
          Riot Games provides them.
        </p>
        <p>
          <strong>Technical data.</strong> Like most websites, our hosting and
          sign-in providers record IP addresses and basic request details in
          their logs. LEGION also holds IP addresses briefly, in memory only, to
          limit how often the sign-up form can check Riot IDs.
        </p>
      </>
    ),
  },
  {
    title: 'Purpose of collection',
    body: (
      <p>
        We use this information to run your account, link it to your Riot
        account, compute group statistics for the cells you belong to, send
        account emails (sign-up confirmation and passcode resets), and protect
        the service from abuse. We do not send marketing email.
      </p>
    ),
  },
  {
    title: 'Who can see your information',
    body: (
      <p>
        Other operators in the cells you belong to can see your Riot ID and
        the statistics LEGION computes from matches you played with them.
        Your email address is never shown to other users. Cell pages are
        available only to signed-in members of that cell.
      </p>
    ),
  },
  {
    title: 'Storage and service providers',
    body: (
      <p>
        Your information is stored in a database hosted by Supabase in the
        United States. LEGION relies on these providers, each of which handles
        data under its own privacy policy: Supabase (database and sign-in),
        Vercel (website hosting), and the Riot Games API (source of match
        data). Everything else the site needs, including its typefaces, is
        served from LEGION&rsquo;s own domain.
      </p>
    ),
  },
  {
    title: 'No selling, no advertising',
    body: (
      <p>
        We do not sell or rent personal data, and we do not share it for
        advertising. LEGION runs no ads and no analytics or tracking tools.
      </p>
    ),
  },
  {
    title: 'Cookies and local storage',
    body: (
      <p>
        LEGION does not use cookies. It uses your browser&rsquo;s local storage
        to keep you signed in and to remember a few settings on your device,
        such as the last cell you viewed. Clearing this site&rsquo;s data in
        your browser removes them.
      </p>
    ),
  },
  {
    title: 'Retention and deletion',
    body: (
      <p>
        We keep your account information until you delete your account. To
        delete it, email {mail} from the address on your account. Within 14
        days we will delete your account, your operator record (Riot ID and
        PUUID), and your cell memberships. Cells you created remain available
        to their other operators. Cached match records are public game data
        from Riot Games and may be kept after your account is deleted, but
        they are no longer connected to a LEGION account.
      </p>
    ),
  },
  {
    title: 'Your choices',
    body: (
      <p>
        You can ask for a copy of the information LEGION holds about you, ask
        us to correct it, or ask us to delete it by emailing {mail}. We will
        respond within 30 days.
      </p>
    ),
  },
  {
    title: 'Children',
    body: (
      <p>
        LEGION is not directed to children under 13, and we do not knowingly
        collect personal information from them. If you believe a child under
        13 has created an account, contact us and we will delete it.
      </p>
    ),
  },
  {
    title: 'Security',
    body: (
      <p>
        All traffic to LEGION is encrypted in transit (HTTPS), and access to
        the database is restricted to LEGION&rsquo;s own server. No online
        service can guarantee perfect security.
      </p>
    ),
  },
  {
    title: 'Affiliation',
    body: (
      <p>LEGION is not affiliated with or endorsed by Riot Games.</p>
    ),
  },
  {
    title: 'Changes to this policy',
    body: (
      <p>
        If this policy changes, the new version will be posted here with a new
        effective date. Changes that materially affect how your information is
        used will also be announced on the site or by email before they take
        effect. Use of LEGION is also governed by the{' '}
        <Link to="/terms">Terms of Service</Link>.
      </p>
    ),
  },
  {
    title: 'Contact',
    body: (
      <p>Questions about this policy or your data can be sent to {mail}.</p>
    ),
  },
  {
    title: 'Effective date',
    body: <p>This policy is effective as of {PRIVACY_EFFECTIVE}.</p>,
  },
]

export default function Privacy() {
  return (
    <>
      <section className="about-hero intel-reveal">
        <div className="doc-stamp">
          <div className="stamp-block">
            DOCUMENT<br />
            <strong>LGN-PRIV-001</strong>
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
            <span className="live-dot"></span> PRIVACY DIRECTIVE &middot;
            CLEARED FOR PUBLIC RELEASE
          </div>
          <h1 className="title-hero">Privacy Policy</h1>
          <p className="lead">
            This policy explains what information LEGION collects, why it is
            collected, who can see it, where it is stored, and how to have it
            deleted.
          </p>
        </div>
      </section>

      <section className="section legal-body intel-reveal reveal-d1">
        <div className="section-header">
          <div className="eyebrow">&bull; PROVISIONS</div>
          <h2>Handling of personal data.</h2>
          <p className="section-lede">
            Plain language throughout. Nothing in this policy is redacted.
          </p>
        </div>
        <div className="intake-list">
          {PROVISIONS.map((p, i) => (
            <div className="intake-step" key={p.title}>
              <div className="intake-num">{String(i + 1).padStart(2, '0')}</div>
              <div>
                <h3>{p.title}</h3>
                {p.body}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer
        docCode="PRIV-"
        office="LEGION/COUNSEL"
        extra="CLEARED FOR EXTERNAL DISTRIBUTION"
      />
    </>
  )
}
