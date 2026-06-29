package com.servify.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record AgendamentoRequestDTO(

        @NotNull Long clienteId,

        @NotNull Long colaboradorId,

        @NotNull Long servicoId,

        @NotNull LocalDateTime dataHora,

        @NotNull @DecimalMin("0.00") BigDecimal desconto

) {
}