// PayTR Payment Integration Helper Functions

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

/**
 * PayTR ödeme token'ı oluşturur
 */
export async function createPayTRToken(request: PayTRTokenRequest): Promise<PayTRTokenResponse> {
  try {
    // Session kontrolü
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      // Session yoksa refresh dene
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshedSession?.access_token) {
        return { success: false, error: "Oturum süresi dolmuş. Lütfen tekrar giriş yapın." };
      }
    }

    const currentSession = session || (await supabase.auth.getSession()).data.session;
    if (!currentSession?.access_token) {
      return { success: false, error: "Oturum bulunamadı. Lütfen giriş yapın." };
    }

    // Edge function'ı çağır
    const { data, error } = await supabase.functions.invoke("create-paytr-token", {
      body: request,
      headers: { Authorization: `Bearer ${currentSession.access_token}` },
    });

    if (error) {
      console.error("Edge function error:", error);
      const errorMsg = error.message || "";
      
      // Non-2xx status code hatası
      if (errorMsg.includes("non-2xx") || errorMsg.includes("Edge Function returned")) {
        console.error("Edge function non-2xx error. Function may not be deployed or has internal error.");
        return { success: false, error: "Ödeme servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin." };
      }
      
      if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
        return { success: false, error: "Oturum süresi dolmuş. Lütfen tekrar giriş yapın." };
      }
      
      if (errorMsg.includes("FunctionsHttpError") || errorMsg.includes("FunctionsRelayError")) {
        return { success: false, error: "Ödeme servisi yanıt vermiyor. Lütfen daha sonra tekrar deneyin." };
      }
      
      return { success: false, error: errorMsg || "PayTR token oluşturulamadı" };
    }

    if (!data?.success) {
      console.error("PayTR API error:", data?.error);
      return { success: false, error: data?.error || "PayTR token oluşturulamadı" };
    }

    return data;
  } catch (error: any) {
    console.error("PayTR token error:", error);
    return { success: false, error: error.message || "PayTR token oluşturulurken bir hata oluştu" };
  }
}

/**
 * Sepet bilgilerini PayTR formatına çevirir
 * PayTR formatı: [[ürün_adı, fiyat, adet], ...] şeklinde JSON array Base64 encoded
 */
export function encodeBasket(items: Array<{ name: string; price: number; quantity: number }>): string {
  // PayTR formatı: [[ürün_adı, fiyat, adet], ...]
  const basketArray = items.map((item) => [
    item.name.replace(/[^\w\sğüşöçıİĞÜŞÖÇ]/gi, "").substring(0, 50), // Özel karakterleri temizle
    (item.price * 100).toFixed(0), // Kuruş cinsinden (string)
    item.quantity.toString()
  ]);
  
  const jsonString = JSON.stringify(basketArray);
  return btoa(unescape(encodeURIComponent(jsonString)));
}

/**
 * PayTR iframe'i yükler
 */
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

/**
 * Ödeme durumunu kontrol eder
 */
export async function checkPaymentStatus(paymentId: string): Promise<{ status: string; order_id?: string }> {
  const { data, error } = await supabase
    .from("payments")
    .select("status, order_id")
    .eq("id", paymentId)
    .single();

  if (error) {
    throw new Error("Ödeme durumu kontrol edilemedi");
  }

  return { status: data.status, order_id: data.order_id || undefined };
}
