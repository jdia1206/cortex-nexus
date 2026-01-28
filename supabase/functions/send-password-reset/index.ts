import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PasswordResetRequest {
  email: string;
  resetUrl: string;
  language?: string;
}

const getEmailContent = (resetUrl: string, language: string = 'en') => {
  const isSpanish = language === 'es';
  
  return {
    subject: isSpanish ? 'Restablecer tu contraseña - VentaSaaS' : 'Reset Your Password - VentaSaaS',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${isSpanish ? 'Restablecer Contraseña' : 'Reset Password'}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e4e4e7;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #7c3aed;">VentaSaaS</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #18181b;">
                      ${isSpanish ? '¿Olvidaste tu contraseña?' : 'Forgot your password?'}
                    </h2>
                    <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #52525b;">
                      ${isSpanish 
                        ? 'No te preocupes, te tenemos cubierto. Haz clic en el botón de abajo para restablecer tu contraseña.'
                        : "No worries, we've got you covered. Click the button below to reset your password."}
                    </p>
                    
                    <!-- Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background-color: #7c3aed; text-decoration: none; border-radius: 8px;">
                            ${isSpanish ? 'Restablecer Contraseña' : 'Reset Password'}
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 24px 0 0; font-size: 14px; line-height: 22px; color: #71717a;">
                      ${isSpanish
                        ? 'Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura. El enlace expirará en 1 hora.'
                        : "If you didn't request a password reset, you can safely ignore this email. The link will expire in 1 hour."}
                    </p>
                    
                    <!-- Alternative link -->
                    <p style="margin: 24px 0 0; font-size: 12px; line-height: 20px; color: #a1a1aa;">
                      ${isSpanish 
                        ? '¿El botón no funciona? Copia y pega este enlace en tu navegador:'
                        : "Button not working? Copy and paste this link into your browser:"}
                      <br>
                      <a href="${resetUrl}" style="color: #7c3aed; word-break: break-all;">${resetUrl}</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e4e4e7; background-color: #fafafa; border-radius: 0 0 12px 12px;">
                    <p style="margin: 0; font-size: 12px; color: #71717a;">
                      © ${new Date().getFullYear()} VentaSaaS. ${isSpanish ? 'Todos los derechos reservados.' : 'All rights reserved.'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetUrl, language }: PasswordResetRequest = await req.json();

    // Validate required fields
    if (!email || !resetUrl) {
      throw new Error("Missing required fields: email and resetUrl");
    }

    const emailContent = getEmailContent(resetUrl, language);

    const emailResponse = await resend.emails.send({
      from: "VentaSaaS <noreply@resend.dev>",
      to: [email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
