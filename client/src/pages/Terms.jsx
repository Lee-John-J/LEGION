import Footer from '../components/Footer'

// Legal document: the chrome (stamp, eyebrow, headings) may carry the dossier
// voice, but every provision body is plain English and nothing is redacted.
const CONTACT = 'contact@legion.report'

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
          <div className="intake-step">
            <div className="intake-num">01</div>
            <div>
              <h3>Service provided as is</h3>
              <p>
                LEGION is a free service run as a hobby project. It is provided
                as is, with no guarantee of uptime, accuracy, or continued
                operation.
              </p>
            </div>
          </div>
          <div className="intake-step">
            <div className="intake-num">02</div>
            <div>
              <h3>Account ownership</h3>
              <p>
                You must be the owner of the Riot account you link to LEGION.
                Each person may hold one LEGION account.
              </p>
            </div>
          </div>
          <div className="intake-step">
            <div className="intake-num">03</div>
            <div>
              <h3>Prohibited conduct</h3>
              <p>
                Do not scrape LEGION, access it by automated means, abuse the
                service, or attempt to circumvent its rate limits.
              </p>
            </div>
          </div>
          <div className="intake-step">
            <div className="intake-num">04</div>
            <div>
              <h3>Suspension and deletion</h3>
              <p>
                We may suspend or delete accounts that violate these terms.
              </p>
            </div>
          </div>
          <div className="intake-step">
            <div className="intake-num">05</div>
            <div>
              <h3>Nature of the statistics</h3>
              <p>
                Statistics on LEGION are derived from public Riot Games match
                data and are provided for information only. No metric on LEGION
                is a skill rating, ranking, or MMR assessment of any individual
                player.
              </p>
            </div>
          </div>
          <div className="intake-step">
            <div className="intake-num">06</div>
            <div>
              <h3>Affiliation</h3>
              <p>
                LEGION is not affiliated with or endorsed by Riot Games.
              </p>
            </div>
          </div>
          <div className="intake-step">
            <div className="intake-num">07</div>
            <div>
              <h3>Governing law</h3>
              <p>
                These terms are governed by the laws of the State of California.
              </p>
            </div>
          </div>
          <div className="intake-step">
            <div className="intake-num">08</div>
            <div>
              <h3>Contact and effective date</h3>
              <p>
                Questions about these terms can be sent to{' '}
                <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. These terms are
                effective as of September 26, 2026.
              </p>
            </div>
          </div>
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
