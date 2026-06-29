package com.servify.backend.service;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.servify.backend.constants.PerfilConstants;
import com.servify.backend.dto.LoginResponseDTO;
import com.servify.backend.entity.Convite;
import com.servify.backend.entity.Usuario;
import com.servify.backend.enums.ConviteStatus;
import com.servify.backend.repository.ConviteRepository;
import com.servify.backend.repository.UsuarioRepository;

@Service
public class AuthService {
  private final UsuarioRepository usuarioRepository;
  private final ConviteRepository conviteRepository;
  private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  public AuthService(UsuarioRepository usuarioRepository, ConviteRepository conviteRepository) {
    this.usuarioRepository = usuarioRepository;
    this.conviteRepository = conviteRepository;
  }

  private static String cargoFromPerfilId(Integer perfilId) {
    if (perfilId == null)
      return "";
    if (perfilId == PerfilConstants.ADMIN)
      return "adm";
    if (perfilId == PerfilConstants.COLABORADOR)
      return "colaborador";
    if (perfilId == PerfilConstants.CLIENTE)
      return "cliente";
    return "";
  }

  public LoginResponseDTO login(String login, String senha) {
    String l = login == null ? "" : login.trim();
    if (l.isBlank() || senha == null || senha.isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Informe login e senha.");
    }

    Optional<Usuario> userOpt = usuarioRepository.findByEmailIgnoreCase(l);
    if (userOpt.isEmpty()) {
      String cpfDigits = l.replaceAll("\\D", "");
      if (!cpfDigits.isBlank()) {
        userOpt = usuarioRepository.findByCpf(cpfDigits);
      }
    }

    Usuario user = userOpt.orElseThrow(
        () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não encontrado."));
    if (!passwordEncoder.matches(senha, user.getSenha())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Senha incorreta.");
    }

    LoginResponseDTO dto = new LoginResponseDTO();
    dto.setId(user.getId());
    dto.setPerfilId(user.getPerfil().getId());
    dto.setPerfilNome(user.getPerfil().getNome());
    dto.setCargo(cargoFromPerfilId(user.getPerfil().getId()));
    dto.setNome(user.getNome());
    dto.setEmail(user.getEmail());
    dto.setCadastroPendente(user.isCadastroPendente());
    if (user.isCadastroPendente()) {
      conviteRepository
          .findByEmailAndStatus(user.getEmail(), ConviteStatus.ATIVO)
          .map(Convite::getToken)
          .ifPresent(dto::setConviteToken);
    }
    return dto;
  }
}
