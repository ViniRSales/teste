package com.servify.backend.dto;

import java.time.LocalDateTime;

import com.servify.backend.enums.ConviteStatus;

public class ConviteResponseDTO {
    private Integer id;

    private String email;

    private Integer perfilId;

    private String perfilNome;

    private LocalDateTime dataExpiracao;

    private ConviteStatus status;

    /** {@code true} se o convite exige senha provisória do e-mail para concluir o cadastro. */
    private boolean exigeSenhaProvisoria;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Integer getPerfilId() {
        return perfilId;
    }

    public void setPerfilId(Integer perfilId) {
        this.perfilId = perfilId;
    }

    public String getPerfilNome() {
        return perfilNome;
    }

    public void setPerfilNome(String perfilNome) {
        this.perfilNome = perfilNome;
    }

    public LocalDateTime getDataExpiracao() {
        return dataExpiracao;
    }

    public void setDataExpiracao(LocalDateTime dataExpiracao) {
        this.dataExpiracao = dataExpiracao;
    }

    public ConviteStatus getStatus() {
        return status;
    }

    public void setStatus(ConviteStatus status) {
        this.status = status;
    }

    public boolean isExigeSenhaProvisoria() {
        return exigeSenhaProvisoria;
    }

    public void setExigeSenhaProvisoria(boolean exigeSenhaProvisoria) {
        this.exigeSenhaProvisoria = exigeSenhaProvisoria;
    }
}
