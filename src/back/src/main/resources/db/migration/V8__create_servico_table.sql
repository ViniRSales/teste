CREATE TABLE IF NOT EXISTS servico (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    duracao_minutos INTEGER NOT NULL,
    icone VARCHAR(40) NOT NULL DEFAULT 'scissors',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_servico_valor CHECK (valor > 0),
    CONSTRAINT chk_servico_duracao CHECK (duracao_minutos > 0)
);

CREATE INDEX IF NOT EXISTS idx_servico_nome ON servico (LOWER(nome));
