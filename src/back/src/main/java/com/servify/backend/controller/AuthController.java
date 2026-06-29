package com.servify.backend.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.servify.backend.dto.LoginRequestDTO;
import com.servify.backend.dto.LoginResponseDTO;
import com.servify.backend.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {
  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  public LoginResponseDTO login(@Valid @RequestBody LoginRequestDTO dto) {
    return authService.login(dto.getLogin(), dto.getSenha());
  }

  @ResponseStatus(HttpStatus.UNAUTHORIZED)
  @ExceptionHandler(ResponseStatusException.class)
  public Map<String, String> handleStatus(ResponseStatusException ex) {
    String msg = ex.getReason();
    if (msg == null || msg.isBlank()) msg = "Não autorizado.";
    return Map.of("message", msg);
  }
}

