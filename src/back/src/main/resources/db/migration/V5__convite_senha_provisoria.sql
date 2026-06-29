-- Senha provisória (hash BCrypt) gerada no convite para primeiro acesso; o valor em claro é enviado apenas por e-mail.
ALTER TABLE convite
    ADD COLUMN senha_provisoria_hash VARCHAR(255);
