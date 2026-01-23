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
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error("Oturum bulunamadı. Lütfen giriş yapın.");
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-paytr-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      }
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "PayTR token oluşturulamadı");
    }

    return result;
  } catch (error: any) {
    console.error("PayTR token error:", error);
    return {
      success: false,
      error: error.message || "PayTR token oluşturulurken bir hata oluştu",
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
