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

import com.servify.backend.dto.UsuarioRequestDTO;
import com.servify.backend.dto.UsuarioResponseDTO;
import com.servify.backend.dto.UsuarioUpdateDTO;
import com.servify.backend.service.UsuarioService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service) {
        this.service = service;
    }

    @PostMapping
    public UsuarioResponseDTO criar(@Valid @RequestBody UsuarioRequestDTO dto) {
        return service.criar(dto);
    }

    @PostMapping("/cadastro-cliente")
    public UsuarioResponseDTO cadastroCliente(@Valid @RequestBody UsuarioRequestDTO dto) {
        return service.cadastroClientePublico(dto);
    }

    @GetMapping
    public List<UsuarioResponseDTO> listar() {
        return service.listar();
    }

    @GetMapping("/clientes")
    public List<UsuarioResponseDTO> listarClientes() {
        return service.listarClientes();
    }

    @GetMapping("/colaboradores")
    public List<UsuarioResponseDTO> listarColaboradores() {
        return service.listarUsuariosOperacionais();
    }

    @GetMapping("/{id}")
    public UsuarioResponseDTO buscar(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PutMapping("/{id}")
    public UsuarioResponseDTO atualizar(@PathVariable Long id, @Valid @RequestBody UsuarioUpdateDTO dto) {
        return service.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    public void deletar(@PathVariable Long id) {
        service.deletar(id);
    }
}
