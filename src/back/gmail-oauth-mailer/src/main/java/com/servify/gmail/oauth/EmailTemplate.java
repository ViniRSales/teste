package com.servify.gmail.oauth;

/**
 * Gera o HTML do e-mail de token/código. Responsabilidade única: layout e conteúdo da mensagem.
 * <p>
 * O token é escapado para evitar injeção de HTML caso a origem do valor não seja totalmente confiável.
 */
public final class EmailTemplate {

    private EmailTemplate() {
    }

    /**
     * HTML responsivo simples (tabela + estilos inline) compatível com a maioria dos clientes de e-mail.
     *
     * @param title        título exibido no corpo (ex.: nome do produto)
     * @param token        código numérico ou alfanumérico a destacar
     * @param expireMinutes texto de validade (minutos)
     */
    public static String buildTokenEmailHtml(String title, String token, int expireMinutes) {
        String safeTitle = escapeHtml(title);
        String safeToken = escapeHtml(token);
        return """
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>%s</title>
                </head>
                <body style="margin:0;padding:0;background-color:#f4f6fb;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background-color:#f4f6fb;padding:24px 12px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.08);">
                          <tr>
                            <td style="padding:28px 28px 8px 28px;">
                              <p style="margin:0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Verificação de identidade</p>
                              <h1 style="margin:12px 0 0 0;font-size:22px;line-height:1.3;color:#0f172a;">%s</h1>
                              <p style="margin:16px 0 0 0;font-size:15px;line-height:1.6;color:#334155;">
                                Use o código abaixo para concluir a autenticação. Se você não solicitou este código, ignore este e-mail.
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding:8px 28px 8px 28px;">
                              <div style="display:inline-block;padding:20px 32px;border-radius:12px;background:linear-gradient(135deg,#eef2ff,#e0f2fe);border:1px solid #c7d2fe;">
                                <span style="font-size:36px;font-weight:700;letter-spacing:0.18em;color:#1e3a8a;font-family:Consolas,ui-monospace,monospace;">%s</span>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:8px 28px 28px 28px;">
                              <p style="margin:16px 0 0 0;font-size:14px;line-height:1.6;color:#64748b;">
                                Este código expira em <strong style="color:#0f172a;">%d minutos</strong> por motivos de segurança.
                              </p>
                              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
                              <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">
                                Dica: em dispositivos móveis, gire a tela ou aumente o zoom se o código parecer pequeno.
                              </p>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;">Mensagem automática. Não responda este e-mail.</p>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(safeTitle, safeTitle, safeToken, expireMinutes);
    }

    private static String escapeHtml(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
