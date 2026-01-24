// Supabase Edge Function - Admin Delete Order (hard delete)
// Deploy: supabase functions deploy admin-delete-order --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Yetkilendirme gerekli");

    const token = authHeader.replace("Bearer ", "");
    if (!token) throw new Error("Yetkilendirme gerekli");

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user) throw new Error("Oturum geçersiz");

    const user = userData.user;

    // Admin kontrolü
    const { data: profile, error: profileError } = await supabaseClient
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return new Response(
        JSON.stringify({ success: false, error: "Yetkisiz" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const order_id = body?.order_id as string | undefined;
    if (!order_id) throw new Error("Eksik bilgi: order_id");

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Önce varsa order'a bağlı ödeme kayıtlarını sil (RLS client'ta delete yok)
    const { error: paymentsDeleteError } = await supabaseAdmin
      .from("payments")
      .delete()
      .eq("order_id", order_id);

    if (paymentsDeleteError) {
      throw new Error(`Ödeme kayıtları silinemedi: ${paymentsDeleteError.message}`);
    }

    // Siparişi sil (order_items ON DELETE CASCADE)
    const { error: orderDeleteError } = await supabaseAdmin
      .from("orders")
      .delete()
      .eq("id", order_id);

    if (orderDeleteError) {
      throw new Error(`Sipariş silinemedi: ${orderDeleteError.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("admin-delete-order error:", error?.message || error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Bilinmeyen hata" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

