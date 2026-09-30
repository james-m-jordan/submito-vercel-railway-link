import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { cp } from 'node:fs/promises';
import { createServer } from 'node:net';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

const target = 'https://example.up.railway.app';

// Package the static assets as required by Next.js standalone output.
await cp('.next/static', '.next/standalone/.next/static', { recursive: true });

async function withServer(targetUrl, check) {
  const socket = createServer();
  socket.listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));

  const env = {
    ...process.env,
    HOSTNAME: '127.0.0.1',
    PORT: String(port),
    NEXT_TELEMETRY_DISABLED: '1',
    VERCEL_ENV: 'preview',
    VERCEL_REGION: 'iad1'
  };
  delete env.RAILWAY_TARGET_URL;
  if (targetUrl !== undefined) env.RAILWAY_TARGET_URL = targetUrl;
  const server = spawn(process.execPath, ['.next/standalone/server.js'], { env });
  let output = '';
  server.stdout.on('data', (chunk) => { output += chunk; });
  server.stderr.on('data', (chunk) => { output += chunk; });
  const stopped = once(server, 'exit');
  const url = `http://127.0.0.1:${port}`;

  try {
    let ready = false;
    for (let attempt = 0; attempt < 150; attempt++) {
      assert.equal(server.exitCode, null, output);
      try {
        const response = await fetch(`${url}/status`, { signal: AbortSignal.timeout(1000) });
        if (response.ok) { ready = true; break; }
      } catch { /* Wait for the local server to bind. */ }
      await delay(100);
    }
    assert.ok(ready, `Standalone server did not start: ${output}`);
    await check(url);
  } finally {
    if (server.exitCode === null) server.kill('SIGTERM');
    await stopped;
  }
}

async function statusProps(url) {
  const response = await fetch(`${url}/status`, { redirect: 'manual' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('location'), null);
  const html = await response.text();
  const data = JSON.parse(html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)[1]);
  return { html, props: data.props.pageProps };
}

test('configured bridge preserves 308 redirects, path, query and diagnostics', async () => {
  await withServer(`  ${target}  `, async (url) => {
    for (const path of ['/', '/translocations?gene=Grpel1&condition=4%20C&gene=Ucp1', '/detection?gene=Ucp1']) {
      const response = await fetch(`${url}${path}`, { redirect: 'manual' });
      assert.equal(response.status, 308);
      const actual = new URL(response.headers.get('location'));
      const expected = new URL(`${target}${path}`);
      assert.equal(actual.origin, expected.origin);
      assert.equal(actual.pathname, expected.pathname);
      const keys = [...new Set(expected.searchParams.keys())].sort();
      assert.deepEqual([...new Set(actual.searchParams.keys())].sort(), keys);
      for (const key of keys) {
        assert.deepEqual(actual.searchParams.getAll(key), expected.searchParams.getAll(key));
      }
    }
    const bypass = await fetch(`${url}/detection`, {
      redirect: 'manual',
      headers: { 'x-middleware-subrequest': 'middleware:middleware:middleware:middleware:middleware' }
    });
    assert.equal(bypass.status, 308);
    assert.equal(bypass.headers.get('location'), `${target}/detection`);

    const { html, props } = await statusProps(url);
    assert.equal(props.targetUrl.trim(), target);
    assert.deepEqual(props.deployment, { env: 'preview', region: 'iad1' });
    assert.match(html, /Redirect Status/);

    const asset = html.match(/src="(\/_next\/static[^"]+)"/)[1];
    const staticResponse = await fetch(`${url}${asset}`, { redirect: 'manual' });
    assert.equal(staticResponse.status, 200);
    assert.equal(staticResponse.headers.get('location'), null);

    for (const path of ['/api/status', '/favicon.ico', '/robots.txt']) {
      const response = await fetch(`${url}${path}`, { redirect: 'manual' });
      assert.equal(response.status, 404);
      assert.equal(response.headers.get('location'), null);
    }
  });
});

test('missing target keeps the fallback page and diagnostics available', async () => {
  await withServer(undefined, async (url) => {
    const response = await fetch(url, { redirect: 'manual' });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('location'), null);
    assert.match(await response.text(), /RAILWAY_TARGET_URL is not configured/);
    const { props } = await statusProps(url);
    assert.equal(props.targetUrl, null);
  });
});

test('invalid target returns a clear 500 while diagnostics remain reachable', async () => {
  await withServer('not-a-url', async (url) => {
    const response = await fetch(`${url}/detection`, { redirect: 'manual' });
    assert.equal(response.status, 500);
    assert.equal((await response.json()).error, 'Invalid RAILWAY_TARGET_URL');
    const { props } = await statusProps(url);
    assert.equal(props.targetUrl, 'not-a-url');
  });
});
