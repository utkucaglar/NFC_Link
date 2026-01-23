// PayTR Payment Integration

import { supabase } from "./supabase";

export interface PayTRTokenRequest {
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

export interface PayTRTokenResponse {
  success: boolean;
  token?: string;
  payment_id?: string;
  error?: string;
}

export async function createPayTRToken(request: PayTRTokenRequest): Promise<PayTRTokenResponse> {
  try {
    // Session kontrolü ve refresh
    let session = (await supabase.auth.getSession()).data.session;
    
    if (!session?.access_token) {
      const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
      if (!refreshedSession?.access_token) {
        return { success: false, error: "Oturum süresi dolmuş. Lütfen tekrar giriş yapın." };
      }
      session = refreshedSession;
    }

    const { data, error } = await supabase.functions.invoke("create-paytr-token", {
      body: request,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (error) {
      const errorMsg = error.message || "";
      if (errorMsg.includes("non-2xx") || errorMsg.includes("Edge Function")) {
        return { success: false, error: "Ödeme servisi kullanılamıyor. Lütfen daha sonra deneyin." };
      }
      if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
        return { success: false, error: "Oturum süresi dolmuş. Lütfen tekrar giriş yapın." };
      }
      return { success: false, error: errorMsg || "Ödeme başlatılamadı" };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || "Ödeme başlatılamadı" };
    }

    return data;
  } catch (error: any) {
    console.error("PayTR token creation error:", error);
    return { success: false, error: error.message || "Ödeme başlatılırken hata oluştu" };
  }
}

export function encodeBasket(items: Array<{ name: string; price: number; quantity: number }>): string {
  const basketArray = items.map((item) => [
    item.name.replace(/[^\w\sğüşöçıİĞÜŞÖÇ]/gi, "").substring(0, 50),
    (item.price * 100).toFixed(0),
    item.quantity.toString()
  ]);
  return btoa(unescape(encodeURIComponent(JSON.stringify(basketArray))));
}

export function loadPayTRIframe(token: string, containerId = "paytr-iframe-container"): Promise<void> {
  return new Promise((resolve, reject) => {
    const container = document.getElementById(containerId);
    if (!container) {
      reject(new Error("PayTR iframe container bulunamadı"));
      return;
    }

    container.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.id = "paytr-iframe";
    iframe.src = `https://www.paytr.com/odeme/guvenli/${token}`;
    iframe.style.cssText = "width:100%;height:600px;border:none;border-radius:8px;";
    iframe.onload = () => resolve();
    iframe.onerror = () => reject(new Error("PayTR iframe yüklenemedi"));
    container.appendChild(iframe);
  });
}

export async function checkPaymentStatus(paymentId: string): Promise<{ status: string; order_id?: string }> {
  const { data, error } = await supabase
    .from("payments")
    .select("status, order_id")
    .eq("id", paymentId)
    .single();

  if (error) throw new Error("Ödeme durumu kontrol edilemedi");
  return { status: data.status, order_id: data.order_id || undefined };
}
