package com.servify.backend.dto;

import java.math.BigDecimal;

public class ColaboradorComissaoDTO {
    private Long usuarioId;
    private String usuarioNome;
    private Long comissaoId;
    private BigDecimal valor;

    public ColaboradorComissaoDTO() {
    }

    public ColaboradorComissaoDTO(
            Long usuarioId,
            String usuarioNome,
            Long comissaoId,
            BigDecimal valor) {

        this.usuarioId = usuarioId;
        this.usuarioNome = usuarioNome;
        this.comissaoId = comissaoId;
        this.valor = valor;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public String getUsuarioNome() {
        return usuarioNome;
    }

    public Long getComissaoId() {
        return comissaoId;
    }

    public BigDecimal getValor() {
        return valor;
    }
}
