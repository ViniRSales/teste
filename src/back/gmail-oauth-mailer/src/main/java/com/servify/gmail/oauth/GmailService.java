package com.servify.gmail.oauth;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.Message;

import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.List;
import java.util.Objects;
import java.util.Properties;

/**
 * Serviço de envio via <b>Gmail API</b> (REST {@code users.messages.send}), com OAuth2.
 * Não utiliza SMTP nem senha de aplicativo.
 */
public final class GmailService {

    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    private final GmailConfig config;
    private volatile Gmail gmailClient;

    public GmailService(GmailConfig config) {
        this.config = Objects.requireNonNull(config, "config");
    }

    /**
     * Envia um e-mail HTML com o token em destaque e aviso de expiração.
     *
     * @param destinatario endereço válido do destinatário
     * @param token          código exibido de forma destacada no HTML
     * @throws GmailSendException em falhas de I/O, credenciais, API ou MIME
     */
    public void sendTokenEmail(String destinatario, String token) {
        sendTokenEmail(destinatario, token, config.getDefaultTokenSubject());
    }

    /**
     * Mesmo que {@link #sendTokenEmail(String, String)}, permitindo assunto customizado.
     */
    public void sendTokenEmail(String destinatario, String token, String subject) {
        if (destinatario == null || destinatario.isBlank()) {
            throw new GmailSendException("Destinatário inválido.");
        }
        if (token == null || token.isBlank()) {
            throw new GmailSendException("Token vazio.");
        }
        if (subject == null || subject.isBlank()) {
            throw new GmailSendException("Assunto inválido.");
        }

        try {
            Gmail gmail = getOrCreateGmailClient();
            MimeMessage mimeMessage = buildMimeMessage(destinatario, subject, token);
            sendMimeMessage(gmail, mimeMessage);
        } catch (GmailSendException e) {
            throw e;
        } catch (Exception e) {
            throw new GmailSendException("Falha ao enviar e-mail via Gmail API: " + e.getMessage(), e);
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
            NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
            Credential credential = authorize(httpTransport);
            gmailClient = new Gmail.Builder(httpTransport, JSON_FACTORY, credential)
                    .setApplicationName(config.getApplicationName())
                    .build();
            return gmailClient;
        }
    }

    /**
     * Lê {@code credentials.json}, abre o navegador na primeira vez e persiste tokens em {@link GmailConfig#getTokensDirectory()}.
     */
    private Credential authorize(NetHttpTransport httpTransport) throws IOException {
        Path credentialsPath = config.getCredentialsPath();
        if (!Files.isRegularFile(credentialsPath)) {
            throw new GmailSendException(
                    "Arquivo de credenciais não encontrado: " + credentialsPath.toAbsolutePath()
                            + ". Baixe o JSON OAuth (tipo Desktop) no Google Cloud e salve como credentials.json."
            );
        }

        try (Reader reader = new InputStreamReader(Files.newInputStream(credentialsPath), StandardCharsets.UTF_8)) {
            GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(JSON_FACTORY, reader);
            List<String> scopes = config.getScopes();

            GoogleAuthorizationCodeFlow flow =
                    new GoogleAuthorizationCodeFlow.Builder(
                            httpTransport, JSON_FACTORY, clientSecrets, scopes)
                            .setDataStoreFactory(new FileDataStoreFactory(config.getTokensDirectory().toFile()))
                            .setAccessType("offline")
                            .build();

            LocalServerReceiver receiver = new LocalServerReceiver.Builder().setPort(8888).build();
            try {
                return new AuthorizationCodeInstalledApp(flow, receiver).authorize("user");
            } finally {
                receiver.stop();
            }
        }
    }

    private MimeMessage buildMimeMessage(String to, String subject, String token) throws Exception {
        Properties props = new Properties();
        Session session = Session.getDefaultInstance(props, null);

        MimeMessage message = new MimeMessage(session);
        message.setFrom(new InternetAddress(config.getSenderEmail()));
        message.addRecipient(jakarta.mail.Message.RecipientType.TO, new InternetAddress(to));
        message.setSubject(subject, StandardCharsets.UTF_8.name());

        String html = EmailTemplate.buildTokenEmailHtml(
                config.getApplicationName(),
                token,
                config.getTokenValidityMinutes()
        );

        MimeBodyPart textPart = new MimeBodyPart();
        textPart.setText(
                "Seu código de verificação: " + token
                        + ". Ele expira em " + config.getTokenValidityMinutes() + " minutos.",
                StandardCharsets.UTF_8.name()
        );

        MimeBodyPart htmlPart = new MimeBodyPart();
        htmlPart.setContent(html, "text/html; charset=UTF-8");

        MimeMultipart alternative = new MimeMultipart("alternative");
        alternative.addBodyPart(textPart);
        alternative.addBodyPart(htmlPart);
        message.setContent(alternative);

        return message;
    }

    private void sendMimeMessage(Gmail gmail, MimeMessage mimeMessage) throws Exception {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        mimeMessage.writeTo(buffer);
        byte[] rawBytes = buffer.toByteArray();
        String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(rawBytes);

        Message message = new Message();
        message.setRaw(encoded);

        try {
            gmail.users().messages().send("me", message).execute();
        } catch (GoogleJsonResponseException e) {
            throw new GmailSendException(
                    "Gmail API retornou erro " + e.getStatusCode() + ": " + e.getDetails(), e);
        }
    }

    /**
     * Exceção de domínio para falhas de envio; facilita tratamento na camada de aplicação.
     */
    public static final class GmailSendException extends RuntimeException {
        public GmailSendException(String message) {
            super(message);
        }

        public GmailSendException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
