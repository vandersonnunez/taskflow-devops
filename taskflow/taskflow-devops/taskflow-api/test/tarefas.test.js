import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getPoolConfig } from '../src/db.js';
import { createTarefasRepository } from '../src/repositories/tarefas.js';

const tarefa = {
  id: '7',
  titulo: 'Organizar entregas',
  descricao: 'Separar tarefas da semana',
  criado_em: '2026-10-26T00:00:00.000Z',
  atualizado_em: '2026-10-26T00:00:00.000Z',
};

function createTestApi(overrides = {}, logger = { error() {} }) {
  const repository = {
    verificarConexao: async () => undefined,
    listar: async () => [],
    buscarPorId: async () => null,
    criar: async ({ titulo, descricao }) => ({ ...tarefa, titulo, descricao }),
    atualizar: async (_id, { titulo, descricao }) => ({ ...tarefa, titulo, descricao }),
    remover: async () => false,
    ...overrides,
  };

  return { app: createApp({ repository, logger }), repository };
}

test('GET /health reports when the API and database are available', async () => {
  const { app } = createTestApi();
  const response = await request(app).get('/health');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok', database: 'ok' });
});

test('GET /health returns 503 and logs when the database is unavailable', async () => {
  const logs = [];
  const logger = { error: (entry) => logs.push(JSON.parse(entry)) };
  const { app } = createTestApi({
    verificarConexao: async () => {
      throw new Error('database offline');
    },
  }, logger);
  const response = await request(app).get('/health');

  assert.equal(response.status, 503);
  assert.deepEqual(response.body, { status: 'unavailable', database: 'unavailable' });
  assert.equal(logs.length, 1);
  assert.equal(logs[0].path, '/health');
  assert.equal(logs[0].status, 503);
  assert.equal(logs[0].error.message, 'database offline');
});

test('GET /api/tarefas returns an empty JSON array', async () => {
  const { app } = createTestApi();
  const response = await request(app).get('/api/tarefas');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, []);
});

test('GET /api/tarefas/:id returns the matching task', async () => {
  const { app } = createTestApi({ buscarPorId: async () => tarefa });
  const response = await request(app).get('/api/tarefas/7');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, tarefa);
});

test('GET /api/tarefas/:id rejects malformed IDs', async () => {
  const { app } = createTestApi();
  const response = await request(app).get('/api/tarefas/abc');

  assert.equal(response.status, 400);
  assert.equal(response.body.erro, 'ID inválido');
});

test('GET /api/tarefas/:id returns 404 when the task does not exist', async () => {
  const { app } = createTestApi();
  const response = await request(app).get('/api/tarefas/404');

  assert.equal(response.status, 404);
  assert.equal(response.body.erro, 'Tarefa não encontrada');
});

test('POST /api/tarefas creates a task and defaults description to null', async () => {
  const calls = [];
  const { app } = createTestApi({
    criar: async (input) => {
      calls.push(input);
      return { ...tarefa, ...input };
    },
  });
  const response = await request(app)
    .post('/api/tarefas')
    .send({ titulo: 'Organizar entregas' });

  assert.equal(response.status, 201);
  assert.deepEqual(response.body, { ...tarefa, titulo: 'Organizar entregas', descricao: null });
  assert.deepEqual(calls, [{ titulo: 'Organizar entregas', descricao: null }]);
});

test('POST /api/tarefas rejects a blank title', async () => {
  const { app } = createTestApi();
  const response = await request(app).post('/api/tarefas').send({ titulo: '   ' });

  assert.equal(response.status, 400);
  assert.equal(response.body.erro, 'Título obrigatório (até 150 caracteres)');
});

test('POST /api/tarefas rejects a title longer than 150 characters', async () => {
  const { app } = createTestApi();
  const response = await request(app).post('/api/tarefas').send({ titulo: 'x'.repeat(151) });

  assert.equal(response.status, 400);
  assert.equal(response.body.erro, 'Título obrigatório (até 150 caracteres)');
});

test('POST /api/tarefas accepts 150 Unicode characters', async () => {
  const titulo = '📝'.repeat(150);
  const { app } = createTestApi();
  const response = await request(app).post('/api/tarefas').send({ titulo });

  assert.equal(response.status, 201);
  assert.equal(response.body.titulo, titulo);
});

test('POST /api/tarefas rejects a non-string description', async () => {
  const { app } = createTestApi();
  const response = await request(app)
    .post('/api/tarefas')
    .send({ titulo: 'Organizar entregas', descricao: { texto: 'inválido' } });

  assert.equal(response.status, 400);
  assert.equal(response.body.erro, 'Descrição deve ser texto ou nula');
});

test('PUT /api/tarefas/:id edits a task and defaults description to null', async () => {
  const calls = [];
  const { app } = createTestApi({
    atualizar: async (id, input) => {
      calls.push({ id, input });
      return { ...tarefa, ...input };
    },
  });
  const response = await request(app)
    .put('/api/tarefas/7')
    .send({ titulo: 'Revisar entregas' });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { ...tarefa, titulo: 'Revisar entregas', descricao: null });
  assert.deepEqual(calls, [{
    id: '7',
    input: { titulo: 'Revisar entregas', descricao: null },
  }]);
});

