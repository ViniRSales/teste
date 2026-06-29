package com.servify.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ServicoRequestDTO {

    @NotBlank(message = "Informe o nome do serviço.")
    @Size(max = 120, message = "Nome do serviço deve ter no máximo 120 caracteres.")
    private String nome;

    @NotNull(message = "Informe o valor do serviço.")
    @DecimalMin(value = "0.01", message = "Valor deve ser maior que zero.")
    @Digits(integer = 8, fraction = 2, message = "Valor inválido.")
    private BigDecimal valor;

    @NotNull(message = "Informe a duração em minutos.")
    @Min(value = 1, message = "Duração deve ser maior que zero.")
    private Integer duracaoMinutos;

    @NotBlank(message = "Selecione um ícone.")
    @Size(max = 40, message = "Ícone inválido.")
    private String icone;

    @NotNull(message = "Informe o status.")
    private Boolean ativo;

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

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }
}
