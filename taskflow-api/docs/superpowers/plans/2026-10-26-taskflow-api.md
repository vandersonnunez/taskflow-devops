# TaskFlow API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Build a small Express API that lists, creates, and edits TaskFlow tasks using PostgreSQL and Docker Compose.

**Architecture:** Express route handlers call a small PostgreSQL repository using parameterized SQL. Docker Compose runs the API and PostgreSQL; an init script creates `public.tarefas` in the Compose database.

**Tech Stack:** Node.js, Express, `pg`, `cors`, `node:test`, Supertest, PostgreSQL 18, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-10-26-taskflow-api-design.md`

## Global Constraints

- Use Node.js and Express.
- PostgreSQL database: `taskflow`; table: `public.tarefas`.
- Task columns: `id`, `titulo`, `descricao`, `criado_em`, `atualizado_em`.
- Implement list, create, and edit only; do not add task deletion.
- Keep API and PostgreSQL in Docker Compose; expose PostgreSQL as host port `5433` to avoid the host-local PostgreSQL on `5432`.
- Read database and frontend-origin settings from environment variables; commit `.env.example`, not `.env`. Pass PostgreSQL credentials separately in Compose to preserve special characters in passwords; support `DATABASE_URL` as an alternative for other environments.
- Use parameterized SQL and return validation/database errors as JSON.

## Review Focus

- Blank or missing title returns 400; pin in Task 2's POST validation test.
- Title longer than 150 characters returns 400; pin in Task 2's POST validation test.
- Invalid task ID returns 400 and an unknown valid ID returns 404; pin in Task 2's GET/PUT tests.
- Empty task list returns 200 with `[]`; pin in Task 2's list test.
- Database failure returns a generic 500 without exposing credentials or SQL; pin in Task 2's error-handler test.

---

### Task 1: Scaffold API and PostgreSQL schema

**Files:**
- Create: `taskflow-api/package.json`
- Create: `taskflow-api/.gitignore`
- Create: `taskflow-api/.env.example`
- Create: `taskflow-api/src/app.js`
- Create: `taskflow-api/src/server.js`
- Create: `taskflow-api/src/db.js`
- Create: `taskflow-api/src/repositories/tarefas.js`
- Create: `taskflow-api/db/init.sql`
- Test: `taskflow-api/test/tarefas.test.js`

**Interfaces:**
- `createApp({ repository })` returns an Express app for tests and server startup.
- `createTarefasRepository(pool)` produces `listar()` in Task 1; Task 2 adds `buscarPorId(id)`, `criar({ titulo, descricao })`, and `atualizar(id, { titulo, descricao })` after their behavior tests are written.

- [x] Step 1: Add a test proving `GET /api/tarefas` returns an empty JSON array through an injected repository.
- [x] Step 2: Run `npm test`; confirm the route is missing and the test fails.
- [x] Step 3: Create the package scripts, app factory, database pool, repository interface, and minimal schema with the exact columns in the spec.
- [x] Step 4: Run `npm test`; confirm the list test passes.

### Task 2: Implement task routes, validation, and errors

**Files:**
- Modify: `taskflow-api/src/app.js`
- Modify: `taskflow-api/src/repositories/tarefas.js`
- Test: `taskflow-api/test/tarefas.test.js`

**Interfaces:**
- `GET /api/tarefas` returns an array ordered by `criado_em DESC, id DESC`.
- `GET /api/tarefas/:id` returns one task or 404.
- `POST /api/tarefas` accepts `{ "titulo": string, "descricao"?: string | null }` and returns 201 with the created task.
- `PUT /api/tarefas/:id` accepts the same editable fields, updates `atualizado_em`, and returns 200 with the task or 404.
- Invalid IDs and invalid task bodies return 400; unexpected errors return a generic JSON 500.

- [x] Step 1: Add failing tests for successful GET-by-ID, POST, and PUT, plus blank/overlong title, malformed ID, missing task, and repository failure.
- [x] Step 2: Run `npm test`; confirm the new tests fail for missing behavior.
- [x] Step 3: Implement route validation and parameterized repository SQL; normalize omitted `descricao` to null on create and edit.
- [x] Step 4: Run `npm test`; confirm all route tests pass.

### Task 3: Containerize and document local use

**Files:**
- Create: `taskflow-api/Dockerfile`
- Create: `taskflow-api/compose.yaml`
- Create: `taskflow-api/README.md`
- Modify: `taskflow-api/.env.example`

**Interfaces:**
- Compose services: `api` and `db`.
- API connects to the database service at `db:5432` using PostgreSQL connection environment variables; host access to PostgreSQL uses `localhost:5433`.
- The database service uses PostgreSQL 18, a persistent volume, and `db/init.sql` for first-time schema creation.

- [x] Step 1: Write the Dockerfile and Compose file with a PostgreSQL health check, API startup after the database is healthy, and environment-based credentials.
- [ ] Step 2: Run `docker compose config`; confirm the configuration parses.
- [x] Step 3: Document setup, `docker compose up --build`, API routes, and pgAdmin connection to port 5433.
- [ ] Step 4: Run `docker compose up --build` and perform a manual POST, GET, and PUT smoke check against the running API.

**Environment note:** `compose.yaml` parses as YAML, but this workspace has no Docker CLI/engine. Steps 2 and 4 still need to be run on a computer with Docker Desktop.

## Self-review

- Spec coverage: route behavior, validation, database schema, timestamps, JSON errors, automated API tests, Docker Compose, and local setup are assigned to Tasks 1-3.
- Interface consistency: route methods and repository method names are fixed above and shared between Tasks 1 and 2.
- Scope: no delete, authentication, or extra task fields.
- Runtime data: Compose uses a fresh PostgreSQL service; the host-local pgAdmin database is left untouched.
