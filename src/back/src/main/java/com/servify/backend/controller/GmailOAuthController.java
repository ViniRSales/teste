package com.servify.backend.controller;

import java.io.IOException;
import java.util.Map;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.servify.backend.mail.GmailMailSender;
import com.servify.backend.mail.GmailMailSender.GmailMailException;

@RestController
@RequestMapping("/mail/gmail")
@ConditionalOnBean(GmailMailSender.class)
public class GmailOAuthController {

    private final GmailMailSender gmailMailSender;

    public GmailOAuthController(GmailMailSender gmailMailSender) {
        this.gmailMailSender = gmailMailSender;
    }

    @GetMapping("/oauth/authorize-url")
    public Map<String, String> authorizeUrl() {
        try {
            return Map.of("url", gmailMailSender.buildBrowserAuthorizationUrl());
        } catch (IOException e) {
            throw new GmailMailException("Não foi possível montar a URL de autorização: " + e.getMessage(), e);
        }
    }

    @PostMapping("/oauth/exchange")
    public ResponseEntity<Void> exchange(@RequestBody Map<String, String> body) {
        String code = body != null ? body.get("code") : null;
        try {
            gmailMailSender.exchangeAuthorizationCode(code);
            return ResponseEntity.noContent().build();
        } catch (IOException e) {
            throw new GmailMailException("Falha ao trocar o código OAuth: " + e.getMessage(), e);
        }
    }

    @GetMapping("/oauth/status")
    public Map<String, Object> status() {
        return Map.of(
                "connected", gmailMailSender.hasStoredCredential(),
                "browserFlowConfigured", gmailMailSender.isBrowserFlowConfigured());
    }
}
