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
    // Her zaman önce session'ı refresh etmeyi dene
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
    
    let session = refreshedSession;
    
    // Refresh başarısız olduysa mevcut session'ı kontrol et
    if (!session?.access_token) {
      const { data: sessionData } = await supabase.auth.getSession();
      session = sessionData.session;
    }
    
    if (!session?.access_token) {
      return { success: false, error: "Oturum süresi dolmuş. Lütfen tekrar giriş yapın." };
    }

    // Token'ın süresini kontrol et
    const tokenExp = session.expires_at;
    if (tokenExp && tokenExp * 1000 < Date.now()) {
      // Token süresi dolmuş, tekrar refresh dene
      const { data: { session: newSession } } = await supabase.auth.refreshSession();
      if (!newSession?.access_token) {
        return { success: false, error: "Oturum süresi dolmuş. Lütfen tekrar giriş yapın." };
      }
      session = newSession;
    }

    console.log("PayTR request with session user:", session.user?.email);

    const { data, error } = await supabase.functions.invoke("create-paytr-token", {
      body: request,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (error) {
      console.error("PayTR function invoke error:", error);
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
      // Oturum geçersiz hatası için özel mesaj
      if (data?.error === "Oturum geçersiz") {
        return { success: false, error: "Oturum geçersiz. Lütfen sayfayı yenileyip tekrar giriş yapın." };
      }
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
    // Container'ı bulmak için birkaç deneme yap (React render gecikmesi için)
    let attempts = 0;
    const maxAttempts = 10;
    
    const tryLoadIframe = () => {
      attempts++;
      const container = document.getElementById(containerId);
      
      if (!container) {
        if (attempts < maxAttempts) {
          console.log(`PayTR container bulunamadı, tekrar deneniyor... (${attempts}/${maxAttempts})`);
          setTimeout(tryLoadIframe, 200);
          return;
        }
        console.error("PayTR iframe container bulunamadı");
        reject(new Error("PayTR iframe container bulunamadı"));
        return;
      }

      console.log("PayTR iframe yükleniyor, token:", token.substring(0, 20) + "...");
      
      container.innerHTML = "";
      const iframe = document.createElement("iframe");
      iframe.id = "paytr-iframe";
      iframe.src = `https://www.paytr.com/odeme/guvenli/${token}`;
      iframe.style.cssText = "width:100%;height:600px;border:none;border-radius:8px;background:#fff;";
      iframe.allow = "payment";
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation");
      
      // Timeout ile yükleme kontrolü
      const loadTimeout = setTimeout(() => {
        console.warn("PayTR iframe yükleme timeout (30s)");
        // Timeout olsa bile reject etme, kullanıcı bekleyebilir
      }, 30000);
      
      iframe.onload = () => {
        clearTimeout(loadTimeout);
        console.log("PayTR iframe başarıyla yüklendi");
        resolve();
      };
      
      iframe.onerror = (e) => {
        clearTimeout(loadTimeout);
        console.error("PayTR iframe yükleme hatası:", e);
        reject(new Error("PayTR iframe yüklenemedi"));
      };
      
      container.appendChild(iframe);
    };
    
    tryLoadIframe();
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
