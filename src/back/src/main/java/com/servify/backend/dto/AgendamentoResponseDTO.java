package com.servify.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AgendamentoResponseDTO(

        Long id,

        String status,

        Long clienteId,
        String clienteNome,

        Long colaboradorId,
        String colaboradorNome,

        Long servicoId,
        String servicoNome,

        LocalDateTime dataHora,

        Integer duracaoMinutos,

        BigDecimal valor,

        BigDecimal desconto,

        BigDecimal valorFinal,

        BigDecimal comissao

) {
}