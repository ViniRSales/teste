package com.servify.backend.dto;

import java.math.BigDecimal;

public class ServicoResponseDTO {

    private Long id;
    private String nome;
    private BigDecimal valor;
    private Integer duracaoMinutos;
    private String icone;
    private boolean ativo;

    public ServicoResponseDTO() {
    }

    public ServicoResponseDTO(
            Long id,
            String nome,
            BigDecimal valor,
            Integer duracaoMinutos,
            String icone,
            boolean ativo) {
        this.id = id;
        this.nome = nome;
        this.valor = valor;
        this.duracaoMinutos = duracaoMinutos;
        this.icone = icone;
        this.ativo = ativo;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }

    public Integer getDuracaoMinutos() {
        return duracaoMinutos;
    }

    public void setDuracaoMinutos(Integer duracaoMinutos) {
        this.duracaoMinutos = duracaoMinutos;
    }

    public String getIcone() {
        return icone;
    }

    public void setIcone(String icone) {
        this.icone = icone;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }
}
