package com.servify.backend.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record AgendaDisponibilidadeResponseDTO(
        Long id,

        Long colaboradorId,

        String colaboradorNome,

        DayOfWeek diaSemana,

        boolean disponivel,

        LocalTime horaInicio,

        LocalTime horaFim) {
}
