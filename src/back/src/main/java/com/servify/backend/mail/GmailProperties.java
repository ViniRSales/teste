package com.servify.backend.mail;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuração Gmail API (OAuth2). Ative com {@code servify.gmail.enabled=true}.
 * <p>
 * Coloque {@code credentials.json} (cliente OAuth tipo Desktop) no caminho indicado em {@code credentials-path}
 * (caminho absoluto ou relativo ao diretório de trabalho da aplicação).
 */
@ConfigurationProperties(prefix = "servify.gmail")
public class GmailProperties {

    private boolean enabled = false;
    private String applicationName = "Servify Backend";
    /** Conta Gmail que autoriza o OAuth (remetente). */
    private String senderEmail = "";
    private String credentialsPath = "credentials.json";
    private String tokensDirectory = "tokens";
    /**
     * URL exata do front para onde o Google redireciona após o login (ex.:
     * {@code http://localhost:5173/oauth/google/callback}). Deve ser igual à
     * “URI de redirecionamento autorizada” no cliente OAuth (tipo Web) do Google Cloud.
     * Se vazio, o backend usa o fluxo “Desktop” com servidor local na porta 8888.
     */
    private String oauthRedirectUri = "";

    /**
     * URL base do front (sem barra final), usada no e-mail de convite para o link
     * {@code /convite/{token}}. Ex.: {@code http://localhost:5173}
     */
    private String frontendBaseUrl = "http://localhost:5173";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getApplicationName() {
        return applicationName;
    }

    public void setApplicationName(String applicationName) {
        this.applicationName = applicationName;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public void setSenderEmail(String senderEmail) {
        this.senderEmail = senderEmail;
    }

    public String getCredentialsPath() {
        return credentialsPath;
    }

    public void setCredentialsPath(String credentialsPath) {
        this.credentialsPath = credentialsPath;
    }

    public String getTokensDirectory() {
        return tokensDirectory;
    }

    public void setTokensDirectory(String tokensDirectory) {
        this.tokensDirectory = tokensDirectory;
    }

    public String getOauthRedirectUri() {
        return oauthRedirectUri;
    }

    public void setOauthRedirectUri(String oauthRedirectUri) {
        this.oauthRedirectUri = oauthRedirectUri;
    }

    public String getFrontendBaseUrl() {
        return frontendBaseUrl;
    }

    public void setFrontendBaseUrl(String frontendBaseUrl) {
        this.frontendBaseUrl = frontendBaseUrl;
    }
}
