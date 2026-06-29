package com.servify.backend.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.servify.backend.dto.AgendaDisponibilidadeRequestDTO;
import com.servify.backend.dto.AgendaDisponibilidadeResponseDTO;
import com.servify.backend.service.AgendaDisponibilidadeService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/agenda-disponibilidade")
public class AgendaDisponibilidadeController {
    private final AgendaDisponibilidadeService service;

    public AgendaDisponibilidadeController(AgendaDisponibilidadeService service) {
        this.service = service;
    }

    @PutMapping("/{id}")
    public AgendaDisponibilidadeResponseDTO atualizar(
            @PathVariable Long id,
            @RequestBody @Valid AgendaDisponibilidadeRequestDTO dto,
            @RequestParam Long usuarioLogadoId,
            @RequestParam Integer usuarioLogadoPerfilId) {

        return service.atualizar(id, dto, usuarioLogadoId, usuarioLogadoPerfilId);
    }

    @GetMapping("/{id}")
    public AgendaDisponibilidadeResponseDTO buscarPorId(@PathVariable Long id) {

        return service.buscarPorId(id);
    }

    @GetMapping("/colaborador/{colaboradorid}")
    public List<AgendaDisponibilidadeResponseDTO> buscarPorColaborador(@PathVariable Long colaboradorid) {

        return service.buscarPorColaborador(colaboradorid);
    }
}
