// Supabase Edge Function - Notify Admins of New Support Ticket
// Deploy: npx supabase functions deploy notify-admin-ticket

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
const SUPABASE_URL = Deno.env.get("PROJECT_URL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TicketNotificationRequest {
  ticketNumber: string;
  subject: string;
  category: string;
  customerName: string;
  customerEmail: string;
  message: string;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🔔 Admin bildirimi Edge Function başlatılıyor...");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    if (!SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL) {
      throw new Error("Supabase credentials not configured. Please set SERVICE_ROLE_KEY and PROJECT_URL secrets.");
    }

    // Service role client (RLS bypass)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body: TicketNotificationRequest = await req.json();
    console.log("Request body:", JSON.stringify({ ticketNumber: body.ticketNumber }));

    // Email ayarlarını al (from_email için)
    let fromEmail = "Esdodesign <noreply@esdodesign.com>";
    try {
      const { data: emailSettings, error: settingsError } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", "email_settings")
        .single();

      if (!settingsError && emailSettings) {
        const settings = JSON.parse(emailSettings.value);
        if (settings.from_email && settings.from_name) {
          fromEmail = `${settings.from_name} <${settings.from_email}>`;
          console.log(`📧 Email ayarlarından from adresi alındı: ${fromEmail}`);
        }
      }
    } catch (err) {
      console.warn("⚠️ Email ayarları alınamadı, varsayılan kullanılıyor:", err);
    }

    // Admin email'lerini al (RLS bypass ile)
    const { data: admins, error: adminError } = await supabaseAdmin
      .from("user_profiles")
      .select("email, first_name")
      .eq("role", "admin");

    if (adminError) {
      console.error("❌ Admin email'leri alınamadı:", adminError);
      throw new Error(`Admin email'leri alınamadı: ${adminError.message}`);
    }

    if (!admins || admins.length === 0) {
      console.warn("⚠️ Admin kullanıcı bulunamadı");
      return new Response(
        JSON.stringify({ success: false, error: "Admin kullanıcı bulunamadı" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(`📧 ${admins.length} admin bulundu:`, admins.map(a => a.email));

    // Kategori label'ını al
    const categoryLabels: Record<string, string> = {
      general: "Genel Bilgi",
      order: "Sipariş Hakkında",
      technical: "Teknik Destek",
      billing: "Ödeme/Fatura",
      other: "Diğer",
    };
    const categoryLabel = categoryLabels[body.category] || body.category;

    // Email template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yeni Destek Talebi</title>
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
      <h2>Yeni Destek Talebi Alındı! 🔔</h2>
      <p>Merhaba,</p>
      <p><strong>#${body.ticketNumber}</strong> numaralı yeni bir destek talebi oluşturuldu.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">Talep Detayları</h3>
        <p><strong>Konu:</strong> ${body.subject}</p>
        <p><strong>Kategori:</strong> ${categoryLabel}</p>
        <p><strong>Müşteri:</strong> ${body.customerName} (${body.customerEmail})</p>
        <p><strong>Mesaj:</strong></p>
        <p style="background: #fff; padding: 15px; border-radius: 8px; border-left: 3px solid #6366f1; margin-top: 10px;">${body.message}</p>
      </div>

      <p>Talep detaylarını görüntülemek ve yanıtlamak için:</p>
      <a href="https://esdodesign.com/admin/support" class="button">Destek Paneline Git</a>
      
      <p>Saygılarımızla,<br><strong>Esdodesign Destek Sistemi</strong></p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Esdodesign. Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Her admin'e email gönder
    const results = await Promise.allSettled(
      admins.map(async (admin) => {

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [admin.email],
            subject: `Yeni Destek Talebi - #${body.ticketNumber}`,
            html: emailHtml,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || result.error || "Failed to send email");
        }

        console.log(`✅ ${admin.email} email gönderildi, id:`, result.id);
        return { success: true, id: result.id, email: admin.email };
      })
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failedCount = results.length - successCount;

    console.log(`✅ Admin bildirimleri tamamlandı: ${successCount} başarılı, ${failedCount} başarısız`);

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        sentCount: successCount,
        failedCount,
        totalAdmins: admins.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("❌ Admin bildirimi hatası:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Beklenmeyen hata" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
