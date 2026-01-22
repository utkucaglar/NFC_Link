// Supabase Edge Function - PayTR Payment Callback Handler
// Deploy: npx supabase functions deploy paytr-callback
//
// Bu fonksiyon PayTR'den gelen callback/webhook isteklerini işler
// PayTR callback URL: https://your-project.supabase.co/functions/v1/paytr-callback

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // PayTR'den gelen POST verilerini al
    const formData = await req.formData();
    
    const merchant_oid = formData.get("merchant_oid") as string;
    const status = formData.get("status") as string;
    const total_amount = formData.get("total_amount") as string;
    const hash = formData.get("hash") as string;
    const failed_reason_code = formData.get("failed_reason_code") as string;
    const failed_reason_msg = formData.get("failed_reason_msg") as string;
    const test_mode = formData.get("test_mode") as string;
    const payment_type = formData.get("payment_type") as string;
    const currency = formData.get("currency") as string;
    const payment_amount = formData.get("payment_amount") as string;
    const transaction_id = formData.get("transaction_id") as string;

    if (!merchant_oid || !status || !hash) {
      throw new Error("Missing required PayTR callback parameters");
    }

    // PayTR API bilgilerini al
    const merchant_id = Deno.env.get("PAYTR_MERCHANT_ID");
    const merchant_salt = Deno.env.get("PAYTR_MERCHANT_SALT");

    if (!merchant_id || !merchant_salt) {
      throw new Error("PayTR credentials not configured");
    }

    // Hash doğrulama (PayTR güvenlik kontrolü)
    // Hash: merchant_oid + merchant_salt + status + total_amount
    const hashString = `${merchant_oid}${merchant_salt}${status}${total_amount}`;
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(hashString)
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    if (calculatedHash !== hash) {
      console.error("PayTR hash verification failed");
      throw new Error("Invalid hash - security check failed");
    }

    // Supabase client oluştur (service role key kullan)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Payment kaydını bul
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("paytr_order_id", merchant_oid)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment record not found");
    }

    // Ödeme durumunu güncelle
    let paymentStatus = "failed";
    let orderStatus = "pending";

    if (status === "success") {
      paymentStatus = "succeeded";
      orderStatus = "confirmed";
    } else {
      paymentStatus = "failed";
      orderStatus = "cancelled";
    }

    // Payment kaydını güncelle
    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: paymentStatus,
        paytr_transaction_id: transaction_id || null,
        paytr_hash: hash,
        paid_at: status === "success" ? new Date().toISOString() : null,
        failure_reason: status !== "success" ? failed_reason_msg || failed_reason_code : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("Payment update error:", updateError);
      throw new Error("Payment update failed");
    }

    // Order durumunu güncelle (eğer order_id varsa)
    if (payment.order_id) {
      const { error: orderUpdateError } = await supabaseAdmin
        .from("orders")
        .update({
          status: orderStatus,
          payment_id: payment.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.order_id);

      if (orderUpdateError) {
        console.error("Order update error:", orderUpdateError);
        // Order güncelleme hatası kritik değil, devam et
      }
    }

    // Başarılı yanıt döndür (PayTR bekliyor)
    return new Response("OK", {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
      status: 200,
    });
  } catch (error: any) {
    console.error("PayTR callback error:", error.message);
    
    // PayTR'e hata yanıtı döndür (ama 200 status code ile)
    return new Response("ERROR", {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
      status: 200, // PayTR 200 bekliyor
    });
  }
});
