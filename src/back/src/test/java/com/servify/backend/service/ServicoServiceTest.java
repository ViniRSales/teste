package com.servify.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.servify.backend.dto.ServicoRequestDTO;
import com.servify.backend.dto.ServicoResponseDTO;
import com.servify.backend.entity.Servico;
import com.servify.backend.repository.ServicoRepository;

public class ServicoServiceTest {

    @Mock
    private ServicoRepository servicoRepository;

    private ServicoService service;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new ServicoService(servicoRepository);
    }

    private ServicoRequestDTO criarServicoRequestDTO() {
        ServicoRequestDTO dto = new ServicoRequestDTO();
        dto.setNome("  Corte de Cabelo Masculino  ");
        dto.setValor(new BigDecimal("50.00"));
        dto.setDuracaoMinutos(30);
        dto.setIcone("scissors");
        dto.setAtivo(true);
        return dto;
    }

    private Servico criarServicoMock() {
        Servico servico = new Servico();
        servico.setId(1L);
        servico.setNome("Corte de Cabelo Masculino");
        servico.setValor(new BigDecimal("50.00"));
        servico.setDuracaoMinutos(30);
        servico.setIcone("scissors");
        servico.setAtivo(true);
        return servico;
    }

    @Test
    public void deveCriarServicoComSucessoQuandoDadosEIconeForeValidos() {
        ServicoRequestDTO dto = criarServicoRequestDTO();
        Servico servicoSalvo = criarServicoMock();

        when(servicoRepository.save(any(Servico.class))).thenReturn(servicoSalvo);

        ServicoResponseDTO response = service.criar(dto);

        ArgumentCaptor<Servico> servicoCaptor = ArgumentCaptor.forClass(Servico.class);
        verify(servicoRepository).save(servicoCaptor.capture());

        Servico servicoInterno = servicoCaptor.getValue();
        assertEquals("Corte de Cabelo Masculino", servicoInterno.getNome());
        assertEquals("scissors", servicoInterno.getIcone());

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Corte de Cabelo Masculino", response.getNome());
    }

    @Test
    public void deveLancarExcecaoBadRequestAoCriarComIconeInvalido() {
        ServicoRequestDTO dto = criarServicoRequestDTO();
        dto.setIcone("icone_inexistente_no_set");

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.criar(dto));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals("Ícone inválido.", exception.getReason());
        verify(servicoRepository, never()).save(any(Servico.class));
    }

    @Test
    public void deveBuscarServicoPorIdComSucesso() {
        Servico servico = criarServicoMock();
        when(servicoRepository.findById(1L)).thenReturn(Optional.of(servico));

        ServicoResponseDTO response = service.buscarPorId(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Corte de Cabelo Masculino", response.getNome());
    }

    @Test
    public void deveLancarExcecaoNotFoundQuandoBuscarPorIdInexistente() {
        when(servicoRepository.findById(1L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.buscarPorId(1L));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertEquals("Serviço não encontrado.", exception.getReason());
    }

    @Test
    public void deveListarTodosOsServicosQuandoNomeForNulo() {
        Servico servico = criarServicoMock();
        when(servicoRepository.findAllByOrderByNomeAsc()).thenReturn(List.of(servico));

        List<ServicoResponseDTO> resultado = service.listar(null);

        assertEquals(1, resultado.size());
        assertEquals("Corte de Cabelo Masculino", resultado.get(0).getNome());
        verify(servicoRepository).findAllByOrderByNomeAsc();
        verify(servicoRepository, never()).findByNomeContainingIgnoreCaseOrderByNomeAsc(any());
    }

    @Test
    public void deveListarServicosFiltradosQuandoNomeForFornecido() {
        Servico servico = criarServicoMock();
        when(servicoRepository.findByNomeContainingIgnoreCaseOrderByNomeAsc("Corte"))
                .thenReturn(List.of(servico));

        List<ServicoResponseDTO> resultado = service.listar("  Corte  ");

        assertEquals(1, resultado.size());
        verify(servicoRepository).findByNomeContainingIgnoreCaseOrderByNomeAsc("Corte");
        verify(servicoRepository, never()).findAllByOrderByNomeAsc();
    }

    @Test
    public void deveAtualizarServicoComSucesso() {
        Servico servicoExistente = criarServicoMock();
        ServicoRequestDTO dtoAlteracao = criarServicoRequestDTO();
        dtoAlteracao.setNome("Corte Alterado");
        dtoAlteracao.setIcone("sparkles");

        when(servicoRepository.findById(1L)).thenReturn(Optional.of(servicoExistente));
        when(servicoRepository.save(any(Servico.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ServicoResponseDTO response = service.atualizar(1L, dtoAlteracao);

        assertNotNull(response);
        assertEquals("Corte Alterado", response.getNome());
        assertEquals("sparkles", response.getIcone());
    }

    @Test
    public void deveExcluirServicoComSucessoQuandoIdExistir() {
        when(servicoRepository.existsById(1L)).thenReturn(true);

        service.excluir(1L);

        verify(servicoRepository).deleteById(1L);
    }

    @Test
    public void deveLancarExcecaoNotFoundAoExcluirServicoInexistente() {
        when(servicoRepository.existsById(1L)).thenReturn(false);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.excluir(1L));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertEquals("Serviço não encontrado.", exception.getReason());
        verify(servicoRepository, never()).deleteById(1L);
    }
}