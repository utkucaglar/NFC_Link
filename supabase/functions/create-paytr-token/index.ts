// Supabase Edge Function - Create PayTR Payment Token
// Deploy: supabase functions deploy create-paytr-token --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// PayTR API Constants
const PAYTR_API_URL = "https://www.paytr.com/odeme/api/get-token";
const PAYTR_TIMEOUT_LIMIT = "30";
const PAYTR_LANG = "tr";
const PAYTR_DEBUG_MODE = "0";
const PAYTR_NO_INSTALLMENT = "1";
const PAYTR_MAX_INSTALLMENT = "0";

interface PayTRRequest {
  order_id: string;
  order_number: string;
  amount: number;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_address: string;
  user_basket: string;
  currency?: string;
}

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
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      throw new Error("Server configuration error");
    }

    // Kullanıcı doğrulama
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Yetkilendirme gerekli");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Oturum geçersiz");
    }

    // Request body
    const body: PayTRRequest = await req.json();
    const { order_id, order_number, amount, user_name, user_email, user_phone, user_address, user_basket, currency = "TL" } = body;

    // Validasyon
    if (!order_id || !order_number || !amount || !user_name || !user_email || !user_phone || !user_address || !user_basket) {
      throw new Error("Eksik bilgi");
    }

    // PayTR bilgileri
    const merchant_id = Deno.env.get("PAYTR_MERCHANT_ID") ?? "";
    const merchant_key = Deno.env.get("PAYTR_MERCHANT_KEY") ?? "";
    const merchant_salt = Deno.env.get("PAYTR_MERCHANT_SALT") ?? "";

    if (!merchant_id || !merchant_key || !merchant_salt) {
      throw new Error("Ödeme sistemi yapılandırılmamış");
    }

    const user_ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1";
    const test_mode = Deno.env.get("PAYTR_TEST_MODE") || "0";
    const baseUrl = Deno.env.get("SITE_URL") || "https://nfclink.com.tr";

    // Hash oluştur
    const hashStr = `${merchant_id}${user_ip}${order_number}${user_email}${amount}${user_basket}${PAYTR_NO_INSTALLMENT}${PAYTR_MAX_INSTALLMENT}${currency}${test_mode}`;
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
    formData.append("debug_on", PAYTR_DEBUG_MODE);
    formData.append("no_installment", PAYTR_NO_INSTALLMENT);
    formData.append("max_installment", PAYTR_MAX_INSTALLMENT);
    formData.append("user_name", user_name);
    formData.append("user_address", user_address);
    formData.append("user_phone", user_phone);
    formData.append("merchant_ok_url", `${baseUrl}/orders?status=success`);
    formData.append("merchant_fail_url", `${baseUrl}/orders?status=failed`);
    formData.append("timeout_limit", PAYTR_TIMEOUT_LIMIT);
    formData.append("currency", currency);
    formData.append("test_mode", test_mode);
    formData.append("lang", PAYTR_LANG);

    const paytrResponse = await fetch(PAYTR_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (!paytrResponse.ok) {
      console.error("PayTR API error:", paytrResponse.status, paytrResponse.statusText);
      throw new Error("PayTR API'ye bağlanılamadı");
    }

    const paytrResult = await paytrResponse.json();

    if (paytrResult.status !== "success") {
      console.error("PayTR token creation failed:", paytrResult.reason);
      throw new Error(paytrResult.reason || "Ödeme token oluşturulamadı");
    }

    // Payment kaydı
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: paymentData, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        order_id,
        amount: amount / 100,
        currency,
        status: "pending",
        payment_method: "paytr",
        paytr_token: paytrResult.token,
        paytr_order_id: order_number,
        description: `Sipariş: ${order_number}`,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Payment record creation error:", paymentError);
      throw new Error("Ödeme kaydı oluşturulamadı");
    }

    return new Response(
      JSON.stringify({ success: true, token: paytrResult.token, payment_id: paymentData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("create-paytr-token error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Bilinmeyen hata" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
