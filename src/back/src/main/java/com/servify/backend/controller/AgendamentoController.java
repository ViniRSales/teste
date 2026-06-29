package com.servify.backend.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.servify.backend.dto.AgendamentoRequestDTO;
import com.servify.backend.dto.AgendamentoResponseDTO;
import com.servify.backend.enums.AgendamentoStatus;
import com.servify.backend.service.AgendamentoService;

import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/agendamentos")
public class AgendamentoController {

    private final AgendamentoService service;

    public AgendamentoController(AgendamentoService service) {
        this.service = service;
    }

    @PostMapping
    public AgendamentoResponseDTO criar(@Valid @RequestBody AgendamentoRequestDTO dto) {
        return service.criar(dto);
    }

    @GetMapping
    public List<AgendamentoResponseDTO> listar(
            @RequestParam(required = false) LocalDateTime inicio,
            @RequestParam(required = false) LocalDateTime fim,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Long colaboradorId,
            @RequestParam(required = false) Long servicoId,
            @RequestParam(required = false) AgendamentoStatus status,
            @RequestParam(required = false) Long usuarioLogadoId,
            @RequestParam(required = false) Integer usuarioLogadoPerfilId,
            @RequestParam(required = false) String usuarioLogadoCargo) {

        return service.listar(
                inicio,
                fim,
                clienteId,
                colaboradorId,
                servicoId,
                status,
                usuarioLogadoId,
                usuarioLogadoPerfilId,
                usuarioLogadoCargo);
    }

    @GetMapping("/{id}")
    public AgendamentoResponseDTO buscar(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PutMapping("/{id}")
    public AgendamentoResponseDTO editar(@PathVariable Long id,
            @Valid @RequestBody AgendamentoRequestDTO dto) {
        return service.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    public void deletar(@PathVariable Long id) {
        service.deletar(id);
    }
}
