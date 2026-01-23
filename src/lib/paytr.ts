// PayTR Payment Integration Helper Functions

import { supabase } from "./supabase";

export interface PayTRTokenRequest {
  order_id: string; // Order UUID
  order_number: string; // Order number for PayTR (merchant_oid)
  amount: number;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_address: string;
  user_basket: string; // Base64 encoded
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
export async function createPayTRToken(
  request: PayTRTokenRequest
): Promise<PayTRTokenResponse> {
  try {
    // Önce session'ı kontrol et ve gerekirse refresh et
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error("Oturum bulunamadı. Lütfen giriş yapın.");
    }

    // Session'ı al
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Eğer session yoksa veya geçersizse, refresh etmeyi dene
    if (sessionError || !session) {
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshedSession) {
        throw new Error("Oturum süresi dolmuş. Lütfen tekrar giriş yapın.");
      }
      
      session = refreshedSession;
    }

    // Session'ın access_token'ı kontrol et
    if (!session?.access_token) {
      throw new Error("Oturum token'ı bulunamadı. Lütfen tekrar giriş yapın.");
    }

    // Supabase'in functions.invoke() metodunu kullan
    // Session otomatik olarak header'a eklenir
    const { data, error } = await supabase.functions.invoke("create-paytr-token", {
      body: request,
    });

    if (error) {
      // Supabase'in döndürdüğü hata mesajını kontrol et
      const errorMsg = error.message || "";
      
      if (errorMsg.includes("401") || 
          errorMsg.includes("Unauthorized") || 
          errorMsg.includes("non-2xx") ||
          errorMsg.includes("Edge Function returned")) {
        throw new Error("Oturum süresi dolmuş. Lütfen tekrar giriş yapın.");
      }
      
      throw new Error(errorMsg || "PayTR token oluşturulamadı");
    }

    if (!data || !data.success) {
      throw new Error(data?.error || "PayTR token oluşturulamadı");
    }

    return data;
  } catch (error: any) {
    console.error("PayTR token error:", error);
    
    // Hata mesajını kontrol et ve kullanıcı dostu mesaj döndür
    let errorMessage = error.message || "PayTR token oluşturulurken bir hata oluştu";
    
    if (errorMessage.includes("401") || 
        errorMessage.includes("Unauthorized") || 
        errorMessage.includes("non-2xx") ||
        errorMessage.includes("Edge Function returned") ||
        errorMessage.includes("Oturum")) {
      errorMessage = "Oturum süresi dolmuş. Lütfen tekrar giriş yapın.";
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Sepet bilgilerini PayTR formatına çevirir (Base64)
 * Format: Ürün Adı|Fiyat|Adet
 */
export function encodeBasket(items: Array<{ name: string; price: number; quantity: number }>): string {
  const basketString = items
    .map((item) => `${item.name}|${item.price}|${item.quantity}`)
    .join("||");
  
  // Base64 encode
  return btoa(unescape(encodeURIComponent(basketString)));
}

/**
 * PayTR iframe'i yükler ve ödeme sayfasını gösterir
 */
export function loadPayTRIframe(token: string, containerId: string = "paytr-iframe-container"): Promise<void> {
  return new Promise((resolve, reject) => {
    const container = document.getElementById(containerId);
    if (!container) {
      reject(new Error("PayTR iframe container bulunamadı"));
      return;
    }

    // Önceki iframe'i temizle
    container.innerHTML = "";

    // PayTR iframe'i oluştur
    const iframe = document.createElement("iframe");
    iframe.id = "paytr-iframe";
    iframe.src = `https://www.paytr.com/odeme/guvenli/${token}`;
    iframe.style.width = "100%";
    iframe.style.height = "600px";
    iframe.style.border = "none";
    iframe.style.borderRadius = "8px";
    
    // Iframe yüklendiğinde
    iframe.onload = () => {
      resolve();
    };

    // Iframe hatası
    iframe.onerror = () => {
      reject(new Error("PayTR iframe yüklenemedi"));
    };

    container.appendChild(iframe);

    // PayTR callback'i dinle (window.postMessage)
    const handleMessage = (event: MessageEvent) => {
      // PayTR'den gelen mesajları kontrol et
      if (event.origin === "https://www.paytr.com" || event.origin === "https://www.paytr.com/") {
        if (event.data === "success" || event.data?.status === "success") {
          window.removeEventListener("message", handleMessage);
          resolve();
        } else if (event.data === "error" || event.data?.status === "error") {
          window.removeEventListener("message", handleMessage);
          reject(new Error("Ödeme başarısız"));
        }
      }
    };

    window.addEventListener("message", handleMessage);
  });
}

/**
 * Ödeme durumunu kontrol eder
 */
export async function checkPaymentStatus(paymentId: string): Promise<{
  status: string;
  order_id?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("status, order_id")
      .eq("id", paymentId)
      .single();

    if (error) throw error;

    return {
      status: data.status,
      order_id: data.order_id || undefined,
    };
  } catch (error: any) {
    console.error("Payment status check error:", error);
    throw new Error("Ödeme durumu kontrol edilemedi");
  }
}
