package com.servify.backend.service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.servify.backend.constants.AgendaDisponibilidadeConstants;
import com.servify.backend.constants.PerfilConstants;
import com.servify.backend.dto.AgendamentoRequestDTO;
import com.servify.backend.dto.AgendamentoResponseDTO;
import com.servify.backend.entity.AgendaDisponibilidade;
import com.servify.backend.entity.Agendamento;
import com.servify.backend.entity.Comissao;
import com.servify.backend.entity.Servico;
import com.servify.backend.entity.Usuario;
import com.servify.backend.enums.AgendamentoStatus;
import com.servify.backend.repository.AgendaDisponibilidadeRepository;
import com.servify.backend.repository.AgendamentoRepository;
import com.servify.backend.repository.ComissaoRepository;
import com.servify.backend.repository.ServicoRepository;
import com.servify.backend.repository.UsuarioRepository;

import jakarta.transaction.Transactional;

@Service
public class AgendamentoService {

    private static final long LIMITE_ALTERACAO_MINUTOS = 45;

    private final AgendamentoRepository agendamentoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ServicoRepository servicoRepository;
    private final ComissaoRepository comissaoRepository;
    private final AgendaDisponibilidadeRepository agendaDisponibilidadeRepository;

    public AgendamentoService(AgendamentoRepository agendamentoRepository,
            UsuarioRepository usuarioRepository,
            ServicoRepository servicoRepository,
            ComissaoRepository comissaoRepository,
            AgendaDisponibilidadeRepository agendaDisponibilidadeRepository) {

        this.agendamentoRepository = agendamentoRepository;
        this.usuarioRepository = usuarioRepository;
        this.servicoRepository = servicoRepository;
        this.comissaoRepository = comissaoRepository;
        this.agendaDisponibilidadeRepository = agendaDisponibilidadeRepository;
    }

    @Transactional
    public AgendamentoResponseDTO criar(AgendamentoRequestDTO dto) {
        Usuario cliente = buscarUsuario(dto.clienteId());

        Usuario colaborador = buscarUsuario(dto.colaboradorId());

        Servico servico = buscarServico(dto.servicoId());

        Comissao comissao = buscarComissaoPorColaborador(colaborador.getId());

        AgendaDisponibilidade disponibilidade = buscarDisponibilidadePorColaboradorEDiaSemana(
                colaborador, dto.dataHora().getDayOfWeek());

        validarCliente(cliente);

        validarColaborador(colaborador);

        validarServico(servico);

        validarComissao(comissao);

        validarDataHora(dto.dataHora());

        validarDesconto(dto, servico);

        validarConflitoHorarioCliente(
                cliente,
                servico,
                dto.dataHora(),
                null);

        validarConflitoHorarioColaborador(
                colaborador,
                servico,
                dto.dataHora(),
                null);

        validarDisponibilidadeColaborador(
                disponibilidade,
                dto.dataHora());

        Agendamento agendamento = criarAgendamento(dto, cliente, colaborador, servico, comissao);

        return toResponseDto(agendamentoRepository.save(agendamento));
    }

    @Transactional
    public List<AgendamentoResponseDTO> listar(
            LocalDateTime inicio,
            LocalDateTime fim,
            Long clienteId,
            Long colaboradorId,
            Long servicoId,
            AgendamentoStatus status,
            Long usuarioLogadoId,
            Integer usuarioLogadoPerfilId,
            String usuarioLogadoCargo) {

        validarConsultaHorario(inicio, fim);
        Integer perfilIdAcesso = resolverPerfilIdAcesso(usuarioLogadoPerfilId, usuarioLogadoCargo);
        validarContextoAcesso(usuarioLogadoId, perfilIdAcesso);

        List<Agendamento> agendamentos = agendamentoRepository.findAll();
        atualizarStatusAgendamentosPassados(agendamentos);

        return agendamentos
                .stream()

                .filter(a -> podeAcessarAgendamento(a, usuarioLogadoId, perfilIdAcesso))

                .filter(a -> clienteId == null
                        || a.getCliente().getId().equals(clienteId))

                .filter(a -> colaboradorId == null
                        || a.getColaborador().getId().equals(colaboradorId))

                .filter(a -> servicoId == null
                        || a.getServico().getId().equals(servicoId))

                .filter(a -> status == null
                        || a.getAgendamentoStatus() == status)

                .filter(a -> inicio == null
                        || !a.getDataHora().isBefore(inicio))

                .filter(a -> fim == null
                        || !a.getDataHora().isAfter(fim))

                .map(this::toResponseDto)

                .toList();
    }

    public AgendamentoResponseDTO buscarPorId(Long id) {
        Agendamento agendamento = buscarAgendamento(id);

        return toResponseDto(agendamento);
    }

