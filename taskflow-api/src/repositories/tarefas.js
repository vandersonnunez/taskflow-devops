export function createTarefasRepository(pool) {
  if (!pool || typeof pool.query !== 'function') {
    throw new TypeError('createTarefasRepository requires a PostgreSQL pool');
  }

  const colunasTarefa = `
    id,
    titulo,
    descricao,
    status,
    prioridade,
    data_vencimento,
    criado_em,
    atualizado_em
  `;

  return {
    async verificarConexao() {
      await pool.query('SELECT 1');
    },

    async listar() {
      const { rows } = await pool.query(`
        SELECT ${colunasTarefa}
        FROM public.tarefas
        ORDER BY criado_em DESC, id DESC
      `);

      return rows;
    },

    async buscarPorId(id) {
      const { rows } = await pool.query(`
        SELECT ${colunasTarefa}
        FROM public.tarefas
        WHERE id = $1
      `, [id]);

      return rows[0] ?? null;
    },

    async criar(input) {
      const { titulo, descricao } = input;
      const possuiNovosCampos = [
        'status',
        'prioridade',
        'data_vencimento'
      ].some((campo) => Object.hasOwn(input, campo));

      if (!possuiNovosCampos) {
        const { rows } = await pool.query(`
          INSERT INTO public.tarefas (titulo, descricao)
          VALUES ($1, $2)
          RETURNING ${colunasTarefa}
        `, [titulo, descricao]);

        return rows[0];
      }

      const status = input.status ?? 'pendente';
      const prioridade = input.prioridade ?? 'media';
      const dataVencimento = Object.hasOwn(input, 'data_vencimento')
        ? input.data_vencimento
        : null;

      const { rows } = await pool.query(`
        INSERT INTO public.tarefas
          (titulo, descricao, status, prioridade, data_vencimento)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING ${colunasTarefa}
      `, [titulo, descricao, status, prioridade, dataVencimento]);

      return rows[0];
    },

    async atualizar(id, input) {
      const valores = [input.titulo, input.descricao];
      const atualizacoes = [
        'titulo = $1',
        'descricao = $2'
      ];

      const camposPermitidos = [
        'status',
        'prioridade',
        'data_vencimento'
      ];

      for (const campo of camposPermitidos) {
        if (Object.hasOwn(input, campo)) {
          valores.push(input[campo]);
          atualizacoes.push(`${campo} = $${valores.length}`);
        }
      }

      valores.push(id);

      const { rows } = await pool.query(`
        UPDATE public.tarefas
        SET ${atualizacoes.join(',\n            ')},
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $${valores.length}
        RETURNING ${colunasTarefa}
      `, valores);

      return rows[0] ?? null;
    },

    async remover(id) {
      const { rowCount } = await pool.query(`
        DELETE FROM public.tarefas
        WHERE id = $1
      `, [id]);

      return rowCount > 0;
    }
  };
}