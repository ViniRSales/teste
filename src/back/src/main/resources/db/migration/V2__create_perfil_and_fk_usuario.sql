-- Tabela de perfis (idempotente)
CREATE TABLE IF NOT EXISTS perfil (
    id        BIGSERIAL PRIMARY KEY,
    nome      VARCHAR(50) NOT NULL,
    CONSTRAINT uk_perfil_nome UNIQUE (nome)
);

-- Seeds (idempotente)
INSERT INTO perfil (id, nome) VALUES
    (1, 'Administrador'),
    (2, 'Colaborador'),
    (3, 'Cliente')
ON CONFLICT (id) DO NOTHING;

-- Garante coluna na tabela usuario (idempotente)
ALTER TABLE IF EXISTS usuario
    ADD COLUMN IF NOT EXISTS perfil_id INTEGER;

-- FK usuario(perfil_id) -> perfil(id) (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        WHERE c.conname = 'fk_usuario_perfil'
    ) THEN
        ALTER TABLE usuario
            ADD CONSTRAINT fk_usuario_perfil
            FOREIGN KEY (perfil_id)
            REFERENCES perfil (id);
    END IF;
END $$;

