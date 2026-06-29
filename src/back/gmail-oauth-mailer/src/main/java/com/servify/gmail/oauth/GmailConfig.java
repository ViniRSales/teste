package com.servify.gmail.oauth;

import com.google.api.services.gmail.GmailScopes;

import java.nio.file.Path;
import java.util.List;

/**
 * Configuração central do fluxo Gmail API + OAuth2.
 * <p>
 * <b>Onde colocar o {@code credentials.json}</b>
 * <ul>
 *   <li>Por padrão, este projeto procura o arquivo no <b>diretório de trabalho atual</b>
 *       (normalmente a pasta {@code gmail-oauth-mailer} ao executar {@code mvn exec:java}).</li>
 *   <li>Recomendado: copiar {@code credentials.json} para a raiz do módulo
 *       {@code gmail-oauth-mailer/credentials.json} e executar os comandos Maven a partir dessa pasta.</li>
 *   <li><b>Nunca</b> versionar {@code credentials.json} nem a pasta {@code tokens/} no Git.</li>
 * </ul>
 * <p>
 * <b>Como ativar a Gmail API no Google Cloud</b>
 * <ol>
 *   <li>Acesse <a href="https://console.cloud.google.com/">Google Cloud Console</a> e crie um projeto
 *       (ou selecione um existente).</li>
 *   <li>Menu <b>APIs e serviços</b> &gt; <b>Biblioteca</b> &gt; pesquise <b>Gmail API</b> &gt; <b>Ativar</b>.</li>
 *   <li>Menu <b>APIs e serviços</b> &gt; <b>Tela de consentimento OAuth</b>: configure (tipo Externo para testes),
 *       adicione seu e-mail como usuário de teste se o app estiver em modo de teste.</li>
 *   <li>Menu <b>APIs e serviços</b> &gt; <b>Credenciais</b> &gt; <b>Criar credenciais</b> &gt;
 *       <b>ID do cliente OAuth</b> &gt; tipo de aplicativo <b>Aplicativo para computador</b>
 *       (Desktop) — necessário para o fluxo com {@code LocalServerReceiver}.</li>
 *   <li>Baixe o JSON e renomeie para {@code credentials.json} na pasta do módulo.</li>
 *   <li>Na primeira execução, o navegador abrirá para consentimento; o token de acesso/refresh será salvo
 *       em disco (pasta {@code tokens/}) para reutilização automática.</li>
 * </ol>
 * <p>
 * O escopo usado é apenas envio ({@link GmailScopes#GMAIL_SEND}), sem leitura da caixa de entrada.
 */
public final class GmailConfig {

    /** Nome exibido nas telas de consentimento e nos logs da API (pode ser o nome do produto). */
    private final String applicationName;

    /** Caminho absoluto do JSON de credenciais OAuth (tipo "installed" / desktop). */
    private final Path credentialsPath;

    /** Diretório onde o token OAuth (refresh) é persistido pelo {@link com.google.api.client.util.store.FileDataStoreFactory}. */
    private final Path tokensDirectory;

    /** Endereço "From" RFC822; deve ser o mesmo usuário Gmail que autorizou o OAuth. */
    private final String senderEmail;

    /** Assunto padrão dos e-mails de código/token. */
    private final String defaultTokenSubject;

    /** Minutos exibidos no HTML como tempo de validade do token. */
    private final int tokenValidityMinutes;

    private final List<String> scopes;

    private GmailConfig(
            String applicationName,
            Path credentialsPath,
            Path tokensDirectory,
            String senderEmail,
            String defaultTokenSubject,
            int tokenValidityMinutes,
            List<String> scopes
    ) {
        this.applicationName = applicationName;
        this.credentialsPath = credentialsPath;
        this.tokensDirectory = tokensDirectory;
        this.senderEmail = senderEmail;
        this.defaultTokenSubject = defaultTokenSubject;
        this.tokenValidityMinutes = tokenValidityMinutes;
        this.scopes = List.copyOf(scopes);
    }

    /**
     * Configuração padrão: {@code credentials.json} e pasta {@code tokens} no diretório de trabalho atual.
     * Ajuste {@link #senderEmail} para o Gmail que fará o login no OAuth.
     */
    public static GmailConfig defaults(String senderGmailAddress) {
        Path base = Path.of("").toAbsolutePath().normalize();
        return new GmailConfig(
                "Servify Gmail OAuth Mailer",
                base.resolve("credentials.json"),
                base.resolve("tokens"),
                senderGmailAddress,
                "Seu código de verificação",
                15,
                List.of(GmailScopes.GMAIL_SEND)
        );
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getApplicationName() {
        return applicationName;
    }

    public Path getCredentialsPath() {
        return credentialsPath;
    }

    public Path getTokensDirectory() {
        return tokensDirectory;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public String getDefaultTokenSubject() {
        return defaultTokenSubject;
    }

    public int getTokenValidityMinutes() {
        return tokenValidityMinutes;
    }

    public List<String> getScopes() {
        return scopes;
    }

    public static final class Builder {
        private String applicationName = "Servify Gmail OAuth Mailer";
        private Path credentialsPath = Path.of("credentials.json").toAbsolutePath().normalize();
        private Path tokensDirectory = Path.of("tokens").toAbsolutePath().normalize();
        private String senderEmail;
        private String defaultTokenSubject = "Seu código de verificação";
        private int tokenValidityMinutes = 15;
        private List<String> scopes = List.of(GmailScopes.GMAIL_SEND);

        public Builder applicationName(String applicationName) {
            this.applicationName = applicationName;
            return this;
        }

        public Builder credentialsPath(Path credentialsPath) {
            this.credentialsPath = credentialsPath;
            return this;
        }

        public Builder tokensDirectory(Path tokensDirectory) {
            this.tokensDirectory = tokensDirectory;
            return this;
        }

        public Builder senderEmail(String senderEmail) {
            this.senderEmail = senderEmail;
            return this;
        }

        public Builder defaultTokenSubject(String defaultTokenSubject) {
            this.defaultTokenSubject = defaultTokenSubject;
            return this;
        }

        public Builder tokenValidityMinutes(int tokenValidityMinutes) {
            this.tokenValidityMinutes = tokenValidityMinutes;
            return this;
        }

        public Builder scopes(List<String> scopes) {
            this.scopes = List.copyOf(scopes);
            return this;
        }

        public GmailConfig build() {
            if (senderEmail == null || senderEmail.isBlank()) {
                throw new IllegalStateException("senderEmail é obrigatório");
            }
            return new GmailConfig(
                    applicationName,
                    credentialsPath,
                    tokensDirectory,
                    senderEmail,
                    defaultTokenSubject,
                    tokenValidityMinutes,
                    scopes
            );
        }
    }
}
