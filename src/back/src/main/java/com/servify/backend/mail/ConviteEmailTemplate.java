package com.servify.backend.mail;

/**
 * HTML do convite: token da coluna {@code convite.token} + senha provisória para login.
 */
public final class ConviteEmailTemplate {

    private ConviteEmailTemplate() {
    }

    /**
     * @param urlCompletarCadastro URL absoluta para a tela de completar cadastro (ex.: {@code http://localhost:5173/convite/uuid}); vazio omite o bloco do link
     */
    public static String build(String urlCompletarCadastro, String token, String senhaProvisoria, int horasValidadeConvite) {
        String safeToken = escapeHtml(token);
        String safeSenha = escapeHtml(senhaProvisoria);
        String linkBlock = "";
        if (urlCompletarCadastro != null && !urlCompletarCadastro.isBlank()) {
            String safeUrl = escapeHtml(urlCompletarCadastro.trim());
            linkBlock = """
                          <tr>
                            <td style="padding:8px 28px 0 28px;">
                              <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">Completar cadastro no sistema</p>
                              <a href="%s" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#1e3a5f;color:#ffffff;font-weight:600;text-decoration:none;font-size:15px;">Abrir cadastro</a>
                              <p style="margin:10px 0 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">Se o botão não funcionar, copie e cole o endereço no navegador.</p>
                            </td>
                          </tr>
                          """.formatted(safeUrl);
        }
        return """
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Convite Servify</title>
                </head>
                <body style="margin:0;padding:0;background-color:#f4f6fb;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background-color:#f4f6fb;padding:24px 12px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.08);">
                          <tr>
                            <td style="padding:28px 28px 8px 28px;">
                              <p style="margin:0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Convite</p>
                              <h1 style="margin:12px 0 0 0;font-size:22px;line-height:1.3;color:#0f172a;">Bem-vindo ao Servify</h1>
                              <p style="margin:16px 0 0 0;font-size:15px;line-height:1.6;color:#334155;">
                                Abra o link abaixo para <strong>completar seu cadastro</strong>. Você também pode usar o <strong>token</strong> e a <strong>senha provisória</strong> quando solicitado.
                              </p>
                            </td>
                          </tr>
                          %s
                          <tr>
                            <td style="padding:8px 28px;">
                              <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">Token do convite</p>
                              <div style="word-break:break-all;padding:16px 20px;border-radius:10px;background:#f1f5f9;border:1px solid #e2e8f0;">
                                <span style="font-size:15px;font-weight:600;color:#0f172a;font-family:Consolas,ui-monospace,monospace;">%s</span>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:8px 28px 28px 28px;">
                              <p style="margin:16px 0 8px 0;font-size:13px;color:#64748b;">Senha provisória (primeiro login)</p>
                              <div style="display:inline-block;padding:18px 28px;border-radius:12px;background:linear-gradient(135deg,#eef2ff,#e0f2fe);border:1px solid #c7d2fe;">
                                <span style="font-size:28px;font-weight:700;letter-spacing:0.12em;color:#1e3a8a;font-family:Consolas,ui-monospace,monospace;">%s</span>
                              </div>
                              <p style="margin:20px 0 0 0;font-size:14px;line-height:1.6;color:#64748b;">
                                O convite e estes dados de acesso expiram em <strong style="color:#0f172a;">%d horas</strong>.
                              </p>
                              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
                              <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">
                                Por segurança, não encaminhe este e-mail. Se você não esperava este convite, ignore a mensagem.
                              </p>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;">Mensagem automática. Não responda.</p>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(linkBlock, safeToken, safeSenha, horasValidadeConvite);
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
