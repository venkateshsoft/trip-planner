# Trip Planner

Phase 8 production foundation for a trip planning application. It supports trip input persistence, cached provider adapters, normalized discovery searches, deterministic itinerary generation, itinerary editing, schema-constrained AI assistance, and deployment hardening.

Phase 8 adds production hardening: request IDs, security headers, API/AI rate limits, readiness checks, provider retries with stale-cache fallback, structured request logs, and a small health load-test harness.

## Prerequisites

- Node.js 20+
- PostgreSQL 15+

## Setup

```bash
npm install
copy .env.example .env
npm run db:generate
```

Set `DATABASE_URL` in `.env` to a reachable PostgreSQL database, then apply the committed schema:

```bash
npm run db:deploy
npm run dev
```

For production, run `npm run db:deploy` during deployment. Do not use `prisma migrate dev` against production; it is only for creating future development migrations.

## Production deployment

The repository includes a minimal `vercel.json` for deploying this Next.js application to Vercel. The same `npm ci`, `npm run build`, and `npm run start` commands work on any Node.js 20+ host that supports a long-running Next.js server. No cloud resources are created by this repository.

Recommended release sequence:

```bash
npm ci
npm run db:deploy
npm run build
npm run start
```

Run the migration step once per release against the target PostgreSQL database. Keep it as a separate release step when the hosting platform builds multiple instances; do not run migrations concurrently from every application instance.

### Health check

After startup, verify liveness and readiness from the deployed URL:

```bash
curl -fsS https://YOUR_DOMAIN/api/health
curl -fsS https://YOUR_DOMAIN/api/ready
```

`/api/health` should return HTTP 200 without authentication. `/api/ready` should return HTTP 200 only when the application can reach PostgreSQL. A failed readiness check should stop traffic from being promoted to the release.

### Rollback

For an application-only failure, promote the previous deployment on the hosting platform and confirm both health endpoints. If the release included a database migration, first verify that the previous application version is compatible with the migrated schema. Prisma migrations are forward-only; do not delete or edit applied migrations. Use a tested PostgreSQL backup/restore procedure for a database rollback, then redeploy the matching application version.

### Infrastructure requirements

- PostgreSQL 15+ with SSL enabled where supported, automated backups, connection limits, and a deployment-specific database user. `DATABASE_URL` must point to this database; credentials are never stored in the repository.
- A managed Redis service with an Upstash-compatible REST API. Production requires both `RATE_LIMIT_REDIS_URL` and `RATE_LIMIT_REDIS_TOKEN`; the application fails closed for protected API traffic when either is missing.
- Google Cloud Maps/Places APIs enabled and restricted `GOOGLE_MAPS_API_KEY` when Google-backed discovery, routes, or geocoding are used. Apply API and quota restrictions to the deployment origin/project.
- An OpenAI API key with appropriate project limits for AI endpoints. `OPENAI_API_KEY` is required only when AI endpoints are enabled, and `OPENAI_MODEL` selects the configured model.

Use the hosting providerâ€™s encrypted environment-variable store. Never put production values in `.env`, `.env.local`, deployment manifests, logs, or source control.

## Production configuration

Required: `DATABASE_URL`, `APP_API_TOKEN`, `RATE_LIMIT_REDIS_URL`, and `RATE_LIMIT_REDIS_TOKEN`. Set `GOOGLE_MAPS_API_KEY` for Google-backed discovery, maps, and geocoding. Set `OPENAI_API_KEY` only when AI endpoints are enabled; `OPENAI_MODEL` is optional. `API_RATE_LIMIT_PER_MINUTE`, `AI_RATE_LIMIT_PER_MINUTE`, and `PROVIDER_RATE_LIMIT_PER_MINUTE` are optional limits with safe defaults. Keep all values in the deployment secret manager; never commit `.env`.

The application runs at `http://localhost:3000`; health is at `/api/health`.

Open `/trips/new` to create a trip. Saved trips can be edited at `/trips/:id/edit`.

The trip API is available at `POST /api/trips`, `GET /api/trips`, `GET /api/trips/:id`, and `PATCH /api/trips/:id`. The web app now provides the complete demo flow: create a trip, open its workspace, discover Google Places, select candidates, generate an itinerary, and edit or regenerate it. Budgets are stored as integer minor units (for example, cents for USD).

## Demo workflow

