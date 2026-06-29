package com.servify.backend.exception;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.servify.backend.mail.GmailMailSender.GmailMailException;

@RestControllerAdvice
public class GmailMailExceptionHandler {

    @ExceptionHandler(GmailMailException.class)
    public ResponseEntity<Map<String, String>> handle(GmailMailException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }
}
