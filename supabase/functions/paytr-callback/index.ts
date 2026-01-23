// Supabase Edge Function - PayTR Payment Callback Handler
// Deploy: npx supabase functions deploy paytr-callback
// PayTR callback URL: https://your-project.supabase.co/functions/v1/paytr-callback

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HMAC-SHA256 hesapla ve Base64 encode et (PayTR standardı)
async function createPayTRHash(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataToSign = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataToSign);
  const hashArray = new Uint8Array(signature);
  
  let binary = "";
  for (let i = 0; i < hashArray.length; i++) {
    binary += String.fromCharCode(hashArray[i]);
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
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

    if (!merchant_oid || !status || !hash) {
      throw new Error("Missing required PayTR callback parameters");
    }

    // PayTR API bilgileri
    const merchant_key = Deno.env.get("PAYTR_MERCHANT_KEY");
    const merchant_salt = Deno.env.get("PAYTR_MERCHANT_SALT");

    if (!merchant_key || !merchant_salt) {
      throw new Error("PayTR credentials not configured");
    }

    // Hash doğrulama (PayTR standardı: HMAC-SHA256 + Base64)
    // Format: merchant_oid + merchant_salt + status + total_amount
    const hashStr = `${merchant_oid}${merchant_salt}${status}${total_amount}`;
    const calculatedHash = await createPayTRHash(hashStr, merchant_key);

    if (calculatedHash !== hash) {
      console.error("PayTR hash verification failed");
      console.error("Expected:", calculatedHash);
      console.error("Received:", hash);
      throw new Error("Invalid hash - security check failed");
    }

    // Supabase admin client
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
      console.error("Payment not found for order:", merchant_oid);
      throw new Error("Payment record not found");
    }

    // Durumları belirle
    const isSuccess = status === "success";
    const paymentStatus = isSuccess ? "succeeded" : "failed";
    const orderStatus = isSuccess ? "confirmed" : "cancelled";

    // Payment kaydını güncelle
    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: paymentStatus,
        paytr_hash: hash,
        paid_at: isSuccess ? new Date().toISOString() : null,
        failure_reason: !isSuccess ? (failed_reason_msg || failed_reason_code || "Ödeme başarısız") : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("Payment update error:", updateError);
      throw new Error("Payment update failed");
    }

    // Order durumunu güncelle
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
      }
    }

    console.log(`Payment ${merchant_oid} updated: ${paymentStatus}`);

    // PayTR'e "OK" yanıtı döndür (zorunlu)
    return new Response("OK", {
      headers: { "Content-Type": "text/plain" },
      status: 200,
    });
  } catch (error: any) {
    console.error("PayTR callback error:", error.message);
    return new Response("OK", {
      headers: { "Content-Type": "text/plain" },
      status: 200,
    });
  }
});
