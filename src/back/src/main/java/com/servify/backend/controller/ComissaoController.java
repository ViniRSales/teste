package com.servify.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.servify.backend.dto.ColaboradorComissaoDTO;
import com.servify.backend.dto.ComissaoRequestDTO;
import com.servify.backend.dto.ComissaoResponseDTO;
import com.servify.backend.service.ComissaoService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/comissoes")
public class ComissaoController {
    private final ComissaoService service;

    public ComissaoController(ComissaoService service) {
        this.service = service;
    }

    @PutMapping("/{id}")
    public ComissaoResponseDTO atualizar(
            @PathVariable Long id,
            @RequestBody @Valid ComissaoRequestDTO dto) {

        return service.atualizar(id, dto);
    }

    @GetMapping("/{id}")
    public ComissaoResponseDTO buscarPorId(
            @PathVariable Long id) {

        return service.buscarPorId(id);
    }

    @GetMapping("/usuario/{usuarioId}")
    public ComissaoResponseDTO buscarPorUsuario(
            @PathVariable Long usuarioId) {

        return service.buscarPorUsuario(usuarioId);
    }

    @GetMapping("/colaboradores")
    public List<ColaboradorComissaoDTO> listarColaboradoresComissao() {

        return service.listarColaboradoresComissao();
    }

    @GetMapping()
    public List<ComissaoResponseDTO> listarTodas() {
        return service.listarTodas();
    }
}
