const appVersion = __APP_VERSION__
const commitSha = __COMMIT_SHA__
const repoUrl = __REPO_URL__
const paypalUrl = __PAYPAL_URL__

function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Local-first freelance practice flow</p>
          <h1>Solo Practice Flow</h1>
          <p className="lede">
            Capture a lead, shape a proposal, draft a contract, invoice the work,
            and export tax-ready records without a hosted backend.
          </p>
        </div>
        <nav aria-label="Project links" className="link-row">
          <a href={repoUrl} target="_blank" rel="noreferrer">
            GitHub repo
          </a>
          <a href={paypalUrl} target="_blank" rel="noreferrer">
            Support via PayPal
          </a>
        </nav>
      </header>

      <section className="workspace" aria-labelledby="workspace-title">
        <div>
          <h2 id="workspace-title">Workflow scaffold</h2>
          <p>
            The first Pages-ready shell is live. The full local workspace,
            cryptographic signing, encrypted exports, DuckDB tax reports, Pandoc
            document export, ICS reminders, and optional local LLM generation are
            implemented in the next commits.
          </p>
        </div>
        <dl className="version-grid" aria-label="Build metadata">
          <div>
            <dt>Version</dt>
            <dd>{appVersion}</dd>
          </div>
          <div>
            <dt>Commit</dt>
            <dd>{commitSha}</dd>
          </div>
        </dl>
      </section>
    </main>
  )
}

export default App
