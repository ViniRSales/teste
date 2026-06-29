-- Usuário root com perfil Administrador (perfil.id = 1). Senha em texto: 123456 (BCrypt $2a$10$, compatível com BCryptPasswordEncoder do Spring).
INSERT INTO usuario (
    perfil_id,
    cpf,
    nome,
    email,
    senha,
    telefone,
    data_nascimento,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    uf
)
SELECT
    1,
    '99999999999',
    'Administrador',
    'root@servify.local',
    '$2a$10$csPZ0nI8UwK6rSwSc/sbTOjKWFpE3dNlhjPC1rxMIAS0HkR05MuBS',
    '11999999999',
    DATE '1990-01-01',
    '00000000',
    'N/A',
    '0',
    NULL,
    'Centro',
    'Sao Paulo',
    'SP'
WHERE NOT EXISTS (
    SELECT 1 FROM usuario u WHERE u.email = 'root@servify.local' OR u.cpf = '99999999999'
);
