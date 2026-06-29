CREATE TABLE agenda_disponibilidade (
    id BIGSERIAL PRIMARY KEY,

    colaborador_id BIGINT NOT NULL,

    dia_semana VARCHAR(20) NOT NULL,

    disponivel BOOLEAN NOT NULL,

    hora_inicio TIME NOT NULL,

    hora_fim TIME NOT NULL,

    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_agenda_disponibilidade
        FOREIGN KEY (colaborador_id)
        REFERENCES usuario(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_disponibilidade_dia
        UNIQUE (colaborador_id, dia_semana)
);