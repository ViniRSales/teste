CREATE TABLE IF NOT EXISTS usuario (
    id               BIGSERIAL PRIMARY KEY,
    bairro           VARCHAR(100)  NOT NULL,
    cep              VARCHAR(8)    NOT NULL,
    cidade           VARCHAR(100)  NOT NULL,
    complemento      VARCHAR(100),
    cpf              VARCHAR(11)   NOT NULL,
    data_nascimento  DATE          NOT NULL,
    email            VARCHAR(150)  NOT NULL,
    logradouro       VARCHAR(150)  NOT NULL,
    nome             VARCHAR(150)  NOT NULL,
    numero           VARCHAR(10)   NOT NULL,
    perfil_id        INTEGER,
    senha            VARCHAR(150)  NOT NULL,
    telefone         VARCHAR(11)   NOT NULL,
    uf               VARCHAR(2)    NOT NULL,
    CONSTRAINT uk_usuario_cpf   UNIQUE (cpf),
    CONSTRAINT uk_usuario_email UNIQUE (email)
);
