package com.servify.backend.dto;

import java.time.LocalTime;

import jakarta.validation.constraints.NotNull;

public record AgendaDisponibilidadeRequestDTO(

        @NotNull Boolean disponivel,

        @NotNull LocalTime horaInicio,

        @NotNull LocalTime horaFim) {
}