test('PUT /api/tarefas/:id rejects malformed IDs', async () => {
  const { app } = createTestApi();
  const response = await request(app).put('/api/tarefas/0').send({ titulo: 'Atualizar tarefa' });

  assert.equal(response.status, 400);
  assert.equal(response.body.erro, 'ID inválido');
});

test('PUT /api/tarefas/:id returns 404 when the task does not exist', async () => {
  const { app } = createTestApi({ atualizar: async () => null });
  const response = await request(app)
    .put('/api/tarefas/404')
    .send({ titulo: 'Atualizar tarefa' });

  assert.equal(response.status, 404);
  assert.equal(response.body.erro, 'Tarefa não encontrada');
});

test('DELETE /api/tarefas/:id deletes a task and returns no content', async () => {
  const calls = [];
  const { app } = createTestApi({
    remover: async (id) => {
      calls.push(id);
      return true;
    },
  });
  const response = await request(app).delete('/api/tarefas/7');

  assert.equal(response.status, 204);
  assert.equal(response.text, '');
  assert.deepEqual(calls, ['7']);
});

test('DELETE /api/tarefas/:id rejects malformed IDs', async () => {
  const { app } = createTestApi();
  const response = await request(app).delete('/api/tarefas/abc');

  assert.equal(response.status, 400);
  assert.equal(response.body.erro, 'ID inválido');
});

test('DELETE /api/tarefas/:id returns 404 when the task does not exist', async () => {
  const { app } = createTestApi({ remover: async () => false });
  const response = await request(app).delete('/api/tarefas/404');

  assert.equal(response.status, 404);
  assert.equal(response.body.erro, 'Tarefa não encontrada');
});

test('database errors return a generic JSON 500 response and are logged', async () => {
  const logs = [];
  const logger = { error: (entry) => logs.push(JSON.parse(entry)) };
  const { app } = createTestApi({
    listar: async () => {
      throw new Error('secret password and SQL details');
    },
  }, logger);
  const response = await request(app).get('/api/tarefas');

  assert.equal(response.status, 500);
  assert.deepEqual(response.body, { erro: 'Erro interno do servidor' });
  assert.doesNotMatch(JSON.stringify(response.body), /secret password|SQL details/);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].level, 'error');
  assert.equal(logs[0].path, '/api/tarefas');
  assert.equal(logs[0].status, 500);
  assert.match(logs[0].error.message, /secret password and SQL details/);
});

test('tarefas repository returns rows ordered by newest creation time', async () => {
  const expected = [{ ...tarefa, descricao: null }];
  const calls = [];
  const pool = {
    query: async (sql, values) => {
      calls.push({ sql, values });
      return { rows: expected };
    },
  };
  const repository = createTarefasRepository(pool);
  const tasks = await repository.listar();

  assert.deepEqual(tasks, expected);
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /ORDER BY criado_em DESC, id DESC/);
});

test('tarefas repository checks database connectivity with SELECT 1', async () => {
  const calls = [];
  const pool = {
    query: async (sql) => {
      calls.push(sql);
      return { rows: [{ '?column?': 1 }] };
    },
  };
  const repository = createTarefasRepository(pool);

  await repository.verificarConexao();

  assert.equal(calls.length, 1);
  assert.match(calls[0], /SELECT 1/);
});

test('tarefas repository uses parameterized SQL for lookup, insert, and update', async () => {
  const calls = [];
  const pool = {
    query: async (sql, values) => {
      calls.push({ sql, values });
      return { rows: [tarefa], rowCount: 1 };
    },
  };
  const repository = createTarefasRepository(pool);

  await repository.buscarPorId('7');
  await repository.criar({ titulo: 'Nova tarefa', descricao: null });
  await repository.atualizar('7', { titulo: 'Tarefa editada', descricao: 'Detalhes' });
  const deleted = await repository.remover('7');

  assert.equal(deleted, true);
  assert.equal(calls.length, 4);
  assert.match(calls[0].sql, /WHERE id = \$1/);
  assert.deepEqual(calls[0].values, ['7']);
  assert.match(calls[1].sql, /VALUES \(\$1, \$2\)/);
  assert.deepEqual(calls[1].values, ['Nova tarefa', null]);
  assert.match(calls[2].sql, /atualizado_em = CURRENT_TIMESTAMP/);
  assert.match(calls[2].sql, /WHERE id = \$3/);
  assert.deepEqual(calls[2].values, ['Tarefa editada', 'Detalhes', '7']);
  assert.match(calls[3].sql, /DELETE FROM public\.tarefas/);
  assert.match(calls[3].sql, /WHERE id = \$1/);
  assert.deepEqual(calls[3].values, ['7']);
});

test('tarefas repository reports when a delete did not find a task', async () => {
  const pool = { query: async () => ({ rowCount: 0 }) };
  const repository = createTarefasRepository(pool);

  assert.equal(await repository.remover('404'), false);
});

test('PostgreSQL config keeps passwords with URL-reserved characters intact', () => {
  const password = 'p@ss:/#?%word';
  const config = getPoolConfig({
    PGHOST: 'db',
    PGPORT: '5432',
    PGDATABASE: 'taskflow',
    PGUSER: 'taskflow',
    PGPASSWORD: password,
  });

  assert.deepEqual(config, {
    host: 'db',
    port: 5432,
    database: 'taskflow',
    user: 'taskflow',
    password,
  });
});
