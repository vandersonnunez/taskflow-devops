import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';

const STATUS_VALIDOS = new Set([
  'pendente',
  'em_andamento',
  'concluida'
]);

const PRIORIDADES_VALIDAS = new Set([
  'baixa',
  'media',
  'alta'
]);

export function createApp({
  repository,
  frontendOrigin = process.env.FRONTEND_ORIGIN,
  logger = console
}) {
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

  app.use(
  express.static(
    fileURLToPath(new URL('../public/', import.meta.url))
  )
);

  // Verifica se a API consegue acessar o banco.
  app.get('/health', async (request, response) => {
    try {
      await repository.verificarConexao();

      return response.json({
        status: 'ok',
        database: 'ok'
      });
    } catch (error) {
      logError(logger, request, error, 503);

      return response.status(503).json({
        status: 'unavailable',
        database: 'unavailable'
      });
    }
  });

  // Lista todas as tarefas.
  app.get('/api/tarefas', async (_request, response) => {
    const tarefas = await repository.listar();
    return response.json(tarefas);
  });

  // Busca uma tarefa pelo ID.
  app.get('/api/tarefas/:id', async (request, response) => {
    if (!isValidId(request.params.id)) {
      return response.status(400).json({ erro: 'ID inválido' });
    }

    const tarefa = await repository.buscarPorId(request.params.id);

    if (!tarefa) {
      return response.status(404).json({
        erro: 'Tarefa não encontrada'
      });
    }

    return response.json(tarefa);
  });

  // Cadastra uma tarefa.
  app.post('/api/tarefas', async (request, response) => {
    const input = validateTask(request.body);
    const mensagem = validationMessage(input);

    if (mensagem) {
      return response.status(400).json({ erro: mensagem });
    }

    const tarefa = await repository.criar(input.values);

    return response.status(201).json(tarefa);
  });

  // Atualiza uma tarefa.
  app.put('/api/tarefas/:id', async (request, response) => {
    if (!isValidId(request.params.id)) {
      return response.status(400).json({ erro: 'ID inválido' });
    }

    const input = validateTask(request.body);
    const mensagem = validationMessage(input);

    if (mensagem) {
      return response.status(400).json({ erro: mensagem });
    }

    const tarefa = await repository.atualizar(
      request.params.id,
      input.values
    );

    if (!tarefa) {
      return response.status(404).json({
        erro: 'Tarefa não encontrada'
      });
    }

    return response.json(tarefa);
  });

  // Exclui uma tarefa.
  app.delete('/api/tarefas/:id', async (request, response) => {
    if (!isValidId(request.params.id)) {
      return response.status(400).json({ erro: 'ID inválido' });
    }

    const removida = await repository.remover(request.params.id);

    if (!removida) {
      return response.status(404).json({
        erro: 'Tarefa não encontrada'
      });
    }

    return response.status(204).end();
  });

  app.use('/api', (_request, response) => {
    return response.status(404).json({
      erro: 'Rota não encontrada'
    });
  });

  // Tratamento centralizado de erros.
  app.use((error, request, response, _next) => {
    if (response.headersSent) return;

    const status = error.type === 'entity.parse.failed' ? 400 : 500;

    logError(logger, request, error, status);

    if (error.type === 'entity.parse.failed') {
      return response.status(400).json({ erro: 'JSON inválido' });
    }

    return response.status(500).json({
      erro: 'Erro interno do servidor'
    });
  });

  return app;
}

function validateTask(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }

  const { titulo, descricao } = body;

  if (
    typeof titulo !== 'string'
    || titulo.trim().length === 0
    || Array.from(titulo).length > 150
  ) {
    return null;
  }

  if (
    descricao !== undefined
    && descricao !== null
    && typeof descricao !== 'string'
  ) {
    return { invalidDescription: true };
  }

  const values = {
    titulo: titulo.trim(),
    descricao: descricao ?? null
  };

  if (Object.hasOwn(body, 'status')) {
    if (
      typeof body.status !== 'string'
      || !STATUS_VALIDOS.has(body.status)
    ) {
      return { invalidStatus: true };
    }

    values.status = body.status;
  }

  if (Object.hasOwn(body, 'prioridade')) {
    if (
      typeof body.prioridade !== 'string'
      || !PRIORIDADES_VALIDAS.has(body.prioridade)
    ) {
      return { invalidPriority: true };
    }

    values.prioridade = body.prioridade;
  }

  if (Object.hasOwn(body, 'data_vencimento')) {
    const data = body.data_vencimento;

    if (data === null || data === '') {
      values.data_vencimento = null;
    } else if (typeof data === 'string' && isValidDateOnly(data)) {
      values.data_vencimento = data;
    } else {
      return { invalidDueDate: true };
    }
  }

  return { values };
}

function validationMessage(input) {
  if (!input) {
    return 'Título obrigatório (até 150 caracteres)';
  }

  if (input.invalidDescription) {
    return 'Descrição deve ser texto ou nula';
  }

  if (input.invalidStatus) {
    return 'Status inválido: use pendente, em_andamento ou concluida';
  }

  if (input.invalidPriority) {
    return 'Prioridade inválida: use baixa, media ou alta';
  }

  if (input.invalidDueDate) {
    return 'Data de vencimento inválida: use AAAA-MM-DD ou nulo';
  }

  return null;
}

function isValidDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime())
    && date.toISOString().slice(0, 10) === value
  );
}

function isValidId(id) {
  if (!/^[1-9]\d*$/.test(id)) return false;

  try {
    return BigInt(id) <= 9223372036854775807n;
  } catch {
    return false;
  }
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
      ...(error?.code ? { code: error.code } : {})
    }
  }));
}