1. Open `/trips/new` and enter the destination, dates, transport, budget, and interests.
2. From the saved trip workspace, search for attractions and select the places to include.
3. Generate the itinerary. The planner uses the selected places, Google route durations, travel mode, opening hours when available, budget, and trip dates.
4. Use the itinerary editor to remove, reorder, add, replace, or regenerate stops.

Production requires `DATABASE_URL`, `DIRECT_URL`, `GOOGLE_MAPS_API_KEY`, `APP_API_TOKEN`, `RATE_LIMIT_REDIS_URL`, and `RATE_LIMIT_REDIS_TOKEN`. Set `OPENAI_API_KEY` only for AI endpoints. The Vercel build applies committed Prisma migrations before building the app. After deployment, sign in by POSTing the configured `APP_API_TOKEN` to `/api/auth/login` to establish the secure session cookie.

## Provider layer

Provider endpoints are intentionally thin adapters over normalized services:

- `POST /api/providers/geocode` â€” Google address geocoding
- `POST /api/providers/places` â€” Google Places text search
- `POST /api/providers/routes` â€” Google route distance and duration
- `POST /api/providers/weather` â€” Open-Meteo daily forecast

Provider responses are cached in `ProviderCacheEntry`. Google responses require `GOOGLE_MAPS_API_KEY`; weather uses Open-Meteo and does not require a key. Provider requests retry transient failures, open a short circuit after repeated failures, and serve stale cache data when available. Production API rate limiting uses the shared Redis backend documented below.

## Discovery endpoints

- `POST /api/discovery/points-of-interest` â€” tourist attractions filtered by rating and location
- `POST /api/discovery/hotels` â€” lodging filtered by location, Google price level, and requested star query
- `POST /api/discovery/restaurants` â€” restaurants filtered by cuisine, rating, price level, and location

Discovery results are normalized into `PointOfInterest`, `Hotel`, and `Restaurant` models. Google Places does not provide verified hotel availability or a reliable star classification in this integration, so availability is explicitly marked `unsupported` and the requested star rating is retained separately.

`POST /api/providers/places` also accepts an optional `includedType` and `destinationId`. When `destinationId` is supplied, normalized Google Places results are upserted into `Place` records for that `TripDestination`; the response includes `persisted: true`. Repeating the same discovery request for a destination updates existing source records instead of creating duplicates. Without `destinationId`, the endpoint retains its existing search-only behavior.

## Itinerary generation

`POST /api/itineraries/generate` accepts a `tripId` and up to 12 normalized candidate stops. The engine builds a transport-aware travel-time matrix, scores interest/rating fit, respects daily opening windows and operating hours, schedules stops between 09:00 and 18:00, and persists the generated itinerary. Cost estimates include the trip's daily hotel/food allocations, candidate costs, and deterministic transport-mode rates.

The engine is deterministic and contains no AI or weather reasoning. Weather-aware scheduling remains deferred to a later phase.

The itinerary editor is available at `/trips/:id/itinerary`. It supports drag-and-drop reorder, remove, add, replace, and explicit regeneration. Mutations are marked `PARTIAL` until regeneration recalculates routes, opening windows, times, and costs.

## AI assistance

- `POST /api/ai/preferences` â€” extract structured preferences from user text
- `POST /api/ai/explanations` â€” explain known discovery recommendations
- `POST /api/ai/itinerary-command` â€” interpret a natural-language edit as a safe advisory command

AI responses use OpenAI Responses API Structured Outputs and are validated again with Zod. AI cannot mutate trips or itineraries directly; unknown entity IDs become filtered or safe no-op results. Configure `OPENAI_API_KEY` and optionally `OPENAI_MODEL` in `.env`.

Production API access requires `APP_API_TOKEN`. Send it as `Authorization: Bearer <token>` or establish the secure session cookie with `POST /api/auth/login` using `{ "token": "..." }`. This is a single-tenant application token; add an identity provider and user ownership model before exposing it to multiple independent users.

`/api/health` is a liveness check; `/api/ready` verifies database connectivity. Run `npm run test:load` against a running server, optionally setting `LOAD_TEST_URL`, `LOAD_TEST_REQUESTS`, and `LOAD_TEST_CONCURRENCY`. Production requires `RATE_LIMIT_REDIS_URL` and `RATE_LIMIT_REDIS_TOKEN`; these point to an Upstash-compatible Redis REST endpoint used for shared rate limiting.

## Quality checks

```bash
npm run format:check
npm run lint
npm test
npm run build
```

Hotel/restaurant availability, weather-aware itinerary optimization, and multi-user identity/ownership are intentionally deferred.

