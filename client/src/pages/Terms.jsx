import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import { CONTACT_EMAIL, TERMS_EFFECTIVE } from '../lib/legal'

// Legal document: the chrome (stamp, eyebrow, headings) may carry the dossier
// voice, but every provision body is plain English and nothing is redacted.
const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>

const PROVISIONS = [
  {
    title: 'Agreement',
    body: (
      <p>
        By creating an account or using LEGION, you agree to these terms and
        acknowledge the <Link to="/privacy">Privacy Policy</Link>. If you do
        not agree, do not use LEGION.
      </p>
    ),
  },
  {
    title: 'Eligibility',
    body: (
      <p>
        You must be at least 13 years old to use LEGION. If you are under the
        age of majority where you live, you must have permission from a parent
        or guardian.
      </p>
    ),
  },
  {
    title: 'Service provided as is',
    body: (
      <p>
        LEGION is a free service run as a hobby project. It is provided
        &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties
        of any kind, including any guarantee of accuracy, uptime, or continued
        operation. Features may change or end at any time. LEGION depends on
        access to the Riot Games API and may stop working if that access
        changes.
      </p>
    ),
  },
  {
    title: 'Your account',
    body: (
      <p>
        You must be the owner of the Riot account you link to LEGION. Each
        person may hold one LEGION account. Keep your passcode private; you are
        responsible for activity under your account.
      </p>
    ),
  },
  {
    title: 'Cells and invite codes',
    body: (
      <p>
        Joining a cell shares your Riot ID and the statistics from matches you
        play with its members with every other operator in that cell. Anyone
        who has a cell&rsquo;s invite code can join it, so share codes only
        with people you intend to add. A cell&rsquo;s handler can remove
        operators and dissolve the cell.
      </p>
    ),
  },
  {
    title: 'Acceptable use',
    body: (
      <p>
        Do not scrape LEGION, access it by automated means, attempt to
        circumvent its rate limits or security, interfere with its operation,
        or impersonate another person. Cell names must not be hateful,
        harassing, sexually explicit, or unlawful; we may rename or remove a
        cell that breaks this rule.
      </p>
    ),
  },
  {
    title: 'Suspension and deletion',
    body: (
      <p>
        We may suspend or delete accounts or cells that violate these terms.
        You may delete your account at any time, as described in the{' '}
        <Link to="/privacy">Privacy Policy</Link>.
      </p>
    ),
  },
  {
    title: 'Nature of the statistics',
    body: (
      <p>
        Statistics on LEGION are derived from public Riot Games match data and
        are provided for information and entertainment only. Analyst notes,
        classifications, and profile badges are generated automatically from
        templates and may be incomplete or inaccurate. No metric on LEGION is
        a skill rating, ranking, or MMR assessment of any individual player.
      </p>
    ),
  },
  {
    title: 'Fictional theme',
    body: (
      <p>
        LEGION&rsquo;s intelligence-agency theme, including its classification
        markings, redactions, and agency names, is fiction. LEGION is not
        affiliated with any government or intelligence agency.
        &ldquo;Surveillance&rdquo; on LEGION means the match statistics
        described in the Privacy Policy and nothing more.
      </p>
    ),
  },
  {
    title: 'Limitation of liability',
    body: (
      <p>
        To the fullest extent permitted by law, LEGION and the people who run
        it are not liable for any indirect, incidental, special, or
        consequential damages, or for any loss of data, arising from your use
        of LEGION. Our total liability for any claim relating to LEGION is
        limited to US$50.
      </p>
    ),
  },
  {
    title: 'Riot Games',
    body: (
      <p>
        LEGION is not affiliated with or endorsed by Riot Games. Your use of
        League of Legends remains subject to Riot Games&rsquo; own terms.
      </p>
    ),
  },
  {
    title: 'Changes to these terms',
    body: (
      <p>
        We may update these terms. The new version will be posted here with a
        new effective date, and material changes will be announced on the
        site. Continuing to use LEGION after a change takes effect means you
        accept the updated terms.
      </p>
    ),
  },
  {
    title: 'Governing law',
    body: (
      <p>These terms are governed by the laws of the State of California.</p>
    ),
  },
  {
    title: 'Contact and effective date',
    body: (
      <p>
        Questions about these terms can be sent to {mail}. These terms are
        effective as of {TERMS_EFFECTIVE}.
      </p>
    ),
  },
]

export default function Terms() {
  return (
    <>
      <section className="about-hero intel-reveal">
        <div className="doc-stamp">
          <div className="stamp-block">
            DOCUMENT<br />
            <strong>LGN-TERMS-001</strong>
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
            <span className="live-dot"></span> TERMS OF ENGAGEMENT &middot;
            CLEARED FOR PUBLIC RELEASE
          </div>
          <h1 className="title-hero">Terms of Service</h1>
          <p className="lead">
            These terms of service set out the rules for using LEGION. They
            apply to every account.
          </p>
        </div>
      </section>

      <section className="section legal-body intel-reveal reveal-d1">
        <div className="section-header">
          <div className="eyebrow">&bull; PROVISIONS</div>
          <h2>Conditions of use.</h2>
          <p className="section-lede">
            Plain language throughout. Nothing in these terms is redacted.
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
        docCode="TERMS-"
        office="LEGION/COUNSEL"
        extra="CLEARED FOR EXTERNAL DISTRIBUTION"
      />
    </>
  )
}
