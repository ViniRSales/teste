ALTER TABLE comissao
ADD CONSTRAINT uk_comissao_usuario
UNIQUE (usuario_id);

INSERT INTO comissao (usuario_id, valor)
SELECT u.id, 0.0000
FROM usuario u
WHERE u.perfil_id = 2
AND NOT EXISTS (
    SELECT 1
    FROM comissao c
    WHERE c.usuario_id = u.id
);