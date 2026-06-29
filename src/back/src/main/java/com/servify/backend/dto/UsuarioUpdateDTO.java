package com.servify.backend.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UsuarioUpdateDTO {

    @NotNull
    private Integer perfilId;

    @NotBlank
    @Size(min = 5, max = 150)
    private String nome;

    @NotBlank
    @Email
    @Size(min = 5, max = 150)
    private String email;

    @NotBlank
    @Size(min = 10, max = 11)
    @Pattern(regexp = "^\\d+$", message = "Deve conter apenas dígitos")
    private String telefone;

    @NotNull
    private LocalDate dataNascimento;

    @NotBlank
    @Size(min = 8, max = 8)
    @Pattern(regexp = "^\\d+$", message = "Deve conter apenas dígitos")
    private String cep;

    @NotBlank
    @Size(min = 5, max = 150)
    private String logradouro;

    @NotBlank
    @Size(min = 1, max = 10)
    private String numero;

    @Size(max = 100)
    private String complemento;

    @NotBlank
    @Size(min = 3, max = 100)
    private String bairro;

    @NotBlank
    @Size(min = 3, max = 100)
    @Pattern(regexp = "^[A-Za-zÀ-ÿ\\s]+$", message = "Deve conter apenas letras")
    private String cidade;

    @NotBlank
    @Size(min = 2, max = 2)
    @Pattern(regexp = "^[A-Z]{2}$", message = "Deve conter apenas letras")
    private String uf;

    public UsuarioUpdateDTO() {
    }

    public Integer getPerfilId() {
        return perfilId;
    }

    public void setPerfilId(Integer perfilId) {
        this.perfilId = perfilId;
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

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public LocalDate getDataNascimento() {
        return dataNascimento;
    }

    public void setDataNascimento(LocalDate dataNascimento) {
        this.dataNascimento = dataNascimento;
    }

    public String getCep() {
        return cep;
    }

    public void setCep(String cep) {
        this.cep = cep;
    }

    public String getLogradouro() {
        return logradouro;
    }

    public void setLogradouro(String logradouro) {
        this.logradouro = logradouro;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getComplemento() {
        return complemento;
    }

    public void setComplemento(String complemento) {
        this.complemento = complemento;
    }

    public String getBairro() {
        return bairro;
    }

    public void setBairro(String bairro) {
        this.bairro = bairro;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public String getUf() {
        return uf;
    }

    public void setUf(String uf) {
        this.uf = uf;
    }
}