package com.servify.backend.service;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.servify.backend.constants.AgendaDisponibilidadeConstants;
import com.servify.backend.constants.PerfilConstants;
import com.servify.backend.dto.AgendaDisponibilidadeRequestDTO;
import com.servify.backend.dto.AgendaDisponibilidadeResponseDTO;
import com.servify.backend.entity.AgendaDisponibilidade;
import com.servify.backend.entity.Usuario;
import com.servify.backend.repository.AgendaDisponibilidadeRepository;
import com.servify.backend.repository.UsuarioRepository;

import jakarta.transaction.Transactional;

@Service
public class AgendaDisponibilidadeService {
    private final AgendaDisponibilidadeRepository agendaDisponibilidadeRepository;
    private final UsuarioRepository usuarioRepository;

    public AgendaDisponibilidadeService(
            AgendaDisponibilidadeRepository agendaDisponibilidadeRepository,
            UsuarioRepository usuarioRepository) {
        this.agendaDisponibilidadeRepository = agendaDisponibilidadeRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public AgendaDisponibilidadeResponseDTO atualizar(
            Long id,
            AgendaDisponibilidadeRequestDTO dto,
            Long usuarioLogadoId,
            Integer usuarioLogadoPerfilId) {

        AgendaDisponibilidade agendaDisponibilidade = buscarAgendaDisponibilidade(id);

        validarPermissaoEdicao(agendaDisponibilidade, usuarioLogadoId, usuarioLogadoPerfilId);

        validarAgendaDisponibilidade(dto);

        agendaDisponibilidade.setDisponivel(
                dto.disponivel());

        agendaDisponibilidade.setHoraInicio(
                dto.horaInicio());

        agendaDisponibilidade.setHoraFim(
                dto.horaFim());

        return toResponseDto(
                agendaDisponibilidadeRepository.save(
                        agendaDisponibilidade));
    }

    public AgendaDisponibilidadeResponseDTO buscarPorId(Long id) {

        AgendaDisponibilidade agenda = buscarAgendaDisponibilidade(id);

        return toResponseDto(agenda);
    }

    @Transactional
    public List<AgendaDisponibilidadeResponseDTO> buscarPorColaborador(Long colaboradorId) {

        Usuario colaborador = buscarUsuario(colaboradorId);

        validarColaborador(colaborador);

        criarDisponibilidadesPadraoFaltantes(colaborador);

        return agendaDisponibilidadeRepository
                .findByColaborador_Id(colaboradorId)
                .stream()
                .map(this::toResponseDto)
                .toList();
    }

    // #region Helpers
    private AgendaDisponibilidade buscarAgendaDisponibilidade(Long id) {
        AgendaDisponibilidade agendaDisponibilidade = agendaDisponibilidadeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "AgendaDisponibilidade não encontrada"));
        return agendaDisponibilidade;
    }

    private Usuario buscarUsuario(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
        return usuario;
    }

    private void validarPermissaoEdicao(
            AgendaDisponibilidade agenda,
            Long usuarioLogadoId,
            Integer usuarioLogadoPerfilId) {

        validarContextoAcesso(
                usuarioLogadoId,
                usuarioLogadoPerfilId);

        if (usuarioLogadoPerfilId == PerfilConstants.ADMIN) {
            return;
        }

        if (usuarioLogadoPerfilId == PerfilConstants.COLABORADOR
                && agenda.getColaborador()
                        .getId()
                        .equals(usuarioLogadoId)) {
            return;
        }

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Sem permissão para alterar esta agenda");
    }

    private void validarContextoAcesso(Long usuarioLogadoId, Integer perfilIdAcesso) {
        if (perfilIdAcesso == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Perfil do usuário logado não informado");
        }

        if (perfilIdAcesso != PerfilConstants.ADMIN && usuarioLogadoId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuário logado não informado");
        }
    }

    private void validarAgendaDisponibilidade(AgendaDisponibilidadeRequestDTO dto) {
        if (dto.disponivel()
                && !dto.horaInicio().isBefore(dto.horaFim())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Hora inicial deve ser anterior à hora final");
        }
    }

    private void validarColaborador(Usuario colaborador) {
        if (colaborador.getPerfil().getId() != PerfilConstants.COLABORADOR) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuário informado não é um colaborador");
        }
    }

    private void criarDisponibilidadesPadraoFaltantes(Usuario colaborador) {
        Set<DayOfWeek> diasExistentes = agendaDisponibilidadeRepository
                .findByColaborador_Id(colaborador.getId())
                .stream()
                .map(AgendaDisponibilidade::getDiaSemana)
                .collect(Collectors.toSet());

        for (DayOfWeek dia : DayOfWeek.values()) {
            if (diasExistentes.contains(dia)) {
                continue;
            }

            AgendaDisponibilidade agendaDisponibilidade = new AgendaDisponibilidade();
            agendaDisponibilidade.setColaborador(colaborador);
            agendaDisponibilidade.setDiaSemana(dia);
            agendaDisponibilidade.setDisponivel(
                    !AgendaDisponibilidadeConstants.DIAS_SEM_DISPONIBILIDADE_PADRAO.contains(dia));
            agendaDisponibilidade.setHoraInicio(AgendaDisponibilidadeConstants.HORA_INICIO_PADRAO);
            agendaDisponibilidade.setHoraFim(AgendaDisponibilidadeConstants.HORA_FIM_PADRAO);

            agendaDisponibilidadeRepository.save(agendaDisponibilidade);
        }
    }

    private AgendaDisponibilidadeResponseDTO toResponseDto(AgendaDisponibilidade agendaDisponibilidade) {
        return new AgendaDisponibilidadeResponseDTO(
                agendaDisponibilidade.getId(),
                agendaDisponibilidade.getColaborador().getId(),
                agendaDisponibilidade.getColaborador().getNome(),
                agendaDisponibilidade.getDiaSemana(),
                agendaDisponibilidade.getDisponivel(),
                agendaDisponibilidade.getHoraInicio(),
                agendaDisponibilidade.getHoraFim());
    }
    // #endregion
}
