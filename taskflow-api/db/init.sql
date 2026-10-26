CREATE TABLE IF NOT EXISTS public.tarefas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    prioridade VARCHAR(10) NOT NULL DEFAULT 'media',
    data_vencimento DATE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT tarefas_titulo_nao_vazio
        CHECK (LENGTH(TRIM(titulo)) > 0),

    CONSTRAINT tarefas_status_valido
        CHECK (status IN ('pendente', 'em_andamento', 'concluida')),

    CONSTRAINT tarefas_prioridade_valida
        CHECK (prioridade IN ('baixa', 'media', 'alta'))
);