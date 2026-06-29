package com.servify.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.servify.backend.dto.UsuarioRequestDTO;
import com.servify.backend.dto.UsuarioResponseDTO;
import com.servify.backend.dto.UsuarioUpdateDTO;
import com.servify.backend.entity.Perfil;
import com.servify.backend.entity.Usuario;
import com.servify.backend.repository.AgendaDisponibilidadeRepository;
import com.servify.backend.repository.AgendamentoRepository;
import com.servify.backend.repository.ComissaoRepository;
import com.servify.backend.repository.PerfilRepository;
import com.servify.backend.repository.UsuarioRepository;

public class UsuarioServiceTest {
        @Mock
        private UsuarioRepository usuarioRepository;

        @Mock
        private PerfilRepository perfilRepository;

        @Mock
        private ComissaoRepository comissaoRepository;

        @Mock
        private AgendamentoRepository agendamentoRepository;

        @Mock
        private AgendaDisponibilidadeRepository agendaDisponibilidadeRepository;

        private UsuarioService service;

        @BeforeEach
        public void setUp() {
                MockitoAnnotations.openMocks(this);
                service = new UsuarioService(usuarioRepository,
                                perfilRepository,
                                comissaoRepository,
                                agendamentoRepository,
                                agendaDisponibilidadeRepository);
        }

        private Perfil criarPerfilMock() {
                Perfil perfil = new Perfil();

                perfil.setId(1);
                perfil.setNome("CLIENTE");

                return perfil;
        }

        private UsuarioRequestDTO criarUsuarioRequestDTO() {
                UsuarioRequestDTO dto = new UsuarioRequestDTO();

                dto.setPerfilId(1);
                dto.setCpf("12345678901");
                dto.setNome("Teste Servify");
                dto.setEmail("teste@email.com");
                dto.setSenha("123456");
                dto.setTelefone("31111111111");
                dto.setDataNascimento(LocalDate.of(2000, 1, 1));
                dto.setCep("30140071");
                dto.setLogradouro("Rua A");
                dto.setNumero("100");
                dto.setComplemento("Casa");
                dto.setBairro("Centro");
                dto.setCidade("Belo Horizonte");
                dto.setUf("MG");

                return dto;
        }

        private UsuarioUpdateDTO criarUsuarioUpdateDTO() {
                UsuarioUpdateDTO dto = new UsuarioUpdateDTO();

                dto.setPerfilId(1);
                dto.setNome("Teste Servify");
                dto.setEmail("teste@email.com");
                dto.setTelefone("31111111111");
                dto.setDataNascimento(LocalDate.of(1990, 5, 15));
                dto.setCep("30140071");
                dto.setLogradouro("Rua A");
                dto.setNumero("100");
                dto.setComplemento("Casa");
                dto.setBairro("Centro");
                dto.setCidade("Belo Horizonte");
                dto.setUf("MG");

                return dto;
        }

        @Test
        public void deveCriptografarSenhaAoCriarUsuario() {
                Perfil perfil = criarPerfilMock();
                UsuarioRequestDTO dto = criarUsuarioRequestDTO();

                when(perfilRepository.findById(1))
                                .thenReturn(Optional.of(perfil));

                when(usuarioRepository.save(any(Usuario.class)))
                                .thenAnswer(invocation -> invocation.getArgument(0));

                service.criar(dto);

                ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);

                verify(usuarioRepository).save(captor.capture());

                Usuario usuarioSalvo = captor.getValue();

