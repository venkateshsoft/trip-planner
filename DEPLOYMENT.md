# Deployment checklist

This application is a Next.js server application. GitHub stores the source and CI; Vercel (or another Node-capable host) serves the application and API routes.

## 1. GitHub

Create an empty repository named `trip-planner` under the intended GitHub account, then push the project root. Do not commit `.env`; it is ignored.

The included GitHub Actions workflow runs:

```text
npm install --no-audit --no-fund
npm run lint
npm test
npm run build
```

## 2. Database

Use a reachable PostgreSQL provider such as Neon. Set both connection variables in the host:

- `DATABASE_URL`: pooled/runtime connection
- `DIRECT_URL`: direct/migration connection

The Vercel build command runs `prisma migrate deploy` before `next build`, so the committed migration history must be present in the repository.

## 3. Vercel environment variables

Configure these for Production, Preview, and Development as appropriate:

```text
DATABASE_URL
DIRECT_URL
GOOGLE_MAPS_API_KEY
APP_API_TOKEN
RATE_LIMIT_REDIS_URL
RATE_LIMIT_REDIS_TOKEN
```

Optional variables:

```text
OPENAI_API_KEY
OPENAI_MODEL
LOG_LEVEL
API_RATE_LIMIT_PER_MINUTE
AI_RATE_LIMIT_PER_MINUTE
PROVIDER_RATE_LIMIT_PER_MINUTE
```

`APP_API_TOKEN` protects production API routes. After deployment, open `/login` and use that token. Verify `/api/health` and `/api/ready` before using the planner.

## 4. Smoke test

1. Open `/login` and sign in with `APP_API_TOKEN`.
2. Create a trip at `/trips/new` using a city/state/country or Google Maps-style location.
3. Confirm the normalized destination appears in the trip workspace.
4. Search for attractions and select several results.
5. Generate the itinerary.
6. Reorder or remove a stop, then regenerate.

