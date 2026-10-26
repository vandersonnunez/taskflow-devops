export function createTarefasRepository(pool) {
  if (!pool || typeof pool.query !== 'function') {
    throw new TypeError('createTarefasRepository requires a PostgreSQL pool');
  }

  return {
    async verificarConexao() {
      await pool.query('SELECT 1');
    },

    async listar() {
      const { rows } = await pool.query(`
        SELECT id, titulo, descricao, criado_em, atualizado_em
        FROM public.tarefas
        ORDER BY criado_em DESC, id DESC
      `);

      return rows;
    },

    async buscarPorId(id) {
      const { rows } = await pool.query(`
        SELECT id, titulo, descricao, criado_em, atualizado_em
        FROM public.tarefas
        WHERE id = $1
      `, [id]);

      return rows[0] ?? null;
    },

    async criar({ titulo, descricao }) {
      const { rows } = await pool.query(`
        INSERT INTO public.tarefas (titulo, descricao)
        VALUES ($1, $2)
        RETURNING id, titulo, descricao, criado_em, atualizado_em
      `, [titulo, descricao]);

      return rows[0];
    },

    async atualizar(id, { titulo, descricao }) {
      const { rows } = await pool.query(`
        UPDATE public.tarefas
        SET titulo = $1,
            descricao = $2,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING id, titulo, descricao, criado_em, atualizado_em
      `, [titulo, descricao, id]);

      return rows[0] ?? null;
    },

    async remover(id) {
      const { rowCount } = await pool.query(`
        DELETE FROM public.tarefas
        WHERE id = $1
      `, [id]);

      return rowCount > 0;
    },
  };
}
