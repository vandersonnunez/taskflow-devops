import cors from 'cors';
import express from 'express';

export function createApp({ repository, frontendOrigin = process.env.FRONTEND_ORIGIN, logger = console }) {
  if (
    !repository
    || typeof repository.verificarConexao !== 'function'
    || typeof repository.listar !== 'function'
    || typeof repository.buscarPorId !== 'function'
    || typeof repository.criar !== 'function'
    || typeof repository.atualizar !== 'function'
    || typeof repository.remover !== 'function'
  ) {
    throw new TypeError('createApp requires a complete tarefas repository');
  }
  if (!logger || typeof logger.error !== 'function') {
    throw new TypeError('createApp requires a logger with an error method');
  }

  const app = express();

  app.use(cors({ origin: frontendOrigin || true }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', async (request, response) => {
    try {
      await repository.verificarConexao();
      return response.json({ status: 'ok', database: 'ok' });
    } catch (error) {
      logError(logger, request, error, 503);
      return response.status(503).json({ status: 'unavailable', database: 'unavailable' });
    }
  });

  app.get('/api/tarefas/:id', async (request, response) => {
    if (!isValidId(request.params.id)) {
      return response.status(400).json({ erro: 'ID inválido' });
    }

    const tarefa = await repository.buscarPorId(request.params.id);
    if (!tarefa) {
      return response.status(404).json({ erro: 'Tarefa não encontrada' });
    }

    return response.json(tarefa);
  });

  app.get('/api/tarefas', async (_request, response) => {
    const tarefas = await repository.listar();
    return response.json(tarefas);
  });

  app.post('/api/tarefas', async (request, response) => {
    const input = validateTask(request.body);
    if (!input) {
      return response.status(400).json({ erro: 'Título obrigatório (até 150 caracteres)' });
    }

    if (input.invalidDescription) {
      return response.status(400).json({ erro: 'Descrição deve ser texto ou nula' });
    }

    const tarefa = await repository.criar(input.values);
    return response.status(201).json(tarefa);
  });

  app.put('/api/tarefas/:id', async (request, response) => {
    if (!isValidId(request.params.id)) {
      return response.status(400).json({ erro: 'ID inválido' });
    }

    const input = validateTask(request.body);
    if (!input) {
      return response.status(400).json({ erro: 'Título obrigatório (até 150 caracteres)' });
    }

    if (input.invalidDescription) {
      return response.status(400).json({ erro: 'Descrição deve ser texto ou nula' });
    }

    const tarefa = await repository.atualizar(request.params.id, input.values);
    if (!tarefa) {
      return response.status(404).json({ erro: 'Tarefa não encontrada' });
    }

    return response.json(tarefa);
  });

  app.delete('/api/tarefas/:id', async (request, response) => {
    if (!isValidId(request.params.id)) {
      return response.status(400).json({ erro: 'ID inválido' });
    }

    const removida = await repository.remover(request.params.id);
    if (!removida) {
      return response.status(404).json({ erro: 'Tarefa não encontrada' });
    }

    return response.status(204).end();
  });

  app.use('/api', (_request, response) => {
    return response.status(404).json({ erro: 'Rota não encontrada' });
  });

  app.use((error, request, response, _next) => {
    if (response.headersSent) return;

    const status = error.type === 'entity.parse.failed' ? 400 : 500;
    logError(logger, request, error, status);

    if (error.type === 'entity.parse.failed') {
      return response.status(400).json({ erro: 'JSON inválido' });
    }

    return response.status(500).json({ erro: 'Erro interno do servidor' });
  });

  return app;
}

function logError(logger, request, error, status) {
  logger.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    method: request.method,
    path: request.path,
    status,
    error: {
      name: error?.name ?? 'Error',
      message: error?.message ?? 'Unknown error',
      ...(error?.code ? { code: error.code } : {}),
    },
  }));
}

function isValidId(id) {
  if (!/^[1-9]\d*$/.test(id)) return false;

  try {
    return BigInt(id) <= 9223372036854775807n;
  } catch {
    return false;
  }
}

function validateTask(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;

  const { titulo, descricao } = body;
  if (typeof titulo !== 'string' || titulo.trim().length === 0 || Array.from(titulo).length > 150) {
    return null;
  }

  if (descricao !== undefined && descricao !== null && typeof descricao !== 'string') {
    return { invalidDescription: true };
  }

  return {
    values: {
      titulo: titulo.trim(),
      descricao: descricao ?? null,
    },
  };
}
