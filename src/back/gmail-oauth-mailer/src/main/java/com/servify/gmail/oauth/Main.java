package com.servify.gmail.oauth;

/**
 * Ponto de entrada para testar o envio. Execute a partir da pasta do módulo:
 * <pre>
 *   cd gmail-oauth-mailer
 *   mvn -q exec:java
 * </pre>
 * <p>
 * Antes:
 * <ul>
 *   <li>Coloque {@code credentials.json} (OAuth Desktop) nesta mesma pasta.</li>
 *   <li>Ajuste {@link #SENDER_GMAIL} para o endereço Gmail que autorizará o OAuth (remetente).</li>
 *   <li>Ajuste {@link #DESTINO_TESTE} para um e-mail válido de teste.</li>
 * </ul>
 */
public final class Main {

    /** Conta Gmail que assina o OAuth e aparece como remetente (deve ser a mesma que faz login no navegador). */
    private static final String SENDER_GMAIL = "artjansentec@gmail.com";

    /** Destinatário de teste (pode ser o próprio Gmail ou outra caixa). */
    private static final String DESTINO_TESTE = "arthur.oliveira@aquila.com.br";

    public static void main(String[] args) {
        GmailConfig config = GmailConfig.defaults(SENDER_GMAIL);
        GmailService service = new GmailService(config);

        String token = String.format("%06d", (int) (Math.random() * 1_000_000));

        try {
            service.sendTokenEmail(DESTINO_TESTE, token);
            System.out.println("E-mail enviado com sucesso para " + DESTINO_TESTE);
        } catch (GmailService.GmailSendException e) {
            System.err.println("Erro ao enviar: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    private Main() {
    }
}
