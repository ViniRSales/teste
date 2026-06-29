CREATE TABLE convite (

    id BIGSERIAL PRIMARY KEY,

    email VARCHAR(150) NOT NULL,

    perfil_id BIGINT NOT NULL,

    token VARCHAR(36) NOT NULL UNIQUE,

    data_criacao TIMESTAMP NOT NULL,

    data_expiracao TIMESTAMP NOT NULL,

    status VARCHAR(20) NOT NULL,

    CONSTRAINT fk_convite_perfil
        FOREIGN KEY (perfil_id)
        REFERENCES perfil(id)
);