// Supabase Edge Function - PayTR Payment Callback Handler
// Deploy: supabase functions deploy paytr-callback --no-verify-jwt
// Callback URL: https://ajldsveljbqkykrwnrpn.supabase.co/functions/v1/paytr-callback

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function createPayTRHash(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  const hashArray = new Uint8Array(signature);
  let binary = "";
  for (let i = 0; i < hashArray.length; i++) {
    binary += String.fromCharCode(hashArray[i]);
  }
  return btoa(binary);
}

// Email şablonu
function getInvoiceEmailTemplate(
  orderNumber: string,
  customerName: string,
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number,
  address: string,
  paymentDate: string
): string {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₺${(item.price * item.quantity).toLocaleString('tr-TR')}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fatura - Esdodesign</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff;">
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 28px;">Esdodesign</h1>
    </div>
    
    <div style="padding: 30px;">
      <h2 style="color: #1a1a2e; margin-bottom: 20px;">Siparişiniz Onaylandı! ✅</h2>
      
      <p>Sayın ${customerName},</p>
      <p>Siparişiniz başarıyla tamamlandı. Aşağıda sipariş ve fatura bilgilerinizi bulabilirsiniz.</p>
      
      <!-- Fatura Bilgileri -->
      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #6366f1;">
        <h3 style="margin-top: 0; color: #6366f1;">📄 Fatura Bilgileri</h3>
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 5px 0;"><strong>Sipariş No:</strong></td>
            <td style="padding: 5px 0;">#${orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Tarih:</strong></td>
            <td style="padding: 5px 0;">${paymentDate}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Müşteri:</strong></td>
            <td style="padding: 5px 0;">${customerName}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Teslimat Adresi:</strong></td>
            <td style="padding: 5px 0;">${address}</td>
          </tr>
        </table>
      </div>

      <!-- Satıcı Bilgileri -->
      <div style="background: #fff3cd; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 13px;">
        <strong>Satıcı Bilgileri:</strong><br>
        Doğukan Akar<br>
        Esenköy mh. Esenköy sol sk. 437/2 15 Muğla/Fethiye<br>
        Tel: 0538 415 50 42 | E-posta: info@esdodesign.com
      </div>
      
      <!-- Ürünler Tablosu -->
      <h3 style="color: #1a1a2e;">Sipariş Detayları</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #6366f1; color: #fff;">
            <th style="padding: 12px; text-align: left;">Ürün</th>
            <th style="padding: 12px; text-align: center;">Adet</th>
            <th style="padding: 12px; text-align: right;">Tutar</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr style="background: #f8f9fa;">
            <td colspan="2" style="padding: 15px; font-weight: bold;">TOPLAM (KDV Dahil)</td>
            <td style="padding: 15px; text-align: right; font-weight: bold; color: #6366f1; font-size: 18px;">₺${total.toLocaleString('tr-TR')}</td>
          </tr>
        </tfoot>
      </table>
      
      <!-- Bilgilendirme -->
      <div style="background: #d4edda; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px;">
          <strong>📦 Teslimat:</strong> Siparişiniz 1-5 iş günü içinde kargoya verilecektir. Kargo bilgileri ayrıca e-posta ile gönderilecektir.
        </p>
      </div>

      <p style="font-size: 13px; color: #666; margin-top: 30px;">
        Bu e-posta, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında 
        fatura yerine geçen belge olarak gönderilmektedir.
      </p>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://esdodesign.com/orders" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Siparişlerimi Görüntüle</a>
      </div>
      
      <p style="margin-top: 30px;">Bizi tercih ettiğiniz için teşekkür ederiz!<br><strong>Esdodesign Ekibi</strong></p>
    </div>
    
    <div style="background: #1a1a2e; color: #888; padding: 20px; text-align: center; font-size: 12px;">
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} Esdodesign. Tüm hakları saklıdır.</p>
      <p style="margin: 5px 0 0 0;">Bu e-posta Esdodesign tarafından otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Email gönderme fonksiyonu
