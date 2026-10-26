BEGIN;

ALTER TABLE public.tarefas
    ADD COLUMN IF NOT EXISTS status VARCHAR(20)
        NOT NULL DEFAULT 'pendente',
    ADD COLUMN IF NOT EXISTS prioridade VARCHAR(10)
        NOT NULL DEFAULT 'media',
    ADD COLUMN IF NOT EXISTS data_vencimento DATE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tarefas_status_valido'
          AND conrelid = 'public.tarefas'::regclass
    ) THEN
        ALTER TABLE public.tarefas
            ADD CONSTRAINT tarefas_status_valido
            CHECK (
                status IN (
                    'pendente',
                    'em_andamento',
                    'concluida'
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tarefas_prioridade_valida'
          AND conrelid = 'public.tarefas'::regclass
    ) THEN
        ALTER TABLE public.tarefas
            ADD CONSTRAINT tarefas_prioridade_valida
            CHECK (
                prioridade IN ('baixa', 'media', 'alta')
            );
    END IF;
END $$;

COMMIT;