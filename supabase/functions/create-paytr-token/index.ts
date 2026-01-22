// Supabase Edge Function - Create PayTR Payment Token
// Deploy: npx supabase functions deploy create-paytr-token
//
// Bu fonksiyon PayTR ödeme token'ı oluşturur
// Güvenlik: JWT doğrulaması yapılır, sadece authenticated kullanıcılar kullanabilir

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PayTRRequest {
  order_id: string; // Order UUID
  order_number: string; // Order number for PayTR (merchant_oid)
  amount: number;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_address: string;
  user_basket: string; // Base64 encoded basket items
  currency?: string;
  test_mode?: boolean;
}

Deno.serve(async (req) => {
  // CORS preflight
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
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Kullanıcı bilgilerini al
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Request body'yi al
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
      test_mode = false,
    } = body;

    // Validasyon
    if (!order_id || !order_number || !amount || !user_name || !user_email || !user_phone || !user_address || !user_basket) {
      throw new Error("Missing required fields");
    }

    // PayTR API bilgilerini al (environment variables'dan)
    const merchant_id = Deno.env.get("PAYTR_MERCHANT_ID");
    const merchant_key = Deno.env.get("PAYTR_MERCHANT_KEY");
    const merchant_salt = Deno.env.get("PAYTR_MERCHANT_SALT");

    if (!merchant_id || !merchant_key || !merchant_salt) {
      throw new Error("PayTR credentials not configured");
    }

    // Kullanıcının IP adresini al
    const user_ip = req.headers.get("x-forwarded-for") || 
                    req.headers.get("x-real-ip") || 
                    "127.0.0.1";

    // PayTR token oluşturma parametreleri
    const payment_type = "CC"; // Credit Card
    const installment_count = 0; // Taksit yok
    const no_installment = 1; // Taksit yok
    const max_installment = 0;
    const test_mode_value = test_mode ? 1 : 0;
    const lang = "tr";

    // Hash oluştur (PayTR dokümantasyonuna göre)
    // merchant_id + user_ip + merchant_oid + email + payment_amount + payment_type + installment_count + currency + test_mode + no_installment + merchant_salt
    const hashString = `${merchant_id}${user_ip}${order_number}${user_email}${amount}${payment_type}${installment_count}${currency}${test_mode_value}${no_installment}${merchant_salt}`;
    
    // SHA256 hash oluştur
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(hashString)
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // PayTR API'ye token isteği gönder
    const paytrFormData = new FormData();
    paytrFormData.append("merchant_id", merchant_id);
    paytrFormData.append("user_ip", user_ip);
    paytrFormData.append("merchant_oid", order_number);
    paytrFormData.append("email", user_email);
    paytrFormData.append("payment_amount", amount.toString());
    paytrFormData.append("payment_type", payment_type);
    paytrFormData.append("installment_count", installment_count.toString());
    paytrFormData.append("currency", currency);
    paytrFormData.append("test_mode", test_mode_value.toString());
    paytrFormData.append("no_installment", no_installment.toString());
    paytrFormData.append("max_installment", max_installment.toString());
    paytrFormData.append("user_name", user_name);
    paytrFormData.append("user_address", user_address);
    paytrFormData.append("user_phone", user_phone);
    paytrFormData.append("user_basket", user_basket);
    paytrFormData.append("lang", lang);
    paytrFormData.append("hash", hash);

    const paytrResponse = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      body: paytrFormData,
    });

    const paytrResult = await paytrResponse.json();

    if (paytrResult.status !== "success") {
      console.error("PayTR error:", paytrResult);
      throw new Error(paytrResult.reason || "PayTR token oluşturulamadı");
    }

    // Payment kaydını veritabanına kaydet
    const { data: paymentData, error: paymentError } = await supabaseClient
      .from("payments")
      .insert({
        user_id: user.id,
        order_id: order_id, // Order UUID
        amount: amount / 100, // Kuruştan TL'ye çevir
        currency: currency,
        status: "pending",
        payment_method: "paytr",
        paytr_merchant_id: merchant_id,
        paytr_token: paytrResult.token,
        paytr_order_id: order_number, // Order number for PayTR
        description: `PayTR ödeme - Sipariş: ${order_number}`,
        metadata: {
          user_name,
          user_email,
          user_phone,
          user_address,
          test_mode: test_mode_value === 1,
        },
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
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("PayTR token error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Return 200 to avoid CORS issues
      }
    );
  }
});
