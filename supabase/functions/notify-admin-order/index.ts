// Supabase Edge Function - Notify Admins of New Order
// Deploy: npx supabase functions deploy notify-admin-order

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
const SUPABASE_URL = Deno.env.get("PROJECT_URL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderNotificationRequest {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🔔 Yeni sipariş admin bildirimi başlatılıyor...");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    if (!SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL) {
      throw new Error("Supabase credentials not configured. Please set SERVICE_ROLE_KEY and PROJECT_URL secrets.");
    }

    // Service role client (RLS bypass)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body: OrderNotificationRequest = await req.json();
    console.log("Request body:", JSON.stringify({ orderNumber: body.orderNumber }));

    // Email ayarlarını al (from_email için)
    let fromEmail = "Esdodesign <noreply@esdodesign.com>";
    try {
      const { data: emailSettings, error: settingsError } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", "email_settings")
        .maybeSingle(); // single() yerine maybeSingle() kullan - 406 hatasını önler

      if (settingsError) {
        console.warn("⚠️ Email ayarları alınamadı:", settingsError.message);
      } else if (emailSettings && emailSettings.value) {
        try {
          const settings = JSON.parse(emailSettings.value);
          if (settings.from_email && settings.from_name) {
            fromEmail = `${settings.from_name} <${settings.from_email}>`;
            console.log(`📧 Email ayarlarından from adresi alındı: ${fromEmail}`);
          }
        } catch (parseError) {
          console.warn("⚠️ Email ayarları parse edilemedi:", parseError);
        }
      } else {
        console.warn("⚠️ Email ayarları bulunamadı, varsayılan kullanılıyor");
      }
    } catch (err: any) {
      console.warn("⚠️ Email ayarları alınamadı, varsayılan kullanılıyor:", err?.message || err);
    }

    // Admin email'lerini al (RLS bypass ile) - TÜM admin'leri al
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

    // Email template
    const itemsHtml = body.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₺${(item.price * item.quantity).toLocaleString('tr-TR')}</td>
      </tr>
    `).join('');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yeni Sipariş</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .footer { background: #1a1a2e; color: #888; padding: 20px; text-align: center; font-size: 12px; }
    .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #fff !important; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .info-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; }
    h2 { color: #1a1a2e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Esdodesign</h1>
    </div>
    <div class="content">
      <h2>Yeni Sipariş Alındı! 🎉</h2>
      <p>Merhaba,</p>
      <p><strong>#${body.orderNumber}</strong> numaralı yeni bir sipariş oluşturuldu.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">Sipariş Detayları</h3>
        <p><strong>Müşteri:</strong> ${body.customerName} (${body.customerEmail})</p>
        <p><strong>Sipariş No:</strong> ${body.orderNumber}</p>
        
        <table style="margin-top: 15px;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #6366f1;">Ürün</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #6366f1;">Adet</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #6366f1;">Tutar</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: bold; border-top: 2px solid #6366f1;">Toplam:</td>
              <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 18px; color: #6366f1; border-top: 2px solid #6366f1;">₺${body.total.toLocaleString('tr-TR')}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p>Siparişi görüntülemek ve yönetmek için:</p>
      <a href="https://esdodesign.com/admin/orders" class="button">Sipariş Paneline Git</a>
      
      <p>Saygılarımızla,<br><strong>Esdodesign Sipariş Sistemi</strong></p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Esdodesign. Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Her admin'e email gönder (rate limit'i önlemek için sıralı gönderim)
    const results = [];
    for (let i = 0; i < admins.length; i++) {
      const admin = admins[i];
      
      // İlk email hariç, her email arasında 500ms bekle (rate limit önleme)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      try {
        console.log(`📧 ${admin.email} için email gönderiliyor... (${i + 1}/${admins.length})`);
        
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [admin.email],
            subject: `Yeni Sipariş - #${body.orderNumber}`,
            html: emailHtml,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          // 429 (rate limit) hatası için özel mesaj
          if (response.status === 429) {
            console.error(`⏱️ ${admin.email} rate limit hatası, bekleniyor...`);
            // Rate limit hatası alırsa 2 saniye bekle ve tekrar dene
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Tekrar dene (sadece bir kez)
            const retryResponse = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: fromEmail,
                to: [admin.email],
                subject: `Yeni Sipariş - #${body.orderNumber}`,
                html: emailHtml,
              }),
            });
            const retryResult = await retryResponse.json();
            if (!retryResponse.ok) {
              throw new Error(retryResult.message || retryResult.error || "Failed to send email after retry");
            }
            console.log(`✅ ${admin.email} email gönderildi (retry), id:`, retryResult.id);
            results.push({ status: "fulfilled", value: { success: true, id: retryResult.id, email: admin.email } });
          } else {
            throw new Error(result.message || result.error || "Failed to send email");
          }
        } else {
          console.log(`✅ ${admin.email} email gönderildi, id:`, result.id);
          results.push({ status: "fulfilled", value: { success: true, id: result.id, email: admin.email } });
        }
      } catch (error: any) {
        console.error(`❌ ${admin.email} email gönderilemedi:`, error.message);
        results.push({ status: "rejected", reason: error });
      }
    }

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failedCount = results.length - successCount;

    // Başarısız olanları logla
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`❌ ${admins[index].email} email gönderilemedi:`, result.reason);
      }
    });

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
