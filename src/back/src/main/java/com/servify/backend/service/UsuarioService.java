package com.servify.backend.service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.servify.backend.constants.AgendaDisponibilidadeConstants;
import com.servify.backend.constants.PerfilConstants;
import com.servify.backend.dto.CompletarConviteCadastroDTO;
import com.servify.backend.dto.UsuarioRequestDTO;
import com.servify.backend.dto.UsuarioResponseDTO;
import com.servify.backend.dto.UsuarioUpdateDTO;
import com.servify.backend.entity.AgendaDisponibilidade;
import com.servify.backend.entity.Comissao;
import com.servify.backend.entity.Perfil;
import com.servify.backend.entity.Usuario;
import com.servify.backend.repository.AgendaDisponibilidadeRepository;
import com.servify.backend.repository.AgendamentoRepository;
import com.servify.backend.repository.ComissaoRepository;
import com.servify.backend.repository.PerfilRepository;
import com.servify.backend.repository.UsuarioRepository;

import jakarta.transaction.Transactional;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PerfilRepository perfilRepository;
    private final ComissaoRepository comissaoRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final AgendaDisponibilidadeRepository agendaDisponibilidadeRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UsuarioService(UsuarioRepository usuarioRepository,
            PerfilRepository perfilRepository,
            ComissaoRepository comissaoRepository,
            AgendamentoRepository agendamentoRepository,
            AgendaDisponibilidadeRepository agendaDisponibilidadeRepository) {
        this.usuarioRepository = usuarioRepository;
        this.perfilRepository = perfilRepository;
        this.comissaoRepository = comissaoRepository;
        this.agendamentoRepository = agendamentoRepository;
        this.agendaDisponibilidadeRepository = agendaDisponibilidadeRepository;
    }

    @Transactional
    public UsuarioResponseDTO criar(UsuarioRequestDTO dto) {
        Perfil perfil = perfilRepository.findById(dto.getPerfilId())
                .orElseThrow(() -> new RuntimeException("Perfil não encontrado"));
        return salvarNovoUsuario(dto, perfil);
    }

    /**
     * Cadastro público em {@code /cadastro}: sempre perfil Cliente (id 3),
     * ignorando
     * {@code perfilId} do corpo para evitar escolha incorreta ou manipulação.
     */
    @Transactional
    public UsuarioResponseDTO cadastroClientePublico(UsuarioRequestDTO dto) {
        Perfil perfil = perfilRepository.findById(PerfilConstants.CLIENTE)
                .orElseThrow(() -> new RuntimeException("Perfil Cliente não encontrado"));
        return salvarNovoUsuario(dto, perfil);
    }

    private UsuarioResponseDTO salvarNovoUsuario(UsuarioRequestDTO dto, Perfil perfil) {
        String email = dto.getEmail().trim();
        String cpf = dto.getCpf().replaceAll("\\D", "");
        usuarioRepository.findByEmailIgnoreCase(email).ifPresent(u -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado.");
        });
        usuarioRepository.findByCpf(cpf).ifPresent(u -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CPF já cadastrado.");
        });

        Usuario usuario = new Usuario();
        popularUsuario(dto, usuario, perfil);
        usuario.setSenha(passwordEncoder.encode(dto.getSenha()));
        usuario.setCadastroPendente(false);
        Usuario usuarioSalvo = usuarioRepository.save(usuario);
        criarComissao(usuarioSalvo);
        criarAgendaDisponibilidade(usuarioSalvo);
        return toResponseDTO(usuarioSalvo);
    }

    /**
     * Pré-cadastro ao enviar convite: e-mail + perfil + senha já criptografada
     * (BCrypt),
     * demais campos preenchidos com placeholders até
     * {@link #completarPreCadastroConvidado}.
     */
    public void criarPreCadastroConvidado(String email, Perfil perfil, String senhaPlana) {
        Usuario usuario = new Usuario();
        usuario.setPerfil(perfil);
        usuario.setEmail(email.trim());
        usuario.setNome("Convidado (cadastro pendente)");
        usuario.setCpf(cpfPlaceholderUnico());
        usuario.setTelefone("11999999999");
        usuario.setDataNascimento(LocalDate.of(1900, 1, 1));
        usuario.setCep("00000000");
        usuario.setLogradouro("A completar");
        usuario.setNumero("0");
        usuario.setComplemento("");
        usuario.setBairro("Pendente");
        usuario.setCidade("Pendente");
        usuario.setUf("SP");
        usuario.setSenha(passwordEncoder.encode(senhaPlana));
        usuario.setCadastroPendente(true);
        usuarioRepository.save(usuario);
    }

    @Transactional
    public UsuarioResponseDTO completarPreCadastroConvidado(Long usuarioId, CompletarConviteCadastroDTO dto) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        if (!usuario.isCadastroPendente()) {
            throw new RuntimeException("Este usuário não aguarda conclusão de cadastro.");
        }

        String novoCpf = dto.getCpf().replaceAll("\\D", "");
        usuarioRepository.findByCpf(novoCpf)
                .filter(u -> !u.getId().equals(usuarioId))
                .ifPresent(u -> {
                    throw new RuntimeException("CPF já cadastrado.");
                });
        usuario.setCpf(novoCpf);
        usuario.setNome(dto.getNome());
        usuario.setEmail(dto.getEmail().trim());
        usuario.setSenha(passwordEncoder.encode(dto.getSenha()));
        usuario.setTelefone(dto.getTelefone().replaceAll("\\D", ""));
        usuario.setDataNascimento(dto.getDataNascimento());
        usuario.setCep(dto.getCep().replaceAll("\\D", ""));
        usuario.setLogradouro(dto.getLogradouro());
        usuario.setNumero(dto.getNumero());
        usuario.setComplemento(dto.getComplemento() != null ? dto.getComplemento() : "");
        usuario.setBairro(dto.getBairro());
        usuario.setCidade(dto.getCidade());
        usuario.setUf(dto.getUf());
        usuario.setCadastroPendente(false);

        criarComissao(usuario);
        criarAgendaDisponibilidade(usuario);

        return toResponseDTO(usuarioRepository.save(usuario));
    }

    private String cpfPlaceholderUnico() {
        for (int i = 0; i < 80; i++) {
            long n = ThreadLocalRandom.current().nextLong(0L, 100_000_000_000L);
            String cpf = String.format("%011d", n);
            if (usuarioRepository.findByCpf(cpf).isEmpty()) {
                return cpf;
            }
        }
        throw new RuntimeException("Não foi possível gerar CPF temporário único para o convite.");
    }

    public List<UsuarioResponseDTO> listar() {
        return usuarioRepository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public List<UsuarioResponseDTO> listarClientes() {
        return usuarioRepository.findByPerfil_Id(PerfilConstants.CLIENTE)
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public List<UsuarioResponseDTO> listarUsuariosOperacionais() {
        return Stream.concat(
                usuarioRepository.findByPerfil_Id(PerfilConstants.ADMIN).stream(),
                usuarioRepository.findByPerfil_Id(PerfilConstants.COLABORADOR).stream())
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public UsuarioResponseDTO buscarPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        return toResponseDTO(usuario);
    }

    public UsuarioResponseDTO atualizar(Long id, UsuarioUpdateDTO dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        Perfil perfil = perfilRepository.findById(dto.getPerfilId())
                .orElseThrow(() -> new RuntimeException("Perfil não encontrado"));

        if (!usuario.getPerfil().getId().equals(dto.getPerfilId())) {
            throw new RuntimeException(
                    "Alteração de perfil não é permitida");
        }

        popularUsuario(dto, usuario, perfil);

        return toResponseDTO(usuarioRepository.save(usuario));
    }

    public void deletar(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (agendamentoRepository.existsByColaborador_Id(id)
                || agendamentoRepository.existsByCliente_Id(id)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Usuário possui agendamentos associados");
        }

        usuarioRepository.delete(usuario);
    }

    private void criarComissao(Usuario usuario) {
        if (usuario.getPerfil().getId() == PerfilConstants.COLABORADOR) {
            if (comissaoRepository
                    .findByUsuario_Id(usuario.getId())
                    .isEmpty()) {

                Comissao comissao = new Comissao();

                comissao.setUsuario(usuario);
                comissao.setValor(BigDecimal.ZERO);

                comissaoRepository.save(comissao);
            }
        }
    }

    private void criarAgendaDisponibilidade(Usuario usuario) {
        if (usuario.getPerfil().getId() != PerfilConstants.COLABORADOR) {
            return;
        }

        var diasExistentes = agendaDisponibilidadeRepository
                .findByColaborador_Id(usuario.getId())
                .stream()
                .map(AgendaDisponibilidade::getDiaSemana)
                .collect(Collectors.toSet());

        for (DayOfWeek dia : DayOfWeek.values()) {
            if (diasExistentes.contains(dia)) {
                continue;
            }

            AgendaDisponibilidade agendaDisponibilidade = new AgendaDisponibilidade();
            agendaDisponibilidade.setColaborador(usuario);
            agendaDisponibilidade.setDiaSemana(dia);
            boolean disponivel = !AgendaDisponibilidadeConstants.DIAS_SEM_DISPONIBILIDADE_PADRAO.contains(dia);
            agendaDisponibilidade.setDisponivel(disponivel);
            agendaDisponibilidade.setHoraInicio(AgendaDisponibilidadeConstants.HORA_INICIO_PADRAO);
            agendaDisponibilidade.setHoraFim(AgendaDisponibilidadeConstants.HORA_FIM_PADRAO);

            agendaDisponibilidadeRepository.save(agendaDisponibilidade);
        }
    }

    private void popularUsuario(UsuarioRequestDTO dto, Usuario usuario, Perfil perfil) {
        usuario.setPerfil(perfil);
        usuario.setCpf(dto.getCpf().replaceAll("\\D", ""));
        usuario.setNome(dto.getNome());
        usuario.setEmail(dto.getEmail().trim());
        usuario.setTelefone(dto.getTelefone().replaceAll("\\D", ""));
        usuario.setDataNascimento(dto.getDataNascimento());
        usuario.setCep(dto.getCep().replaceAll("\\D", ""));
        usuario.setLogradouro(dto.getLogradouro());
        usuario.setNumero(dto.getNumero());
        usuario.setComplemento(dto.getComplemento());
        usuario.setBairro(dto.getBairro());
        usuario.setCidade(dto.getCidade());
        usuario.setUf(dto.getUf());
    }

    private void popularUsuario(UsuarioUpdateDTO dto, Usuario usuario, Perfil perfil) {
        usuario.setPerfil(perfil);
        usuario.setNome(dto.getNome());
        usuario.setEmail(dto.getEmail().trim());
        usuario.setTelefone(dto.getTelefone().replaceAll("\\D", ""));
        usuario.setDataNascimento(dto.getDataNascimento());
        usuario.setCep(dto.getCep().replaceAll("\\D", ""));
        usuario.setLogradouro(dto.getLogradouro());
        usuario.setNumero(dto.getNumero());
        usuario.setComplemento(dto.getComplemento());
        usuario.setBairro(dto.getBairro());
        usuario.setCidade(dto.getCidade());
        usuario.setUf(dto.getUf());
    }

    private UsuarioResponseDTO toResponseDTO(Usuario usuario) {
        UsuarioResponseDTO dto = new UsuarioResponseDTO();
        dto.setId(usuario.getId());
        dto.setPerfilId(usuario.getPerfil().getId());
        dto.setPerfilNome(usuario.getPerfil().getNome());
        dto.setCpf(usuario.getCpf());
        dto.setNome(usuario.getNome());
        dto.setEmail(usuario.getEmail());
        dto.setTelefone(usuario.getTelefone());
        dto.setDataNascimento(usuario.getDataNascimento());
        dto.setCep(usuario.getCep());
        dto.setLogradouro(usuario.getLogradouro());
        dto.setNumero(usuario.getNumero());
        dto.setComplemento(usuario.getComplemento());
        dto.setBairro(usuario.getBairro());
        dto.setCidade(usuario.getCidade());
        dto.setUf(usuario.getUf());
        dto.setCadastroPendente(usuario.isCadastroPendente());
        dto.setDataCriacao(usuario.getDataCriacao());
        return dto;
    }
}
