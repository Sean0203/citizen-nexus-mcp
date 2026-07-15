# CLAUDE.md

Guidance for AI agents (and humans) working in this repository.

## Project

`citizen-nexus-mcp` is a local stdio MCP (Model Context Protocol) server that
surfaces Star Citizen game data to MCP clients. It is read-only: it fetches and
serves data, and never writes or contributes data to upstream sources.

Data sources:
- **star-citizen.wiki API** (`https://api.star-citizen.wiki`): vehicles, items,
  components, and their pricing/location data.
- **UEX API** (`https://uexcorp.space`, v2.1): commodity prices and trading data.

The server targets the broad MCP client ecosystem (Claude Desktop, Cursor,
Cline, VS Code, Claude Code), not one specific client.

## Runtime & Tooling

- Node.js >= 24 (developed on 24.16.0), TypeScript, ESM.
- Test runner: Vitest.
- Lint/format: ESLint (flat config + typescript-eslint), Prettier.
- CI: GitHub Actions (lint, test, build).
- Published as a public GitHub repo and to NPM.

## Commands

- `npm run build` — compile TypeScript to the build output.
- `npm test` — run the Vitest suite.
- `npm run lint` — run ESLint.
- `npm run format` — run Prettier.

## Architecture

The code follows a one-directional layered dependency flow, wired together by a
composition root. Each layer depends only on the layer below it:

api/ -> domain/ -> repositories/ -> services/ -> tools/

- **`index.ts`** — Process entry point. Constructs the server via the container
  and connects it to the stdio transport.
- **`container.ts`** — Composition root. Instantiates and wires every layer;
  the single place where concrete dependencies are assembled.
- **`api/`** — Thin HTTP clients for the external APIs. `http.ts` is the shared
  request layer (base URLs, headers, error handling, rate-limit adherence; wiki
  caps at 60 req/min). `wiki/` and `uex/` each hold a `client.ts` (endpoint
  calls) and a `schema.ts` (upstream payload shapes, auto-generated from each
  API's OpenAPI spec via openapi-typescript; do not edit by hand). Clients
  return raw upstream payloads and hold no business logic.
- **`domain/`** — Domain models and the projections that map raw API payloads
  into them (`wiki-vehicle.models.ts`, `wiki-vehicle.projection.ts`). `cargo.ts`
  holds SCU cargo-capacity logic (per-grid box-fitting; wiki `max_scu` is
  unreliable so capacity is recalculated from box dimensions).
- **`repositories/`** — Fetch-and-shape layer. Coordinates API clients, applies
  caching (`cache.ts`), and returns domain models. `warmable.ts` defines the
  warm-up contract for pre-populating caches on startup.
- **`services/`** — Business logic: search, ranking, filtering. This is where
  query semantics live (e.g. Fuse.js fuzzy matching and tie-breaking).
- **`tools/`** — MCP tool definitions. Each tool declares its input schema,
  validates arguments, calls a service, and formats the structured result the
  MCP client receives. `helpers.ts` holds shared formatting/validation used
  across tools.
- **`logging/`** — `logger.ts`: MCP-protocol-compliant structured logging via a
  Hub/sink architecture using `server.sendLoggingMessage()`. Sink attachment is
  deferred until after the handshake (`oninitialized`).

## Key Invariants

- **Cache** — TTL cache with single-flight deduplication. No `await` before
  `store.set()` inside `get()` (atomicity for single-flight); the TTL clock
  starts at load dispatch, not resolution; `clear()` does not cancel in-flight
  entries.
- **Fuzzy search** — Fuse.js matching with a layered comparator for tie-breaking
  (Fuse score, then match-character coverage, then a length fallback).

## Hard Constraints

- **stdout discipline**: On the stdio transport, stdout carries the MCP protocol
  stream. Nothing may be written to stdout before `notifications/initialized`,
  including warm-up log events. Diagnostic output must go through the MCP
  logging channel or stderr, never bare `console.log`.
- **Read-only**: The server performs no write, submit, or data-contribution
  operations against either upstream API.

## Testing

Tests live alongside the code they cover and run under Vitest. The suite covers
the cache, the HTTP client, the wiki API client, service ranking logic, domain
projections, and tool wiring. Add or update tests when changing behavior in any
of these areas.

## Doc Comments

Doc comments state what a method does and any facts a caller needs to use it
correctly. They do not record design rationale, history, or alternatives
considered.
