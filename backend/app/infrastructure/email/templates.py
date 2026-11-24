"""
Plantillas HTML responsivas y desacopladas para correos transaccionales de Pegasus.
"""


def render_activation_email(
    user_name: str,
    activation_url: str,
    business_name: str | None = None,
    expire_hours: int = 24,
) -> tuple[str, str]:
    """
    Genera la plantilla HTML y la versión texto plano para activación de cuenta y definición de contraseña.
    """
    greeting_name = user_name.strip() if user_name else "Emprendedor(a)"
    biz_context = (
        f" para administrar <strong>{business_name}</strong>" if business_name else ""
    )

    text_content = (
        f"Hola {greeting_name},\n\n"
        f"Gracias por registrarte en Pegasus SalesSystem{biz_context}.\n\n"
        f"Para verificar tu correo y crear tu contraseña segura, ingresa al siguiente enlace:\n"
        f"{activation_url}\n\n"
        f"Este enlace es válido por {expire_hours} horas. Si no realizaste esta solicitud, puedes ignorar este mensaje.\n\n"
        f"El equipo de Pegasus Nexus"
    )

    html_content = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu cuenta en Pegasus</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }}
    .wrapper {{
      width: 100%;
      background-color: #0b0f19;
      padding: 40px 10px;
      box-sizing: border-box;
    }}
    .container {{
      max-width: 560px;
      margin: 0 auto;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    }}
    .header {{
      background: linear-gradient(135deg, #1e1b4b 0%, #311042 100%);
      padding: 36px 32px;
      text-align: center;
      border-bottom: 1px solid #3730a3;
    }}
    .logo-badge {{
      display: inline-block;
      padding: 6px 14px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid #6366f1;
      border-radius: 9999px;
      color: #a5b4fc;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }}
    .title {{
      margin: 0;
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.025em;
    }}
    .content {{
      padding: 36px 32px;
      line-height: 1.6;
      color: #cbd5e1;
    }}
    .greeting {{
      font-size: 18px;
      font-weight: 600;
      color: #f8fafc;
      margin-top: 0;
      margin-bottom: 16px;
    }}
    .btn-container {{
      text-align: center;
      margin: 32px 0;
    }}
    .btn {{
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 10px;
      box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.39);
    }}
    .url-fallback {{
      background: #1e293b;
      border: 1px solid #334155;
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 12px;
      color: #94a3b8;
      word-break: break-all;
      margin-top: 20px;
    }}
    .footer {{
      padding: 24px 32px;
      background: #0d121f;
      border-top: 1px solid #1f2937;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-badge">Pegasus Nexus</div>
        <h1 class="title">Verificación de Cuenta</h1>
      </div>
      <div class="content">
        <p class="greeting">¡Hola {greeting_name}!</p>
        <p>
          Te damos la bienvenida a <strong>Pegasus SalesSystem</strong>{biz_context}.
          Para garantizar la seguridad de tu empresa y activar tu cuenta, haz clic en el botón a continuación para verificar tu correo electrónico y definir tu contraseña personal:
        </p>
        <div class="btn-container">
          <a href="{activation_url}" target="_blank" class="btn">
            Verificar Correo y Crear Contraseña →
          </a>
        </div>
        <p style="font-size: 13px; color: #94a3b8;">
          ⏳ <em>Este enlace es único y tiene una validez de <strong>{expire_hours} horas</strong>.</em>
        </p>
        <div class="url-fallback">
          Si el botón no funciona, copia y pega este enlace directo en tu navegador:<br>
          <a href="{activation_url}" style="color: #818cf8; text-decoration: underline;">{activation_url}</a>
        </div>
      </div>
      <div class="footer">
        © Pegasus SalesSystem. Si no solicitaste esta cuenta, puedes desestimar este mensaje de forma segura.
      </div>
    </div>
  </div>
</body>
</html>"""
    return html_content, text_content