    @Transactional
    public AgendamentoResponseDTO atualizar(Long id, AgendamentoRequestDTO dto) {
        Agendamento agendamento = buscarAgendamento(id);

        Usuario cliente = buscarUsuario(dto.clienteId());

        Usuario colaborador = buscarUsuario(dto.colaboradorId());

        Servico servico = buscarServico(dto.servicoId());

        Comissao comissao = buscarComissaoPorColaborador(colaborador.getId());

        AgendaDisponibilidade disponibilidade = buscarDisponibilidadePorColaboradorEDiaSemana(
                colaborador, dto.dataHora().getDayOfWeek());

        validarCliente(cliente);

        validarColaborador(colaborador);

        validarServico(servico);

        validarComissao(comissao);

        validarDataHora(dto.dataHora());

        validarDesconto(dto, servico);

        validarStatusAgendamento(agendamento);

        validarPrazoDeTolerancia(agendamento);

        validarConflitoHorarioCliente(
                cliente,
                servico,
                dto.dataHora(),
                id);

        validarConflitoHorarioColaborador(
                colaborador,
                servico,
                dto.dataHora(),
                id);

        validarDisponibilidadeColaborador(
                disponibilidade,
                dto.dataHora());

        atualizarAgendamento(dto, agendamento, cliente, colaborador, servico, comissao);

        return toResponseDto(
                agendamentoRepository.save(
                        agendamento));
    }

    @Transactional
    public void deletar(Long id) {
        Agendamento agendamento = buscarAgendamento(id);

        validarStatusAgendamento(agendamento);

        agendamento.setAgendamentoStatus(AgendamentoStatus.CANCELADO);

        agendamentoRepository.save(agendamento);
    }

    // #region Validações
    private void validarCliente(Usuario cliente) {
        if (cliente.isCadastroPendente()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cliente com cadastro pendente");
        }
    }

    private void validarColaborador(Usuario colaborador) {
        if (colaborador.getPerfil().getId() != PerfilConstants.COLABORADOR) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuário informado não é um colaborador");
        }

