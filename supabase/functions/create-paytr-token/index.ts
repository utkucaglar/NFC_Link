// Supabase Edge Function - Create PayTR Payment Token
// Deploy: npx supabase functions deploy create-paytr-token

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PayTRRequest {
  order_id: string;
  order_number: string;
  amount: number;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_address: string;
  user_basket: string; // Base64 encoded JSON array
  currency?: string;
}

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
  
  // Base64 encode
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
    // JWT doğrulaması
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header missing");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Request body
    const body: PayTRRequest = await req.json();
    const {
      order_id,
      order_number,
      amount,
      user_name,
      user_email,
      user_phone,
      user_address,
      user_basket,
      currency = "TL",
    } = body;

    // Validasyon
    if (!order_id || !order_number || !amount || !user_name || !user_email || !user_phone || !user_address || !user_basket) {
      throw new Error("Missing required fields");
    }

    // PayTR API bilgileri
    const merchant_id = Deno.env.get("PAYTR_MERCHANT_ID");
    const merchant_key = Deno.env.get("PAYTR_MERCHANT_KEY");
    const merchant_salt = Deno.env.get("PAYTR_MERCHANT_SALT");

    if (!merchant_id || !merchant_key || !merchant_salt) {
      throw new Error("PayTR credentials not configured");
    }

    // Kullanıcı IP
    const user_ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                    req.headers.get("x-real-ip") ||
                    "127.0.0.1";

    // PayTR parametreleri
    const no_installment = "1";
    const max_installment = "0";
    const test_mode = Deno.env.get("PAYTR_TEST_MODE") || "0";
    const timeout_limit = "30";
    const debug_on = "0";
    const lang = "tr";

    // Callback ve yönlendirme URL'leri
    const baseUrl = Deno.env.get("SITE_URL") || "https://nfclink.com.tr";
    const merchant_ok_url = `${baseUrl}/orders?status=success`;
    const merchant_fail_url = `${baseUrl}/orders?status=failed`;

    // PayTR Hash oluştur
    // Format: merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode
    const hashStr = `${merchant_id}${user_ip}${order_number}${user_email}${amount}${user_basket}${no_installment}${max_installment}${currency}${test_mode}`;
    const paytr_token = await createPayTRHash(hashStr + merchant_salt, merchant_key);

    // PayTR API isteği
    const formData = new URLSearchParams();
    formData.append("merchant_id", merchant_id);
    formData.append("user_ip", user_ip);
    formData.append("merchant_oid", order_number);
    formData.append("email", user_email);
    formData.append("payment_amount", amount.toString());
    formData.append("paytr_token", paytr_token);
    formData.append("user_basket", user_basket);
    formData.append("debug_on", debug_on);
    formData.append("no_installment", no_installment);
    formData.append("max_installment", max_installment);
    formData.append("user_name", user_name);
    formData.append("user_address", user_address);
    formData.append("user_phone", user_phone);
    formData.append("merchant_ok_url", merchant_ok_url);
    formData.append("merchant_fail_url", merchant_fail_url);
    formData.append("timeout_limit", timeout_limit);
    formData.append("currency", currency);
    formData.append("test_mode", test_mode);
    formData.append("lang", lang);

    const paytrResponse = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const paytrResult = await paytrResponse.json();

    if (paytrResult.status !== "success") {
      console.error("PayTR error:", paytrResult);
      throw new Error(paytrResult.reason || "PayTR token oluşturulamadı");
    }

    // Payment kaydı oluştur
    const { data: paymentData, error: paymentError } = await supabaseClient
      .from("payments")
      .insert({
        user_id: user.id,
        order_id: order_id,
        amount: amount / 100,
        currency: currency,
        status: "pending",
        payment_method: "paytr",
        paytr_merchant_id: merchant_id,
        paytr_token: paytrResult.token,
        paytr_order_id: order_number,
        description: `PayTR ödeme - Sipariş: ${order_number}`,
        metadata: { user_name, user_email, user_phone, user_address },
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Payment insert error:", paymentError);
      throw new Error("Ödeme kaydı oluşturulamadı");
    }

    return new Response(
      JSON.stringify({
        success: true,
        token: paytrResult.token,
        payment_id: paymentData.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("PayTR token error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
