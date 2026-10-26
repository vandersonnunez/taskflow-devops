import { createApp } from './app.js';
import { createPool } from './db.js';
import { createTarefasRepository } from './repositories/tarefas.js';

const port = Number.parseInt(process.env.API_PORT ?? '3000', 10);
const pool = createPool();
const app = createApp({ repository: createTarefasRepository(pool) });
const server = app.listen(port, () => {
  console.log(`TaskFlow API listening on port ${port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down TaskFlow API`);
  try {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await pool.end();
  } catch {
    console.error('Could not shut down the TaskFlow API cleanly');
    process.exitCode = 1;
  }
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
