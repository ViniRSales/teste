package com.servify.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.servify.backend.dto.ColaboradorComissaoDTO;
import com.servify.backend.dto.ComissaoRequestDTO;
import com.servify.backend.dto.ComissaoResponseDTO;
import com.servify.backend.entity.Comissao;
import com.servify.backend.entity.Usuario;
import com.servify.backend.repository.ComissaoRepository;
import com.servify.backend.repository.UsuarioRepository;

public class ComissaoServiceTest {

    @Mock
    private ComissaoRepository comissaoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    private ComissaoService service;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new ComissaoService(comissaoRepository, usuarioRepository);
    }

    private ComissaoRequestDTO criarComissaoRequestDTO() {
        // Construtor posicional nativo do record
        return new ComissaoRequestDTO(1L, new BigDecimal("0.5000"));
    }

    private Usuario criarUsuarioMock(Long id, String nome) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNome(nome);
        return usuario;
    }

    @Test
    public void deveCriarComissaoComSucesso() {
        ComissaoRequestDTO dto = criarComissaoRequestDTO();
        Usuario usuario = criarUsuarioMock(1L, "João Silva");
        
        Comissao comissaoSalva = mock(Comissao.class);
        when(comissaoSalva.getId()).thenReturn(10L);
        when(comissaoSalva.getUsuario()).thenReturn(usuario);
        when(comissaoSalva.getValor()).thenReturn(dto.valor());

        when(comissaoRepository.findByUsuario_Id(dto.usuarioId())).thenReturn(Optional.empty());
        when(usuarioRepository.findById(dto.usuarioId())).thenReturn(Optional.of(usuario));
        when(comissaoRepository.save(any(Comissao.class))).thenReturn(comissaoSalva);

        ComissaoResponseDTO response = service.criar(dto);

        verify(comissaoRepository).save(any(Comissao.class));

        assertNotNull(response);
        // Asserções adaptadas para métodos de record (.id(), .usuarioId(), etc.)
        assertEquals(10L, response.id());
        assertEquals(1L, response.usuarioId());
        assertEquals("João Silva", response.usuarioNome());
        assertEquals(dto.valor(), response.valor());
    }

    @Test
    public void deveLancarRuntimeExceptionAoCriarQuandoUsuarioJaPossuiComissao() {
        ComissaoRequestDTO dto = criarComissaoRequestDTO();
        Comissao comissaoExistente = mock(Comissao.class);

        when(comissaoRepository.findByUsuario_Id(dto.usuarioId())).thenReturn(Optional.of(comissaoExistente));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> service.criar(dto)
        );

        assertEquals("Usuário já possui comissão", exception.getMessage());
        verify(usuarioRepository, never()).findById(any());
        verify(comissaoRepository, never()).save(any());
    }

    @Test
    public void deveLancarRuntimeExceptionAoCriarQuandoUsuarioNaoForEncontrado() {
        ComissaoRequestDTO dto = criarComissaoRequestDTO();

        when(comissaoRepository.findByUsuario_Id(dto.usuarioId())).thenReturn(Optional.empty());
        when(usuarioRepository.findById(dto.usuarioId())).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> service.criar(dto)
        );

        assertEquals("Usuário não encontrado", exception.getMessage());
        verify(comissaoRepository, never()).save(any());
    }

    @Test
    public void deveAtualizarComissaoComSucesso() {
        ComissaoRequestDTO dto = criarComissaoRequestDTO();
        Usuario usuario = criarUsuarioMock(1L, "João Silva");
        
        Comissao comissaoExistente = mock(Comissao.class);
        when(comissaoExistente.getId()).thenReturn(10L);
        when(comissaoExistente.getUsuario()).thenReturn(usuario);
        when(comissaoExistente.getValor()).thenReturn(dto.valor());

        when(comissaoRepository.findById(10L)).thenReturn(Optional.of(comissaoExistente));
        when(usuarioRepository.findById(dto.usuarioId())).thenReturn(Optional.of(usuario));
        when(comissaoRepository.save(any(Comissao.class))).thenReturn(comissaoExistente);

        ComissaoResponseDTO response = service.atualizar(10L, dto);

        assertNotNull(response);
        assertEquals(10L, response.id());
        assertEquals(dto.valor(), response.valor());
    }

    @Test
    public void deveLancarRuntimeExceptionAoAtualizarQuandoComissaoNaoForEncontrada() {
        ComissaoRequestDTO dto = criarComissaoRequestDTO();

        when(comissaoRepository.findById(10L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> service.atualizar(10L, dto)
        );

        assertEquals("Comissão não encontrada", exception.getMessage());
        verify(comissaoRepository, never()).save(any());
    }

    @Test
    public void deveBuscarComissaoPorIdComSucesso() {
        Usuario usuario = criarUsuarioMock(1L, "João Silva");
        Comissao comissao = mock(Comissao.class);
        when(comissao.getId()).thenReturn(10L);
        when(comissao.getUsuario()).thenReturn(usuario);
        when(comissao.getValor()).thenReturn(new BigDecimal("0.4000"));

        when(comissaoRepository.findById(10L)).thenReturn(Optional.of(comissao));

        ComissaoResponseDTO response = service.buscarPorId(10L);

        assertNotNull(response);
        assertEquals(10L, response.id());
        assertEquals("João Silva", response.usuarioNome());
    }

    @Test
    public void deveLancarRuntimeExceptionAoBuscarPorIdInexistente() {
        when(comissaoRepository.findById(10L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> service.buscarPorId(10L)
        );

        assertEquals("Comissão não encontrada", exception.getMessage());
    }

    @Test
    public void deveBuscarComissaoPorUsuarioComSucesso() {
        Usuario usuario = criarUsuarioMock(1L, "João Silva");
        Comissao comissao = mock(Comissao.class);
        when(comissao.getId()).thenReturn(10L);
        when(comissao.getUsuario()).thenReturn(usuario);
        when(comissao.getValor()).thenReturn(new BigDecimal("0.4000"));

        when(comissaoRepository.findByUsuario_Id(1L)).thenReturn(Optional.of(comissao));

        ComissaoResponseDTO response = service.buscarPorUsuario(1L);

        assertNotNull(response);
        assertEquals(10L, response.id());
        assertEquals(1L, response.usuarioId());
    }

    @Test
    public void deveListarTodasAsComissoes() {
        Usuario usuario = criarUsuarioMock(1L, "João Silva");
        Comissao comissao = mock(Comissao.class);
        when(comissao.getId()).thenReturn(10L);
        when(comissao.getUsuario()).thenReturn(usuario);
        when(comissao.getValor()).thenReturn(new BigDecimal("0.4000"));

        when(comissaoRepository.findAllByOrderByIdAsc()).thenReturn(List.of(comissao));

        List<ComissaoResponseDTO> resultado = service.listarTodas();

        assertEquals(1, resultado.size());
        assertEquals(10L, resultado.get(0).id());
    }

    @Test
    public void deveListarColaboradoresComissaoMapeandoCorretamenteComESemComissao() {
        Usuario colaborador1 = criarUsuarioMock(1L, "Colaborador Com Comissão");
        Usuario colaborador2 = criarUsuarioMock(2L, "Colaborador Sem Comissão");

        Comissao comissao1 = mock(Comissao.class);
        when(comissao1.getId()).thenReturn(10L);
        when(comissao1.getUsuario()).thenReturn(colaborador1);
        when(comissao1.getValor()).thenReturn(new BigDecimal("0.6000"));

        when(usuarioRepository.findByPerfil_Id(2)).thenReturn(List.of(colaborador1, colaborador2));
        when(comissaoRepository.findByUsuario_Id(1L)).thenReturn(Optional.of(comissao1));
        when(comissaoRepository.findByUsuario_Id(2L)).thenReturn(Optional.empty());

        List<ColaboradorComissaoDTO> resultado = service.listarColaboradoresComissao();

        assertEquals(2, resultado.size());

        // ColaboradorComissaoDTO é uma classe tradicional, mantém os gets normais
        ColaboradorComissaoDTO dto1 = resultado.get(0);
        assertEquals(1L, dto1.getUsuarioId());
        assertEquals("Colaborador Com Comissão", dto1.getUsuarioNome());
        assertEquals(10L, dto1.getComissaoId());
        assertEquals(new BigDecimal("0.6000"), dto1.getValor());

        ColaboradorComissaoDTO dto2 = resultado.get(1);
        assertEquals(2L, dto2.getUsuarioId());
        assertEquals("Colaborador Sem Comissão", dto2.getUsuarioNome());
        assertNull(dto2.getComissaoId());
        assertEquals(BigDecimal.ZERO, dto2.getValor());
    }
}