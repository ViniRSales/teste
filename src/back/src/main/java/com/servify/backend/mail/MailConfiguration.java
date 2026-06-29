package com.servify.backend.mail;

import java.nio.file.Path;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@EnableConfigurationProperties(GmailProperties.class)
public class MailConfiguration {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    @ConditionalOnProperty(name = "servify.gmail.enabled", havingValue = "true")
    public GmailMailSender gmailMailSender(GmailProperties properties) {
        if (properties.getSenderEmail() == null || properties.getSenderEmail().isBlank()) {
            throw new IllegalStateException(
                    "Defina servify.gmail.sender-email (conta Gmail do remetente OAuth) quando servify.gmail.enabled=true.");
        }
        Path base = Path.of("").toAbsolutePath().normalize();
        Path credentials = Path.of(properties.getCredentialsPath());
        if (!credentials.isAbsolute()) {
            credentials = base.resolve(credentials).normalize();
        }
        Path tokens = Path.of(properties.getTokensDirectory());
        if (!tokens.isAbsolute()) {
            tokens = base.resolve(tokens).normalize();
        }
        return new GmailMailSender(properties, credentials, tokens);
    }
}