                assertNotEquals("123456", usuarioSalvo.getSenha());
                assertTrue(usuarioSalvo.getSenha().startsWith("$2"));
        }

        @Test
        public void deveNormalizarCpfAoCriarUsuario() {
                Perfil perfil = criarPerfilMock();
                UsuarioRequestDTO dto = criarUsuarioRequestDTO();
                dto.setCpf("123.456.789-01");

                when(perfilRepository.findById(1))
                                .thenReturn(Optional.of(perfil));

                when(usuarioRepository.save(any(Usuario.class)))
                                .thenAnswer(invocation -> invocation.getArgument(0));

                service.criar(dto);

                ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);

                verify(usuarioRepository).save(captor.capture());

                Usuario usuarioSalvo = captor.getValue();

                assertEquals("12345678901", usuarioSalvo.getCpf());
        }

        @Test
        public void deveNormalizarTelefoneAoCriarUsuario() {
                Perfil perfil = criarPerfilMock();
                UsuarioRequestDTO dto = criarUsuarioRequestDTO();
                dto.setTelefone("(31) 99999-9999");

                when(perfilRepository.findById(1))
                                .thenReturn(Optional.of(perfil));

                when(usuarioRepository.save(any(Usuario.class)))
                                .thenAnswer(invocation -> invocation.getArgument(0));

                service.criar(dto);

                ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);

                verify(usuarioRepository).save(captor.capture());

                Usuario usuarioSalvo = captor.getValue();

                assertEquals("31999999999", usuarioSalvo.getTelefone());
        }

        @Test
        public void deveAtualizarUsuario() {
                // Simula um perfil e usuário existentes no banco de dados
                Perfil perfil = criarPerfilMock();
                Usuario usuario = new Usuario();

                usuario.setId(1L);
                usuario.setPerfil(perfil);
                usuario.setTelefone("31999999999");

                // Simula um usuário atualizado vindo da requisição
                UsuarioUpdateDTO dto = criarUsuarioUpdateDTO();

                // Altera o telefone para um valor não normalizado para testar a normalização na
                // atualização
                dto.setTelefone("(31) 11111-1111");

                // Configura o mock para retornar o usuário existente
                when(usuarioRepository.findById(1L))
                                .thenReturn(Optional.of(usuario));

                when(perfilRepository.findById(1))
                                .thenReturn(Optional.of(perfil));

                // Configura o mock para retornar o usuário atualizado ao salvar
                when(usuarioRepository.save(any(Usuario.class)))
                                .thenAnswer(invocation -> invocation.getArgument(0));

                // Chama o método de atualização
                UsuarioResponseDTO response = service.atualizar(1L, dto);

                // Verifica se o telefone foi atualizado corretamente
                assertEquals("31111111111", response.getTelefone());
                assertEquals(LocalDate.of(1990, 5, 15), response.getDataNascimento());
        }

        @Test
        public void deveBuscarUsuarioPorId() {
                Perfil perfil = criarPerfilMock();
                Usuario usuario = new Usuario();

                usuario.setId(1L);
                usuario.setPerfil(perfil);
                usuario.setCpf("12345678901");
                usuario.setNome("Teste Servify");
                usuario.setEmail("teste@email.com");
                usuario.setSenha("123456");
                usuario.setTelefone("31999999999");
                usuario.setDataNascimento(LocalDate.of(2000, 1, 1));
                usuario.setCep("30140071");
                usuario.setLogradouro("Rua A");
                usuario.setNumero("100");
                usuario.setComplemento("Casa");
                usuario.setBairro("Centro");
                usuario.setCidade("Belo Horizonte");
                usuario.setUf("MG");

                when(usuarioRepository.findById(1L))
                                .thenReturn(Optional.of(usuario));

                UsuarioResponseDTO response = service.buscarPorId(1L);

                assertEquals(1L, response.getId());
                assertEquals(1, response.getPerfilId());
                assertEquals("CLIENTE", response.getPerfilNome());
                assertEquals("Teste Servify", response.getNome());
                assertEquals("12345678901", response.getCpf());
                assertEquals("teste@email.com", response.getEmail());
        }

        @Test
        public void deveLancarExcecaoQuandoUsuarioNaoExiste() {
                when(usuarioRepository.findById(1L))
                                .thenReturn(Optional.empty());

                RuntimeException exception = assertThrows(
                                RuntimeException.class,
                                () -> service.buscarPorId(1L));

                assertEquals(
                                "Usuário não encontrado",
                                exception.getMessage());
        }

        @Test
        public void deveLancarExcecaoQuandoPerfilNaoExiste() {

                UsuarioRequestDTO dto = criarUsuarioRequestDTO();
                dto.setPerfilId(99);

                when(perfilRepository.findById(99))
                                .thenReturn(Optional.empty());

                RuntimeException exception = assertThrows(
                                RuntimeException.class,
                                () -> service.criar(dto));

                assertEquals("Perfil não encontrado", exception.getMessage());
        }

        @Test
        public void deveDeletarUsuario() {
                Usuario usuario = new Usuario();
                usuario.setId(1L);

                when(usuarioRepository.findById(1L))
                                .thenReturn(Optional.of(usuario));

                service.deletar(1L);

                verify(usuarioRepository).delete(usuario);
        }
}
