# Konect Discovery

Phase 1: Local AI-powered discovery engine.

## Project Structure

```
Konect-Discovery/
├── apps/
│   └── web/          # Next.js frontend
├── services/
│   └── api/          # Fastify API (deployed on Render)
└── pnpm-workspace.yaml
```

## Environment Variables

### API (services/api)

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | Yes |
| `ADMIN_TOKEN` | Secret token for admin endpoints | Yes |
| `PORT` | API server port (default: 3000) | No |

### Frontend (apps/web)

| Variable | Description | Required |
|----------|-------------|----------|
| `API_URL` | Backend API URL (default: http://localhost:3000) | No |

## Local Development

```bash
# Install dependencies
pnpm install

# Start the API (from root or services/api)
cd services/api
pnpm dev

# Start the frontend (in another terminal)
cd apps/web
pnpm dev
```

## API Endpoints

### Health Check
```
GET /health
Response: { "ok": true }
```

### Search Businesses
```
GET /search?q={query}&category={category}&limit={limit}&offset={offset}
Response: {
  "results": [...],
  "meta": { "total": 100, "limit": 20, "offset": 0 }
}
```

Results are ordered by `konect_rank DESC`, `trust_score DESC`, `name ASC`.

### Track Engagement
```
POST /engagement
Body: {
  "business_id": "uuid",
  "event_type": "view|click|call|website|book|share|save",
  "session_id": "optional-session-id",
  "metadata": { ... }
}
Response: { "success": true, "event_id": "uuid" }
```

### Recalculate Ranks (Admin)
```
POST /admin/recalculate
Headers: X-Admin-Token: <ADMIN_TOKEN>
Body: { "business_id": "uuid" }  // optional, recalculates all if omitted
Response: { "success": true, "recalculated": 1 }
```

## Supabase Requirements

The API expects the following Supabase resources:

- **View**: `v_business_search` - Returns businesses with ranking data
- **Table**: `engagement_events` - Stores user engagement events
- **Functions**:
  - `recalculate_rank_for_business(p_business_id uuid)` - Recalculates rank for one business
  - `recalculate_all_ranks()` - Recalculates all business ranks

## Deployment (Render)

1. Create a new Web Service on Render
2. Set root directory to `services/api`
3. Build command: `pnpm install`
4. Start command: `pnpm start`
5. Add environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_TOKEN)
