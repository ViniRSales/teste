package com.servify.backend.service;

import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.servify.backend.dto.ServicoRequestDTO;
import com.servify.backend.dto.ServicoResponseDTO;
import com.servify.backend.entity.Servico;
import com.servify.backend.repository.ServicoRepository;

@Service
public class ServicoService {

    private static final Set<String> ICONES_VALIDOS = Set.of(
            "scissors",
            "sparkles",
            "palette",
            "razor",
            "brush",
            "water_drop",
            "star",
            "heart",
            "flower",
            "bolt",
            "crown",
            "waves",
            "smiley",
            "sun",
            "diamond");

    private final ServicoRepository servicoRepository;

    public ServicoService(ServicoRepository servicoRepository) {
        this.servicoRepository = servicoRepository;
    }

    public List<ServicoResponseDTO> listar(String nome) {
        List<Servico> servicos;
        if (nome != null && !nome.isBlank()) {
            servicos = servicoRepository.findByNomeContainingIgnoreCaseOrderByNomeAsc(nome.trim());
        } else {
            servicos = servicoRepository.findAllByOrderByNomeAsc();
        }
        return servicos.stream().map(this::toResponseDTO).toList();
    }

    public ServicoResponseDTO buscarPorId(Long id) {
        Servico servico = servicoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Serviço não encontrado."));
        return toResponseDTO(servico);
    }

    public ServicoResponseDTO criar(ServicoRequestDTO dto) {
        validarIcone(dto.getIcone());
        Servico servico = new Servico();
        aplicarDto(servico, dto);
        return toResponseDTO(servicoRepository.save(servico));
    }

    public ServicoResponseDTO atualizar(Long id, ServicoRequestDTO dto) {
        validarIcone(dto.getIcone());
        Servico servico = servicoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Serviço não encontrado."));
        aplicarDto(servico, dto);
        return toResponseDTO(servicoRepository.save(servico));
    }

    public void excluir(Long id) {
        if (!servicoRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado.");
        }
        servicoRepository.deleteById(id);
    }

    private void aplicarDto(Servico servico, ServicoRequestDTO dto) {
        servico.setNome(dto.getNome().trim());
        servico.setValor(dto.getValor());
        servico.setDuracaoMinutos(dto.getDuracaoMinutos());
        servico.setIcone(dto.getIcone().trim());
        servico.setAtivo(Boolean.TRUE.equals(dto.getAtivo()));
    }

    private void validarIcone(String icone) {
        if (icone == null || !ICONES_VALIDOS.contains(icone.trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ícone inválido.");
        }
    }

    private ServicoResponseDTO toResponseDTO(Servico servico) {
        return new ServicoResponseDTO(
                servico.getId(),
                servico.getNome(),
                servico.getValor(),
                servico.getDuracaoMinutos(),
                servico.getIcone(),
                servico.isAtivo());
    }
}
