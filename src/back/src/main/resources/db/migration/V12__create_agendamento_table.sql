CREATE TABLE agendamento (
    id BIGSERIAL PRIMARY KEY,
    agendamento_status VARCHAR(30) NOT NULL,
    cliente_id BIGINT NOT NULL,
    colaborador_id BIGINT NOT NULL,
    servico_id BIGINT NOT NULL,
    data_hora TIMESTAMP NOT NULL,
    duracao_minutos INTEGER NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    desconto NUMERIC(10,2) NOT NULL,
    comissao NUMERIC(5,4) NOT NULL,

    CONSTRAINT fk_agendamento_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES usuario(id),

    CONSTRAINT fk_agendamento_colaborador
        FOREIGN KEY (colaborador_id)
        REFERENCES usuario(id),

    CONSTRAINT fk_agendamento_servico
        FOREIGN KEY (servico_id)
        REFERENCES servico(id)
);