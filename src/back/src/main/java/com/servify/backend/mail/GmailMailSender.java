package com.servify.backend.mail;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.util.Base64;
import java.util.List;
import java.util.Properties;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.auth.oauth2.TokenResponse;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeRequestUrl;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.GmailScopes;
import com.google.api.services.gmail.model.Message;

import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;

import com.google.api.client.googleapis.json.GoogleJsonResponseException;

/**
 * Envio via Gmail API (OAuth2), sem SMTP. Usado para convites com token e senha provisória.
 * <p>
 * Dois modos de obter o refresh token: (1) {@code oauth-redirect-uri} definido — login no
 * navegador e troca do {@code code} no backend; (2) URI vazio — fluxo Desktop com porta 8888.
 */
public class GmailMailSender {

    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final List<String> SCOPES = List.of(GmailScopes.GMAIL_SEND);
    private static final String CREDENTIAL_USER_ID = "user";

    private final GmailProperties properties;
    private final Path credentialsPath;
    private final Path tokensDirectory;
    private volatile Gmail gmailClient;

    public GmailMailSender(GmailProperties properties, Path credentialsPath, Path tokensDirectory) {
        this.properties = properties;
        this.credentialsPath = credentialsPath;
        this.tokensDirectory = tokensDirectory;
    }

    public boolean isBrowserFlowConfigured() {
        String uri = properties.getOauthRedirectUri();
        return uri != null && !uri.isBlank();
    }

    /**
     * URL para redirecionar o administrador ao Google (escopo envio Gmail + offline).
     */
    public String buildBrowserAuthorizationUrl() throws IOException {
        if (!isBrowserFlowConfigured()) {
            throw new GmailMailException(
                    "Defina servify.gmail.oauth-redirect-uri com a URL do callback no front (ex.: http://localhost:5173/oauth/google/callback).");
        }
        try (Reader reader = new InputStreamReader(Files.newInputStream(credentialsPath), StandardCharsets.UTF_8)) {
            GoogleClientSecrets secrets = GoogleClientSecrets.load(JSON_FACTORY, reader);
            if (secrets.getDetails().getClientId() == null || secrets.getDetails().getClientId().isBlank()) {
                throw new GmailMailException("client_id ausente em credentials.json (use cliente OAuth tipo \"Aplicativo da Web\").");
            }
            String redirect = properties.getOauthRedirectUri().trim();
            return new GoogleAuthorizationCodeRequestUrl(secrets, redirect, SCOPES)
                    .setAccessType("offline")
                    .set("prompt", "consent")
                    .build();
        }
    }

    /**
     * Troca o código da query string por tokens e grava em {@code tokensDirectory} (mesmo formato do Google client).
     */
    public synchronized void exchangeAuthorizationCode(String code) throws IOException {
        if (code == null || code.isBlank()) {
            throw new GmailMailException("Código de autorização vazio.");
        }
        if (!isBrowserFlowConfigured()) {
            throw new GmailMailException("Fluxo OAuth pelo navegador não está configurado (oauth-redirect-uri).");
        }
        if (!Files.isRegularFile(credentialsPath)) {
            throw new GmailMailException(
                    "credentials.json não encontrado em: " + credentialsPath.toAbsolutePath());
        }
        NetHttpTransport transport;
        try {
            transport = GoogleNetHttpTransport.newTrustedTransport();
        } catch (GeneralSecurityException e) {
            throw new GmailMailException("Falha de segurança ao preparar cliente HTTP: " + e.getMessage(), e);
        }
        GoogleAuthorizationCodeFlow flow = buildFlow(transport);
        TokenResponse response = flow.newTokenRequest(code)
                .setRedirectUri(properties.getOauthRedirectUri().trim())
                .execute();
        flow.createAndStoreCredential(response, CREDENTIAL_USER_ID);
        gmailClient = null;
    }

