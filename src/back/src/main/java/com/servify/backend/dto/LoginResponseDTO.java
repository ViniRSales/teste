package com.servify.backend.dto;

public class LoginResponseDTO {
  private Long id;
  private Integer perfilId;
  private String perfilNome;
  /** "adm" | "colaborador" | "cliente" */
  private String cargo;
  private String nome;
  private String email;
  /** {@code true} se o usuário deve concluir o cadastro (fluxo de convite). */
  private boolean cadastroPendente;
  /** Token do convite ativo para a URL {@code /convite/{token}}; vazio quando não aplicável. */
  private String conviteToken;

  public LoginResponseDTO() {}

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
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

  public String getCargo() {
    return cargo;
  }

  public void setCargo(String cargo) {
    this.cargo = cargo;
  }

  public String getNome() {
    return nome;
  }

  public void setNome(String nome) {
    this.nome = nome;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public boolean isCadastroPendente() {
    return cadastroPendente;
  }

  public void setCadastroPendente(boolean cadastroPendente) {
    this.cadastroPendente = cadastroPendente;
  }

  public String getConviteToken() {
    return conviteToken;
  }

  public void setConviteToken(String conviteToken) {
    this.conviteToken = conviteToken;
  }
}