        if (colaborador.isCadastroPendente()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Colaborador com cadastro pendente");
        }
    }

    private void validarServico(Servico servico) {
        if (!servico.isAtivo()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Serviço está inativo");
        }
    }

    private void validarComissao(Comissao comissao) {
        if (comissao.getValor() == null || comissao.getValor().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comissão do colaborador não pode ser negativa");
        }
        if (comissao.getValor().compareTo(BigDecimal.ONE) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Comissão do colaborador deve ser um valor entre 0 e 1");
        }
    }

    private void validarDataHora(LocalDateTime dataHora) {
        if (dataHora.isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Data e hora do agendamento devem ser futuras");
        }
    }

    private void validarDesconto(AgendamentoRequestDTO dto, Servico servico) {
        if (dto.desconto().compareTo(servico.getValor()) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Desconto não pode ser maior que o valor do serviço");
        }
        if (dto.desconto().compareTo(java.math.BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Desconto não pode ser negativo");
        }
    }

    private void validarStatusAgendamento(Agendamento agendamento) {
        if (agendamento.getAgendamentoStatus() == AgendamentoStatus.CANCELADO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Não é possível atualizar um agendamento cancelado");
        }

        if (agendamento.getAgendamentoStatus() == AgendamentoStatus.EM_ANDAMENTO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Não é possível atualizar um agendamento em andamento");
        }

        if (agendamento.getAgendamentoStatus() == AgendamentoStatus.CONCLUIDO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Não é possível atualizar um agendamento concluído");
        }
    }

    private void validarConflitoHorarioCliente(
            Usuario cliente,
            Servico servico,
            LocalDateTime inicioAgendamento,
            Long agendamentoIdIgnorado) {

        LocalDateTime inicioDia = inicioAgendamento.toLocalDate().atStartOfDay();

        LocalDateTime fimDia = inicioAgendamento.toLocalDate().atTime(23, 59, 59);

        List<Agendamento> agendamentosExistentes = agendamentoRepository
                .findByCliente_IdAndDataHoraBetweenAndAgendamentoStatusNot(
                        cliente.getId(),
                        inicioDia,
                        fimDia,
                        AgendamentoStatus.CANCELADO);

        validarOverlap(
                agendamentosExistentes,
                servico,
                inicioAgendamento,
                agendamentoIdIgnorado,
                "Cliente já possui um agendamento nesse horário");
    }

    private void validarConflitoHorarioColaborador(
            Usuario colaborador,
            Servico servico,
            LocalDateTime inicioAgendamento,
            Long agendamentoIdIgnorado) {

        LocalDateTime inicioDia = inicioAgendamento.toLocalDate().atStartOfDay();

        LocalDateTime fimDia = inicioAgendamento.toLocalDate().atTime(23, 59, 59);

        List<Agendamento> agendamentosExistentes = agendamentoRepository
                .findByColaborador_IdAndDataHoraBetweenAndAgendamentoStatusNot(
                        colaborador.getId(),
                        inicioDia,
                        fimDia,
                        AgendamentoStatus.CANCELADO);

        validarOverlap(
                agendamentosExistentes,
                servico,
                inicioAgendamento,
                agendamentoIdIgnorado,
                "Colaborador já possui um agendamento nesse horário");
    }

    private void validarOverlap(
            List<Agendamento> agendamentosExistentes,
            Servico servico,
            LocalDateTime inicioAgendamento,
            Long agendamentoIdIgnorado,
            String mensagemErro) {

        LocalDateTime fimNovo = inicioAgendamento.plusMinutes(
                servico.getDuracaoMinutos());

        for (Agendamento agendamento : agendamentosExistentes) {

            if (agendamentoIdIgnorado != null
                    && agendamento.getId().equals(
                            agendamentoIdIgnorado)) {
                continue;
            }

            LocalDateTime inicioExistente = agendamento.getDataHora();

            LocalDateTime fimExistente = inicioExistente.plusMinutes(
                    agendamento.getDuracaoMinutos());

            boolean possuiConflito = inicioAgendamento.isBefore(fimExistente)
                    && fimNovo.isAfter(inicioExistente);

            if (possuiConflito) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, mensagemErro);
            }
        }
    }

    private void validarPrazoDeTolerancia(Agendamento agendamento) {
        if (agendamento.getDataHora()
                .minusMinutes(LIMITE_ALTERACAO_MINUTOS)
                .isBefore(LocalDateTime.now())) {

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Este agendamento não pode mais ser alterado");
        }
    }

    private void validarConsultaHorario(LocalDateTime inicio, LocalDateTime fim) {
        if (inicio != null
                && fim != null
                && inicio.isAfter(fim)) {

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Data inicial não pode ser posterior à data final");
        }
    }

    private void validarContextoAcesso(Long usuarioLogadoId, Integer perfilIdAcesso) {
        if (perfilIdAcesso == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Perfil do usuário logado não informado");
        }

        if (perfilIdAcesso != PerfilConstants.ADMIN && usuarioLogadoId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuário logado não informado");
        }
    }

    private Integer resolverPerfilIdAcesso(Integer usuarioLogadoPerfilId, String usuarioLogadoCargo) {
        if (usuarioLogadoPerfilId != null) {
            return usuarioLogadoPerfilId;
        }

        String cargo = usuarioLogadoCargo == null ? "" : usuarioLogadoCargo.trim().toLowerCase();
        return switch (cargo) {
            case "adm", "administrador" -> PerfilConstants.ADMIN;
            case "colaborador" -> PerfilConstants.COLABORADOR;
            case "cliente" -> PerfilConstants.CLIENTE;
            default -> null;
        };
    }

    private boolean podeAcessarAgendamento(Agendamento agendamento, Long usuarioLogadoId, Integer perfilIdAcesso) {
        if (perfilIdAcesso == PerfilConstants.ADMIN) {
            return true;
        }

        if (perfilIdAcesso == PerfilConstants.CLIENTE) {
            return agendamento.getCliente().getId().equals(usuarioLogadoId);
        }

        if (perfilIdAcesso == PerfilConstants.COLABORADOR) {
            return agendamento.getColaborador().getId().equals(usuarioLogadoId);
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Perfil sem acesso a agendamentos");
    }

    /**
     * O colaborador precisa estar disponível
     * apenas no momento de início do atendimento.
     * Um serviço pode estender-se além do horário de disponibilidade, mas não pode
     * começar fora do horário.
     * 
     * @param disponibilidade A disponibilidade do colaborador para o dia da semana
     *                        do agendamento
     * @param dataHora        A data e hora de início do agendamento
     */
    private void validarDisponibilidadeColaborador(AgendaDisponibilidade disponibilidade,
            LocalDateTime dataHora) {

        if (!disponibilidade.getDisponivel()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Colaborador não está disponível no dia selecionado");
        }

        LocalTime horaInicioAgendamento = dataHora.toLocalTime();

        if (horaInicioAgendamento.isBefore(disponibilidade.getHoraInicio())
                || horaInicioAgendamento.isAfter(disponibilidade.getHoraFim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Colaborador não está disponível no horário selecionado");
        }
    }
    // #endregion

    // #region Helpers
    private Usuario buscarUsuario(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
        return usuario;
    }

    private Agendamento buscarAgendamento(Long id) {
        Agendamento agendamento = agendamentoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado"));
        return agendamento;
    }

    private Servico buscarServico(Long servicoId) {
        Servico servico = servicoRepository.findById(servicoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado"));
        return servico;
    }

    private Comissao buscarComissaoPorColaborador(Long colaboradorId) {
        Comissao comissao = comissaoRepository.findByUsuario_Id(colaboradorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Comissão do colaborador não encontrada"));
        return comissao;
    }

    private AgendaDisponibilidade buscarDisponibilidadePorColaboradorEDiaSemana(
            Usuario colaborador,
            DayOfWeek dayOfWeek) {
        return agendaDisponibilidadeRepository
                .findByColaborador_IdAndDiaSemana(colaborador.getId(), dayOfWeek)
                .orElseGet(() -> criarDisponibilidadePadrao(colaborador, dayOfWeek));
    }

    private AgendaDisponibilidade criarDisponibilidadePadrao(Usuario colaborador, DayOfWeek diaSemana) {
        AgendaDisponibilidade agendaDisponibilidade = new AgendaDisponibilidade();
        agendaDisponibilidade.setColaborador(colaborador);
        agendaDisponibilidade.setDiaSemana(diaSemana);
        agendaDisponibilidade.setDisponivel(
                !AgendaDisponibilidadeConstants.DIAS_SEM_DISPONIBILIDADE_PADRAO.contains(diaSemana));
        agendaDisponibilidade.setHoraInicio(AgendaDisponibilidadeConstants.HORA_INICIO_PADRAO);
        agendaDisponibilidade.setHoraFim(AgendaDisponibilidadeConstants.HORA_FIM_PADRAO);

        return agendaDisponibilidadeRepository.save(agendaDisponibilidade);
    }

    private Agendamento criarAgendamento(AgendamentoRequestDTO dto, Usuario cliente, Usuario colaborador,
            Servico servico,
            Comissao comissao) {
        Agendamento agendamento = new Agendamento();

        agendamento.setCliente(cliente);
        agendamento.setColaborador(colaborador);
        agendamento.setServico(servico);

        agendamento.setDataHora(dto.dataHora());

        agendamento.setValor(servico.getValor());

        agendamento.setDuracaoMinutos(
                servico.getDuracaoMinutos());

        agendamento.setDesconto(dto.desconto());

        agendamento.setComissao(comissao.getValor());

        agendamento.setAgendamentoStatus(
                AgendamentoStatus.AGENDADO);
        return agendamento;
    }

    private void atualizarAgendamento(AgendamentoRequestDTO dto, Agendamento agendamento, Usuario cliente,
            Usuario colaborador,
            Servico servico, Comissao comissao) {
        agendamento.setCliente(cliente);

        agendamento.setColaborador(colaborador);

        agendamento.setServico(servico);

        agendamento.setDataHora(dto.dataHora());

        agendamento.setComissao(
                comissao.getValor());

        agendamento.setValor(
                servico.getValor());

        agendamento.setDuracaoMinutos(
                servico.getDuracaoMinutos());

        agendamento.setDesconto(
                dto.desconto());
    }

    private void atualizarStatusAgendamentosPassados(List<Agendamento> agendamentos) {
        LocalDateTime agora = LocalDateTime.now();

        List<Agendamento> aAtualizar = agendamentos.stream()
                .filter(a -> a.getAgendamentoStatus() == AgendamentoStatus.AGENDADO
                        || a.getAgendamentoStatus() == AgendamentoStatus.EM_ANDAMENTO)
                .filter(a -> a.getDataHora().isBefore(agora))
                .peek(a -> {
                    LocalDateTime fim = a.getDataHora().plusMinutes(a.getDuracaoMinutos());
                    if (fim.isAfter(agora)) {
                        a.setAgendamentoStatus(AgendamentoStatus.EM_ANDAMENTO);
                    } else {
                        a.setAgendamentoStatus(AgendamentoStatus.CONCLUIDO);
                    }
                })
                .toList();

        if (aAtualizar.isEmpty())
            return;

        agendamentoRepository.saveAll(aAtualizar);
    }

    private AgendamentoResponseDTO toResponseDto(Agendamento agendamento) {
        BigDecimal valorFinal = agendamento.getValor().subtract(agendamento.getDesconto());
        return new AgendamentoResponseDTO(
                agendamento.getId(),
                agendamento.getAgendamentoStatus().name(),
                agendamento.getCliente().getId(),
                agendamento.getCliente().getNome(),
                agendamento.getColaborador().getId(),
                agendamento.getColaborador().getNome(),
                agendamento.getServico().getId(),
                agendamento.getServico().getNome(),
                agendamento.getDataHora(),
                agendamento.getDuracaoMinutos(),
                agendamento.getValor(),
                agendamento.getDesconto(),
                valorFinal,
                agendamento.getComissao());
    }
    // #endregion
}
