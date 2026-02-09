// Supabase Edge Function - PayTR Payment Callback Handler
// Deploy: supabase functions deploy paytr-callback --no-verify-jwt

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

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
      
      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #6366f1;">
        <h3 style="margin-top: 0; color: #6366f1;">📄 Fatura Bilgileri</h3>
        <table style="width: 100%; font-size: 14px;">
          <tr><td style="padding: 5px 0;"><strong>Sipariş No:</strong></td><td style="padding: 5px 0;">#${orderNumber}</td></tr>
          <tr><td style="padding: 5px 0;"><strong>Tarih:</strong></td><td style="padding: 5px 0;">${paymentDate}</td></tr>
          <tr><td style="padding: 5px 0;"><strong>Müşteri:</strong></td><td style="padding: 5px 0;">${customerName}</td></tr>
          <tr><td style="padding: 5px 0;"><strong>Teslimat Adresi:</strong></td><td style="padding: 5px 0;">${address}</td></tr>
        </table>
      </div>

      <div style="background: #fff3cd; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 13px;">
        <strong>Satıcı Bilgileri:</strong><br>
        Doğukan Akar<br>
        Esenköy mh. Esenköy sol sk. 437/2 15 Muğla/Fethiye<br>
        Tel: 0538 415 50 42 | E-posta: info@esdodesign.com
      </div>
      
      <h3 style="color: #1a1a2e;">Sipariş Detayları</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #6366f1; color: #fff;">
            <th style="padding: 12px; text-align: left;">Ürün</th>
            <th style="padding: 12px; text-align: center;">Adet</th>
            <th style="padding: 12px; text-align: right;">Tutar</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr style="background: #f8f9fa;">
            <td colspan="2" style="padding: 15px; font-weight: bold;">TOPLAM (KDV Dahil)</td>
            <td style="padding: 15px; text-align: right; font-weight: bold; color: #6366f1; font-size: 18px;">₺${total.toLocaleString('tr-TR')}</td>
          </tr>
        </tfoot>
      </table>
      
      <div style="background: #d4edda; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px;"><strong>📦 Teslimat:</strong> Siparişiniz 1-5 iş günü içinde kargoya verilecektir.</p>
      </div>

      <p style="font-size: 13px; color: #666; margin-top: 30px;">
        Bu e-posta, 6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında fatura yerine geçen belge olarak gönderilmektedir.
      </p>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://esdodesign.com/orders" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Siparişlerimi Görüntüle</a>
      </div>
      
      <p style="margin-top: 30px;">Bizi tercih ettiğiniz için teşekkür ederiz!<br><strong>Esdodesign Ekibi</strong></p>
    </div>
    <div style="background: #1a1a2e; color: #888; padding: 20px; text-align: center; font-size: 12px;">
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} Esdodesign. Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>`;
}

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
    const { data: emailSettingsData } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "email_settings")
      .single();

    if (!emailSettingsData) return false;

    const emailSettings = JSON.parse(emailSettingsData.value);
    if (!emailSettings.is_enabled || !emailSettings.api_key) return false;

    const paymentDate = new Date().toLocaleDateString('tr-TR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

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
        html: getInvoiceEmailTemplate(orderNumber, customerName, items, total, address, paymentDate),
      }),
    });

    if (response.ok) {
      await supabaseAdmin.from("email_logs").insert({
        to_email: customerEmail,
        subject: `Sipariş Onayı ve Fatura - #${orderNumber}`,
        status: "sent",
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function parseAddress(shippingAddress: any): string {
  if (!shippingAddress) return 'Adres bilgisi mevcut değil';
  
  try {
    const addr = typeof shippingAddress === 'string' ? JSON.parse(shippingAddress) : shippingAddress;
    return [addr.address_line1, addr.address_line2, addr.district, addr.city, addr.postal_code]
      .filter(Boolean).join(', ') || (typeof shippingAddress === 'string' ? shippingAddress : 'Adres bilgisi mevcut değil');
  } catch {
    return typeof shippingAddress === 'string' ? shippingAddress : 'Adres bilgisi mevcut değil';
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

    // Minimal logging - sadece kritik hatalarda
    if (!merchant_oid || !status || !hash) {
      return new Response("Missing parameters", { status: 400, headers: corsHeaders });
    }

    const merchant_key = Deno.env.get("PAYTR_MERCHANT_KEY") ?? "";
    const merchant_salt = Deno.env.get("PAYTR_MERCHANT_SALT") ?? "";

    if (!merchant_key || !merchant_salt) {
      return new Response("Config error", { status: 500, headers: corsHeaders });
    }

    // Hash doğrulama
    const calculatedHash = await createPayTRHash(`${merchant_oid}${merchant_salt}${status}${total_amount}`, merchant_key);
    if (calculatedHash !== hash) {
      return new Response("Hash mismatch", { status: 400, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Optimize edilmiş payment bulma - tek sorguda hem paytr_order_id hem de order_number ile
    // Önce paytr_order_id ile dene, bulunamazsa order_number ile orders tablosundan order_id alıp payment bul
    let payment = null;
    
    // İlk deneme: paytr_order_id ile direkt payment bul
    const { data: paymentByOrderId } = await supabaseAdmin
      .from("payments")
      .select("id, order_id, status")
      .eq("paytr_order_id", merchant_oid)
      .maybeSingle();
    
    if (paymentByOrderId) {
      payment = paymentByOrderId;
    } else {
      // İkinci deneme: order_number ile order bul, sonra order_id ile payment bul
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("order_number", merchant_oid)
        .maybeSingle();
      
      if (order) {
        const { data: paymentByOrder } = await supabaseAdmin
          .from("payments")
          .select("id, order_id, status")
          .eq("order_id", order.id)
          .maybeSingle();
        
        if (paymentByOrder) {
          payment = paymentByOrder;
          // paytr_order_id'yi güncelle (gelecek callback'ler için)
          await supabaseAdmin
            .from("payments")
            .update({ paytr_order_id: merchant_oid })
            .eq("id", payment.id);
        }
      }
    }

    if (!payment) {
      // Payment bulunamadı - PayTR'ye OK döndür ama işlem yapma
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Duplicate kontrolü - zaten işlenmişse erken çık
    if (payment.status === "succeeded" || payment.status === "failed") {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const isSuccess = status === "success";
    const now = new Date().toISOString();

    // Payment güncelle
    await supabaseAdmin
      .from("payments")
      .update({
        status: isSuccess ? "succeeded" : "failed",
        paid_at: isSuccess ? now : null,
        failure_reason: !isSuccess ? (failed_reason_msg || "Ödeme başarısız") : null,
        updated_at: now,
      })
      .eq("id", payment.id);

    if (payment.order_id && isSuccess) {
      // Order bilgilerini ve ilgili verileri tek sorguda al (optimize edilmiş)
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id, order_number, total, shipping_address, user_id, invoice_sent")
        .eq("id", payment.order_id)
        .maybeSingle();

      if (order) {
        // Order durumunu güncelle
        await supabaseAdmin
          .from("orders")
          .update({ status: "confirmed", payment_id: payment.id, updated_at: now })
          .eq("id", payment.order_id);

        // Fatura emaili gönder (sadece gönderilmemişse)
        if (!order.invoice_sent) {
          const { data: profile } = await supabaseAdmin
            .from("user_profiles")
            .select("first_name, last_name, email")
            .eq("id", order.user_id)
            .maybeSingle();

          if (profile?.email) {
            const customerName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Değerli Müşterimiz';

            // Order items
            const { data: orderItemsData } = await supabaseAdmin
              .from("order_items")
              .select("quantity, price, products(name)")
              .eq("order_id", payment.order_id);

            const orderItems = orderItemsData?.length
              ? orderItemsData.map((item: any) => ({ name: item.products?.name || "Ürün", quantity: item.quantity, price: item.price }))
              : [{ name: "Ürün", quantity: 1, price: order.total }];

            const emailSent = await sendInvoiceEmail(
              supabaseAdmin,
              profile.email,
              order.order_number,
              customerName,
              orderItems,
              order.total,
              parseAddress(order.shipping_address)
            );

            if (emailSent) {
              await supabaseAdmin.from("orders").update({ invoice_sent: true }).eq("id", payment.order_id);
            }
          }
        }
      }
    } else if (payment.order_id && !isSuccess) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "cancelled", payment_id: payment.id, updated_at: now })
        .eq("id", payment.order_id);
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error: any) {
    // Kritik hatalarda sadece error message logla (minimal logging)
    // BigQuery quota'sını aşmamak için console.error kullanmıyoruz
    // PayTR'ye her zaman OK döndür ki tekrar tekrar callback göndermesin
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
