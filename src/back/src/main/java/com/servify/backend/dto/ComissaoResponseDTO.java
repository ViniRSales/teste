package com.servify.backend.dto;

import java.math.BigDecimal;

public record ComissaoResponseDTO(
        Long id,
        Long usuarioId,
        String usuarioNome,
        BigDecimal valor

) {
}