async function sendInvoiceEmail(
  supabaseAdmin: any,
  customerEmail: string,
  orderNumber: string,
  customerName: string,
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number,
  address: string
): Promise<boolean> {
  try {
    // Email ayarlarını al
    const { data: emailSettingsData } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "email_settings")
      .single();

    if (!emailSettingsData) {
      console.log("PayTR callback: Email settings not found");
      return false;
    }

    const emailSettings = JSON.parse(emailSettingsData.value);
    if (!emailSettings.is_enabled || !emailSettings.api_key) {
      console.log("PayTR callback: Email service disabled or API key missing");
      return false;
    }

    const paymentDate = new Date().toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const htmlContent = getInvoiceEmailTemplate(
      orderNumber,
      customerName,
      items,
      total,
      address,
      paymentDate
    );

    // Resend API ile email gönder
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${emailSettings.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${emailSettings.from_name} <${emailSettings.from_email}>`,
        to: customerEmail,
        subject: `Sipariş Onayı ve Fatura - #${orderNumber}`,
        html: htmlContent,
      }),
    });

    if (response.ok) {
      console.log("PayTR callback: Invoice email sent successfully to", customerEmail);
      
      // Email log kaydet
      await supabaseAdmin.from("email_logs").insert({
        to_email: customerEmail,
        subject: `Sipariş Onayı ve Fatura - #${orderNumber}`,
        status: "sent",
      });
      
      return true;
    } else {
      const errorData = await response.json();
      console.error("PayTR callback: Email send failed", errorData);
      return false;
    }
  } catch (error) {
    console.error("PayTR callback: Email error", error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const merchant_oid = formData.get("merchant_oid") as string;
    const status = formData.get("status") as string;
    const total_amount = formData.get("total_amount") as string;
    const hash = formData.get("hash") as string;
    const failed_reason_msg = formData.get("failed_reason_msg") as string;

    if (!merchant_oid || !status || !hash) {
      throw new Error("Missing parameters");
    }

    const merchant_key = Deno.env.get("PAYTR_MERCHANT_KEY") ?? "";
    const merchant_salt = Deno.env.get("PAYTR_MERCHANT_SALT") ?? "";

    if (!merchant_key || !merchant_salt) {
      console.error("PayTR callback: Missing merchant credentials");
      throw new Error("Config error");
    }

    // Hash doğrulama
    const hashStr = `${merchant_oid}${merchant_salt}${status}${total_amount}`;
    const calculatedHash = await createPayTRHash(hashStr, merchant_key);

    if (calculatedHash !== hash) {
      console.error("PayTR callback: Hash mismatch", { merchant_oid, status });
      throw new Error("Hash mismatch");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Payment bul
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("id, order_id, status")
      .eq("paytr_order_id", merchant_oid)
      .single();

    if (paymentError || !payment) {
      console.error("PayTR callback: Payment not found", { merchant_oid, error: paymentError });
      throw new Error("Payment not found");
    }

    // Duplicate callback kontrolü - zaten işlenmiş mi?
    if (payment.status === "succeeded" || payment.status === "failed") {
      console.log("PayTR callback: Already processed, skipping", { merchant_oid, existingStatus: payment.status });
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const isSuccess = status === "success";

    // Payment güncelle
    const { error: updatePaymentError } = await supabaseAdmin
      .from("payments")
      .update({
        status: isSuccess ? "succeeded" : "failed",
        paid_at: isSuccess ? new Date().toISOString() : null,
        failure_reason: !isSuccess ? (failed_reason_msg || "Ödeme başarısız") : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updatePaymentError) {
      console.error("PayTR callback: Payment update error", { paymentId: payment.id, error: updatePaymentError });
      throw new Error("Payment update failed");
    }

    // Order güncelle ve email için bilgileri al
    if (payment.order_id && isSuccess) {
      // Order detaylarını al (email için)
      const { data: order, error: orderFetchError } = await supabaseAdmin
        .from("orders")
        .select(`
          id,
          order_number,
          total,
          shipping_address,
          user_id,
          invoice_sent
        `)
        .eq("id", payment.order_id)
        .single();

      if (orderFetchError || !order) {
        console.error("PayTR callback: Order fetch error", { orderId: payment.order_id, error: orderFetchError });
      } else {
        // Order durumunu güncelle
        const { error: updateOrderError } = await supabaseAdmin
          .from("orders")
          .update({
            status: "confirmed",
            payment_id: payment.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.order_id);

        if (updateOrderError) {
          console.error("PayTR callback: Order update error", { orderId: payment.order_id, error: updateOrderError });
        }

        // Fatura emaili henüz gönderilmemiş mi kontrol et
        console.log("PayTR callback: Checking invoice_sent", { invoice_sent: order.invoice_sent, order_id: order.id });
        
        if (!order.invoice_sent) {
          // Kullanıcı bilgilerini al
          const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("first_name, last_name, email")
            .eq("id", order.user_id)
            .single();

          if (profileError) {
            console.error("PayTR callback: Profile fetch error", profileError);
          }

          console.log("PayTR callback: Profile fetched", { email: profile?.email, user_id: order.user_id });

          if (profile && profile.email) {
            const customerName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Değerli Müşterimiz';
            
            // Shipping address'i parse et
            const shippingAddress = order.shipping_address || {};
            const addressStr = [
              shippingAddress.address_line1,
              shippingAddress.address_line2,
              shippingAddress.district,
              shippingAddress.city,
              shippingAddress.postal_code
            ].filter(Boolean).join(', ');

            // Order items'ı order_items tablosundan çek
            let orderItems: Array<{ name: string; quantity: number; price: number }> = [];
            const { data: orderItemsData, error: orderItemsError } = await supabaseAdmin
              .from("order_items")
              .select(`
                quantity,
                price,
                products(name)
              `)
              .eq("order_id", payment.order_id);

            if (orderItemsError) {
              console.error("PayTR callback: Order items fetch error", orderItemsError);
              orderItems = [{ name: "Ürün", quantity: 1, price: order.total }];
            } else if (orderItemsData && orderItemsData.length > 0) {
              orderItems = orderItemsData.map((item: any) => ({
                name: item.products?.name || "Ürün",
                quantity: item.quantity,
                price: item.price
              }));
            } else {
              orderItems = [{ name: "Ürün", quantity: 1, price: order.total }];
            }

            // Email gönder
            console.log("PayTR callback: Sending invoice email to", profile.email);
            
            const emailSent = await sendInvoiceEmail(
              supabaseAdmin,
              profile.email,
              order.order_number,
              customerName,
              orderItems,
              order.total,
              addressStr || 'Adres bilgisi mevcut değil'
            );

            console.log("PayTR callback: Email send result", { emailSent, email: profile.email });

            if (emailSent) {
              // invoice_sent flag'ini güncelle
              await supabaseAdmin
                .from("orders")
                .update({ invoice_sent: true })
                .eq("id", payment.order_id);
              console.log("PayTR callback: invoice_sent flag updated");
            }
          } else {
            console.log("PayTR callback: No profile or email found for user", order.user_id);
          }
        } else {
          console.log("PayTR callback: Invoice already sent, skipping email");
        }
      }
    } else if (payment.order_id && !isSuccess) {
      // Başarısız ödeme - order'ı iptal et
      const { error: updateOrderError } = await supabaseAdmin
        .from("orders")
        .update({
          status: "cancelled",
          payment_id: payment.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.order_id);

      if (updateOrderError) {
        console.error("PayTR callback: Order cancel error", { orderId: payment.order_id, error: updateOrderError });
      }
    }

    console.log("PayTR callback: Success", { merchant_oid, status, paymentId: payment.id });
    return new Response("OK", { 
      status: 200,
      headers: corsHeaders
    });
  } catch (error: any) {
    console.error("PayTR callback error:", error);
    // PayTR'e her zaman OK dönmek gerekiyor (retry önlemek için)
    // Ama hataları logluyoruz
    return new Response("OK", { 
      status: 200,
      headers: corsHeaders
    });
  }
});
