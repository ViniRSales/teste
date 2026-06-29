package com.servify.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.servify.backend.dto.CompletarConviteCadastroDTO;
import com.servify.backend.dto.ConviteRequestDTO;
import com.servify.backend.dto.ConviteResponseDTO;
import com.servify.backend.dto.UsuarioResponseDTO;
import com.servify.backend.service.ConviteService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/convites")
public class ConviteController {
    private final ConviteService service;

    public ConviteController(ConviteService service) {
        this.service = service;
    }

    @PostMapping
    public ConviteResponseDTO criar(@Valid @RequestBody ConviteRequestDTO dto) {
        return service.criar(dto);
    }

    @GetMapping("/token/{token}")
    public ConviteResponseDTO validarToken(
            @PathVariable String token) {

        return service.validarToken(token);
    }

    @PostMapping("/token/{token}/completar-cadastro")
    public UsuarioResponseDTO completarCadastro(
            @PathVariable String token,
            @Valid @RequestBody CompletarConviteCadastroDTO dto) {
        return service.completarCadastro(token, dto);
    }

    @GetMapping("/{id}")
    public ConviteResponseDTO buscar(@PathVariable Integer id) {
        return service.buscarPorId(id);
    }

    // TODO: deletar após testes de criação
    @PutMapping("/{id}")
    public ConviteResponseDTO atualizar(@PathVariable Integer id, @Valid @RequestBody ConviteRequestDTO dto) {
        return service.atualizar(id, dto);
    }

    // TODO: deletar após testes de criação
    @GetMapping
    public List<ConviteResponseDTO> listar() {
        return service.listar();
    }

    // TODO: deletar após testes de criação
    @DeleteMapping("/{id}")
    public void deletar(@PathVariable Integer id) {
        service.deletar(id);
    }
}
