# TaskFlow API Design

## Goal
Build the backend for TaskFlow so the website can list, register, and edit tasks.

## Chosen approach
Use Node.js with Express and the `pg` driver, with SQL queries against PostgreSQL. Run both the API and PostgreSQL through Docker Compose. This matches the project brief; the PostgreSQL instance already opened in pgAdmin on the host is separate from the Compose database. The Compose database will use port 5433 on the host so it does not conflict with the local PostgreSQL port. Docker passes the database host, port, user, password, and database as separate environment variables so special characters in a password stay intact; the API also supports `DATABASE_URL` for other environments.

## API contract
- `GET /api/tarefas` returns all tasks, newest first.
- `GET /api/tarefas/:id` returns one task or 404.
- `POST /api/tarefas` creates a task and returns 201.
- `PUT /api/tarefas/:id` edits a task and returns 200, or 404 if missing.
- No delete route.
- JSON uses `titulo` and `descricao`; `titulo` is required, non-blank, and at most 150 characters. `descricao` may be null.
- Responses include `id`, `titulo`, `descricao`, `criado_em`, and `atualizado_em`. Updates refresh `atualizado_em`.

## Database
The Compose database is `taskflow`; its table is `public.tarefas` with an identity `id`, required `titulo`, optional `descricao`, and creation/update timestamps. The init SQL creates this schema on first startup. No user, priority, deadline, or task-status tables/columns are included in this first version.

## Error handling and tests
Return 400 for invalid input, 404 for missing tasks, and a generic 500 response for unexpected server/database errors. Add automated API tests for success and failure cases. Keep SQL parameterized.

## Non-goals
No frontend, authentication, task deletion, deployment, or migration of data from the host-local PostgreSQL instance.