    public boolean hasStoredCredential() {
        if (!Files.isRegularFile(credentialsPath)) {
            return false;
        }
        try {
            NetHttpTransport transport = GoogleNetHttpTransport.newTrustedTransport();
            GoogleAuthorizationCodeFlow flow = buildFlow(transport);
            return flow.loadCredential(CREDENTIAL_USER_ID) != null;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Envia o token da tabela {@code convite} e a senha provisória em texto para primeiro login.
     */
    public void sendConviteEmail(String destinatario, String conviteToken, String senhaProvisoria, int horasValidadeConvite) {
        if (destinatario == null || destinatario.isBlank()) {
            throw new GmailMailException("Destinatário inválido.");
        }
        if (conviteToken == null || conviteToken.isBlank()) {
            throw new GmailMailException("Token do convite vazio.");
        }
        if (senhaProvisoria == null || senhaProvisoria.isBlank()) {
            throw new GmailMailException("Senha provisória vazia.");
        }
        try {
            Gmail gmail = getOrCreateGmailClient();
            MimeMessage mime = buildConviteMime(destinatario, conviteToken, senhaProvisoria, horasValidadeConvite);
            sendRaw(gmail, mime);
        } catch (GmailMailException e) {
            throw e;
        } catch (Exception e) {
            throw new GmailMailException("Falha ao enviar e-mail via Gmail API: " + e.getMessage(), e);
        }
    }

    private Gmail getOrCreateGmailClient() throws Exception {
        if (gmailClient != null) {
            return gmailClient;
        }
        synchronized (this) {
            if (gmailClient != null) {
                return gmailClient;
            }
            NetHttpTransport transport = GoogleNetHttpTransport.newTrustedTransport();
            Credential credential = authorize(transport);
            gmailClient = new Gmail.Builder(transport, JSON_FACTORY, credential)
                    .setApplicationName(properties.getApplicationName())
                    .build();
            return gmailClient;
        }
    }

    private GoogleAuthorizationCodeFlow buildFlow(NetHttpTransport httpTransport) throws IOException {
        try (Reader reader = new InputStreamReader(Files.newInputStream(credentialsPath), StandardCharsets.UTF_8)) {
            GoogleClientSecrets secrets = GoogleClientSecrets.load(JSON_FACTORY, reader);
            return new GoogleAuthorizationCodeFlow.Builder(
                    httpTransport, JSON_FACTORY, secrets, SCOPES)
                    .setDataStoreFactory(new FileDataStoreFactory(tokensDirectory.toFile()))
                    .setAccessType("offline")
                    .build();
        }
    }

    private Credential authorize(NetHttpTransport httpTransport) throws IOException {
        if (!Files.isRegularFile(credentialsPath)) {
            throw new GmailMailException(
                    "credentials.json não encontrado em: " + credentialsPath.toAbsolutePath());
        }
        GoogleAuthorizationCodeFlow flow = buildFlow(httpTransport);

        if (isBrowserFlowConfigured()) {
            Credential stored = flow.loadCredential(CREDENTIAL_USER_ID);
            if (stored != null) {
                return stored;
            }
            throw new GmailMailException(
                    "Gmail ainda não foi autorizado. No painel, use \"Conectar Gmail\" e faça login no Google.");
        }

        LocalServerReceiver receiver = new LocalServerReceiver.Builder().setPort(8888).build();
        try {
            return new AuthorizationCodeInstalledApp(flow, receiver).authorize(CREDENTIAL_USER_ID);
        } finally {
            receiver.stop();
        }
    }

    private MimeMessage buildConviteMime(String to, String token, String senha, int horas) throws Exception {
        Session session = Session.getDefaultInstance(new Properties(), null);
        MimeMessage message = new MimeMessage(session);
        message.setFrom(new InternetAddress(properties.getSenderEmail()));
        message.addRecipient(jakarta.mail.Message.RecipientType.TO, new InternetAddress(to));
        message.setSubject("Convite Servify — token e senha provisória", StandardCharsets.UTF_8.name());

        String base = properties.getFrontendBaseUrl() == null ? ""
                : properties.getFrontendBaseUrl().trim().replaceAll("/+$", "");
        String urlCompletar = base.isBlank() ? "" : base + "/convite/" + token;
        String html = ConviteEmailTemplate.build(urlCompletar, token, senha, horas);
        String plain = (urlCompletar.isBlank() ? "" : "Completar cadastro: " + urlCompletar + "\n\n")
                + "Token do convite: " + token + "\nSenha provisória: " + senha
                + "\n\nVálido por " + horas + " horas.";

        MimeBodyPart textPart = new MimeBodyPart();
        textPart.setText(plain, StandardCharsets.UTF_8.name());

        MimeBodyPart htmlPart = new MimeBodyPart();
        htmlPart.setContent(html, "text/html; charset=UTF-8");

        MimeMultipart alternative = new MimeMultipart("alternative");
        alternative.addBodyPart(textPart);
        alternative.addBodyPart(htmlPart);
        message.setContent(alternative);
        return message;
    }

    private void sendRaw(Gmail gmail, MimeMessage mimeMessage) throws Exception {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        mimeMessage.writeTo(buffer);
        String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(buffer.toByteArray());
        Message apiMessage = new Message();
        apiMessage.setRaw(encoded);
        try {
            gmail.users().messages().send("me", apiMessage).execute();
        } catch (GoogleJsonResponseException e) {
            throw new GmailMailException("Gmail API: " + e.getStatusCode() + " — " + e.getDetails(), e);
        }
    }

    public static final class GmailMailException extends RuntimeException {
        public GmailMailException(String message) {
            super(message);
        }

        public GmailMailException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
