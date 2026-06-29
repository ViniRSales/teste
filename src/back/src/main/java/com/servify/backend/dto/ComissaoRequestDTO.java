package com.servify.backend.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record ComissaoRequestDTO(
        @NotNull 
        Long usuarioId,

        @NotNull 
        @DecimalMin(value = "0.0000") 
        @DecimalMax(value = "1.0000") 
        BigDecimal valor
) {
}