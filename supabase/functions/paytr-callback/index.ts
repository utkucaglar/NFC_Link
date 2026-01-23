// Supabase Edge Function - PayTR Payment Callback Handler
// Deploy: supabase functions deploy paytr-callback --no-verify-jwt
// Callback URL: https://ajldsveljbqkykrwnrpn.supabase.co/functions/v1/paytr-callback

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok");
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
      throw new Error("Config error");
    }

    // Hash doğrulama
    const hashStr = `${merchant_oid}${merchant_salt}${status}${total_amount}`;
    const calculatedHash = await createPayTRHash(hashStr, merchant_key);

    if (calculatedHash !== hash) {
      throw new Error("Hash mismatch");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Payment bul
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("id, order_id")
      .eq("paytr_order_id", merchant_oid)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment not found");
    }

    const isSuccess = status === "success";

    // Payment güncelle
    await supabaseAdmin
      .from("payments")
      .update({
        status: isSuccess ? "succeeded" : "failed",
        paid_at: isSuccess ? new Date().toISOString() : null,
        failure_reason: !isSuccess ? (failed_reason_msg || "Ödeme başarısız") : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    // Order güncelle
    if (payment.order_id) {
      await supabaseAdmin
        .from("orders")
        .update({
          status: isSuccess ? "confirmed" : "cancelled",
          payment_id: payment.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.order_id);
    }

    return new Response("OK", { status: 200 });
  } catch (error: any) {
    return new Response("OK", { status: 200 });
  }
});
