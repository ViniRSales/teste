INSERT INTO agenda_disponibilidade (
    colaborador_id,
    dia_semana,
    disponivel,
    hora_inicio,
    hora_fim
)
SELECT
    u.id,
    dias.dia_semana,
    dias.dia_semana <> 'SUNDAY',
    TIME '08:00',
    TIME '18:00'
FROM usuario u
CROSS JOIN (
    VALUES
        ('MONDAY'),
        ('TUESDAY'),
        ('WEDNESDAY'),
        ('THURSDAY'),
        ('FRIDAY'),
        ('SATURDAY'),
        ('SUNDAY')
) AS dias(dia_semana)
WHERE u.perfil_id = 2
ON CONFLICT (colaborador_id, dia_semana) DO NOTHING;
