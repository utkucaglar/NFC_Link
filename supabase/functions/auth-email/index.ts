// Supabase Edge Function - Auth Email Handler via Resend
// Bu function Supabase auth event'lerini yakalar ve Resend ile email gönderir
// Deploy: supabase functions deploy auth-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthEvent {
  type: "signup" | "password_recovery" | "email_change";
  user: {
    id: string;
    email: string;
    user_metadata?: {
      first_name?: string;
      last_name?: string;
    };
  };
  token?: string;
  redirect_to?: string;
}

// Email şablonları
const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Esdodesign</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .footer { background: #1a1a2e; color: #888; padding: 20px; text-align: center; font-size: 12px; }
    .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #fff !important; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .info-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
    h2 { color: #1a1a2e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Esdodesign</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Esdodesign. Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>
`;

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Email ayarlarını al
    const { data: emailSettingsData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "email_settings")
      .single();

    if (!emailSettingsData) {
      return new Response(
        JSON.stringify({ success: false, error: "Email settings not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const emailSettings = JSON.parse(emailSettingsData.value);
    if (!emailSettings.is_enabled) {
      return new Response(
        JSON.stringify({ success: false, error: "Email service disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const body: AuthEvent = await req.json();
    const { type, user, token, redirect_to } = body;

    const firstName = user.user_metadata?.first_name || "Kullanıcı";
    const fromEmail = emailSettings.from_email || "noreply@noreply.esdodesign.com";
    const fromName = emailSettings.from_name || "Esdodesign";

    let subject = "";
    let html = "";

    if (type === "signup") {
      // Email doğrulama emaili
      const confirmationLink = redirect_to || `${Deno.env.get("SITE_URL") || "https://esdodesign.com"}/auth/callback?token=${token}&type=signup`;
      
      subject = "E-postanızı Doğrulayın - Esdodesign";
      html = baseTemplate(`
        <h2>E-postanızı Doğrulayın! 👋</h2>
        <p>Merhaba ${firstName},</p>
        <p>Esdodesign ailesine hoş geldiniz! Hesabınızı aktifleştirmek için aşağıdaki butona tıklayarak e-posta adresinizi doğrulayın.</p>
        
        <a href="${confirmationLink}" class="button">E-postamı Doğrula</a>
        
        <div class="info-box">
          <h3 style="margin-top: 0;">ℹ️ Bilgilendirme</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Bu link 24 saat geçerlidir</li>
            <li style="margin-bottom: 8px;">Eğer bu hesabı siz oluşturmadıysanız, bu e-postayı görmezden gelebilirsiniz</li>
            <li style="margin-bottom: 0;">Doğrulama sonrası hesabınız otomatik olarak aktif olacaktır</li>
          </ul>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">Buton çalışmıyor mu? Aşağıdaki linki tarayıcınıza kopyalayıp yapıştırın:</p>
        <p style="color: #6366f1; font-size: 13px; word-break: break-all; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 3px solid #6366f1;">${confirmationLink}</p>
        
        <p>Saygılarımızla,<br><strong>Esdodesign Ekibi</strong></p>
      `);
    } else if (type === "password_recovery") {
      // Şifre sıfırlama emaili
      const resetLink = redirect_to || `${Deno.env.get("SITE_URL") || "https://esdodesign.com"}/reset-password?token=${token}&type=recovery`;
      
      subject = "Şifre Sıfırlama - Esdodesign";
      html = baseTemplate(`
        <h2>Şifre Sıfırlama Talebi</h2>
        <p>Merhaba,</p>
        <p>Hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
        
        <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
        <a href="${resetLink}" class="button">Şifremi Sıfırla</a>
        
        <p style="color: #666; font-size: 14px;">Bu linkin geçerlilik süresi 1 saattir.</p>
        <p style="color: #666; font-size: 14px;">Eğer bu talebi siz yapmadıysanız bu emaili görmezden gelebilirsiniz.</p>
        
        <p>Saygılarımızla,<br><strong>Esdodesign Ekibi</strong></p>
      `);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Unknown event type" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Resend API'ye gönder
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [user.email],
        subject,
        html,
      }),
    });

    const result = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(result.message || result.error || "Failed to send email");
    }

    // Email log kaydet
    await supabase.from("email_logs").insert({
      to_email: user.email,
      subject,
      status: "sent",
    });

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Auth email error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
