import Footer from '../components/Footer'

// Legal document: the chrome (stamp, eyebrow, headings) may carry the dossier
// voice, but every provision body is plain English and nothing is redacted.
const CONTACT = 'contact@legion.report'

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
            collected, where it is stored, and how to have it deleted.
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
          <div className="intake-step">
            <div className="intake-num">01</div>
            <div>
              <h3>Information on file</h3>
              <p>
                We collect your email address and password, which are handled
                by Supabase Auth; your Riot ID (game name and tag line); your
                PUUID, the permanent player identifier Riot Games assigns to
                your account; and public League of Legends match data retrieved
                from the Riot Games API.
              </p>
            </div>
          </div>
          <div className="intake-step">
            <div className="intake-num">02</div>
            <div>
              <h3>Purpose of collection</h3>
              <p>
                We use this information to identify your account, to link it to
                your Riot account, and to compute group statistics for the cells
                you belong to.
              </p>
            </div>
          </div>
          <div className="intake-step">
            <div className="intake-num">03</div>
            <div>
              <h3>Storage</h3>
              <p>
                Your information is stored with Supabase, a hosted PostgreSQL
                database service.
              </p>
            </div>
          </div>
          <div className="intake-step">
            <div className="intake-num">04</div>
            <div>
              <h3>Match data</h3>
              <p>
                Match data is public game data provided by Riot Games. We cache
                it to reduce the number of calls we make to the Riot Games API.
                It is not private information.
              </p>
            </div>
          </div>
          <div className="intake-step">
            <div className="intake-num">05</div>
            <div>
              <h3>Third parties</h3>
              <p>
                We do not sell, rent, or share personal data with third parties.
                We run no advertising and no third-party analytics trackers.
              </p>
            </div>
          </div>
          <div className="intake-step">
            <div className="intake-num">06</div>
            <div>
              <h3>Cookies and local storage</h3>
              <p>
                Cookies and local storage are used only to keep you signed in
                and to remember a few settings on your device, such as the last
                cell you viewed.
              </p>
            </div>
          </div>
          <div className="intake-step">
            <div className="intake-num">07</div>
            <div>
              <h3>Deletion of records</h3>
              <p>
                To delete your data, email <a href={`mailto:${CONTACT}`}>{CONTACT}</a>{' '}
                from the email address on your account. We will delete your
                account, your operator record, and your cell memberships within
                14 days.
              </p>
            </div>
          </div>
          <div className="intake-step">
            <div className="intake-num">08</div>
            <div>
              <h3>Affiliation</h3>
              <p>
                LEGION is not affiliated with or endorsed by Riot Games.
              </p>
            </div>
          </div>
          <div className="intake-step">
            <div className="intake-num">09</div>
            <div>
              <h3>Contact</h3>
              <p>
                Questions about this policy or your data can be sent to{' '}
                <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
              </p>
            </div>
          </div>
          <div className="intake-step">
            <div className="intake-num">10</div>
            <div>
              <h3>Effective date</h3>
              <p>This policy is effective as of September 26, 2026.</p>
            </div>
          </div>
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
