ALTER TABLE comissao
    DROP CONSTRAINT fk_comissao_usuario;

ALTER TABLE comissao
    ADD CONSTRAINT fk_comissao_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuario(id)
        ON DELETE CASCADE;