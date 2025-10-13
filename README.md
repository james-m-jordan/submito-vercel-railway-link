# submito-vercel-railway-link

A tiny Next.js bridge that keeps the legacy Vercel reviewer link alive while
redirecting visitors to the live Railway deployment of the Jordan Lab knowledge
base.

## How it works

- Every request hitting Vercel runs through `middleware.js`.
- When the `RAILWAY_TARGET_URL` environment variable is set, the middleware
  issues a 308 redirect to that Railway URL, preserving the path/query string.
- If the variable is missing, the landing page stays visible and reminds you to
  configure it. `/status` exposes the current configuration without triggering a
  redirect.

## Setup

1. Clone this repository locally and install dependencies:

   ```bash
   npm install
   ```

2. Deploy to Vercel (or connect the existing Vercel project to this repo).

3. In the Vercel dashboard, add an environment variable:

   - **Name:** `RAILWAY_TARGET_URL`
   - **Value:** your Railway deployment URL (e.g.,
     `https://knowledge-base-production.up.railway.app`).
   - Apply to all environments you care about and redeploy.

4. Use `/status` as a diagnostics URL to confirm the redirect target.

## Local development

```bash
npm run dev
```

By default the app renders the informational landing page. To simulate the
redirect locally, set `RAILWAY_TARGET_URL` before starting the dev server.

```bash
RAILWAY_TARGET_URL=https://example.com npm run dev
```

## Troubleshooting

- **Redirect loop** – ensure `RAILWAY_TARGET_URL` points to the Railway domain,
  not back to the Vercel URL.
- **Invalid URL message** – the middleware validates `RAILWAY_TARGET_URL`; make
  sure it includes the scheme (`https://`).
- **Reviewers still see the old Vercel content** – confirm the deployment is
  using this repository and the environment variable is set in the production
  environment.

## Deployment note

This repo powers the Vercel redirect for Railway.
