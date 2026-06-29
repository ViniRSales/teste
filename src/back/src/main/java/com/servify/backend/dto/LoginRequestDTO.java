package com.servify.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequestDTO {
  @NotBlank
  private String login;

  @NotBlank
  private String senha;

  public LoginRequestDTO() {}

  public String getLogin() {
    return login;
  }

  public void setLogin(String login) {
    this.login = login;
  }

  public String getSenha() {
    return senha;
  }

  public void setSenha(String senha) {
    this.senha = senha;
  }
}

