-- Indica usuário criado pelo convite aguardando preenchimento de dados reais
ALTER TABLE usuario
    ADD COLUMN IF NOT EXISTS cadastro_pendente BOOLEAN NOT NULL DEFAULT FALSE;
