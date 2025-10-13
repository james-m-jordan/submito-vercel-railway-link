export default function Home({ targetUrl }) {
  return (
    <main style={styles.main}>
      <section style={styles.card}>
        <h1>Vercel → Railway Redirect</h1>
        {targetUrl ? (
          <>
            <p>
              The redirect is enabled. Incoming traffic will be forwarded to:
            </p>
            <p style={styles.highlight}>{targetUrl}</p>
            <p>
              Use <code>/status</code> to view this page without triggering the
              redirect.
            </p>
          </>
        ) : (
          <>
            <p style={styles.warning}>RAILWAY_TARGET_URL is not configured.</p>
            <ol>
              <li>Open the Vercel project that reviewers access.</li>
              <li>
                Add an environment variable named <code>RAILWAY_TARGET_URL</code>{' '}
                with your Railway deployment URL (e.g., https://example.up.railway.app).
              </li>
              <li>Redeploy so the redirect activates.</li>
              <li>
                Share <code>/status</code> as a diagnostic endpoint if reviewers report
                issues.
              </li>
            </ol>
          </>
        )}
      </section>
    </main>
  );
}

export async function getStaticProps() {
  return {
    props: {
      targetUrl: process.env.RAILWAY_TARGET_URL || null
    }
  };
}

const styles = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f172a',
    color: '#e2e8f0',
    padding: '2rem'
  },
  card: {
    maxWidth: '680px',
    background: 'rgba(15, 23, 42, 0.9)',
    borderRadius: '16px',
    border: '1px solid rgba(148, 163, 184, 0.3)',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.7)',
    padding: '2.5rem',
    fontSize: '1.1rem',
    lineHeight: 1.7
  },
  highlight: {
    fontWeight: 600,
    fontSize: '1.15rem',
    wordBreak: 'break-all'
  },
  warning: {
    color: '#facc15',
    fontWeight: 600,
    marginBottom: '1rem'
  }
};
