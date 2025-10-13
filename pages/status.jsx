export async function getServerSideProps() {
  return {
    props: {
      targetUrl: process.env.RAILWAY_TARGET_URL || null,
      deployment: {
        env: process.env.VERCEL_ENV || 'development',
        region: process.env.VERCEL_REGION || 'unknown'
      }
    }
  };
}

export default function Status({ targetUrl, deployment }) {
  return (
    <main style={styles.main}>
      <section style={styles.card}>
        <h1>Redirect Status</h1>
        <p>
          <strong>Vercel environment:</strong> {deployment.env} ({deployment.region})
        </p>
        <p>
          <strong>Railway target:</strong>{' '}
          {targetUrl ? <code>{targetUrl}</code> : <em>not configured</em>}
        </p>
        {!targetUrl && (
          <p style={styles.warning}>
            Set the <code>RAILWAY_TARGET_URL</code> environment variable on Vercel to
            enable automatic redirects.
          </p>
        )}
      </section>
    </main>
  );
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
    maxWidth: '560px',
    background: 'rgba(15, 23, 42, 0.9)',
    borderRadius: '16px',
    border: '1px solid rgba(148, 163, 184, 0.3)',
    boxShadow: '0 20px 45px -15px rgba(15, 23, 42, 0.7)',
    padding: '2rem',
    fontSize: '1rem',
    lineHeight: 1.6
  },
  warning: {
    color: '#facc15',
    fontWeight: 600,
    marginTop: '1rem'
  }
};
