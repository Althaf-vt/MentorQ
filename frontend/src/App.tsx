import './App.css'

function App() {
  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">MentorQ</p>
        <h1>Workspace initialization is ready.</h1>
        <p className="lead">
          Phase 0 sets up the React + Vite frontend on port <code>5180</code>{' '}
          and prepares the backend connection target at{' '}
          <code>3133/api/v1</code>.
        </p>
      </section>

      <section className="status-grid" aria-label="Phase 0 status">
        <article className="status-card">
          <h2>Frontend</h2>
          <p>React + Vite scaffold created.</p>
          <p>
            Dev server is locked to <code>5180</code> with strict port
            enforcement.
          </p>
        </article>

        <article className="status-card">
          <h2>Backend</h2>
          <p>NestJS scaffold created.</p>
          <p>
            Bootstrap listens on <code>process.env.PORT</code> and allows CORS
            only from <code>FRONTEND_URL</code>.
          </p>
        </article>
      </section>
    </main>
  )
}

export default App
