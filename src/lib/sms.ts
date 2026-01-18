// =================================================
// SMS Service - Netgsm / Twilio / Generic API
// =================================================

import { supabase } from "./supabase";

// SMS Ayarları (Supabase'den çekilecek)
interface SmsSettings {
  provider: "netgsm" | "twilio" | "iletimerkezi";
  api_key: string;
  api_secret?: string;
  sender_id: string; // Gönderici adı (örn: "ESDODESIGN")
  is_enabled: boolean;
}

// SMS Şablonları
export const SMS_TEMPLATES = {
  ORDER_CONFIRMED: (orderNumber: string) =>
    `Siparişiniz alındı! Sipariş No: #${orderNumber}. Esdodesign'ı tercih ettiğiniz için teşekkürler.`,

  ORDER_PREPARING: (orderNumber: string) =>
    `#${orderNumber} numaralı siparişiniz hazırlanıyor.`,

  ORDER_SHIPPED: (orderNumber: string, trackingCode?: string) =>
    trackingCode
      ? `#${orderNumber} numaralı siparişiniz kargoya verildi. Takip No: ${trackingCode}`
      : `#${orderNumber} numaralı siparişiniz kargoya verildi.`,

  ORDER_DELIVERED: (orderNumber: string) =>
    `#${orderNumber} numaralı siparişiniz teslim edildi. İyi günlerde kullanın!`,

  OTP_CODE: (code: string) =>
    `Esdodesign doğrulama kodunuz: ${code}. Bu kodu kimseyle paylaşmayın.`,

  SUPPORT_REPLY: (ticketNumber: string) =>
    `#${ticketNumber} numaralı destek talebinize yanıt verildi. Detaylar için sitemizi ziyaret edin.`,

  SUPPORT_RESOLVED: (ticketNumber: string) =>
    `#${ticketNumber} numaralı destek talebiniz çözüldü. Teşekkür ederiz.`,

  PASSWORD_RESET: (code: string) =>
    `Şifre sıfırlama kodunuz: ${code}. Bu kodu kimseyle paylaşmayın.`,
};

// Telefon numarasını formatla (Türkiye için)
export const formatPhoneNumber = (phone: string): string => {
  // Boşlukları ve özel karakterleri temizle
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, "");

  // Başındaki 0'ı kaldır
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  // +90 veya 90 ile başlamıyorsa ekle
  if (!cleaned.startsWith("90") && !cleaned.startsWith("+90")) {
    cleaned = "90" + cleaned;
  }

  // + işaretini kaldır (API'ler genelde istemez)
  cleaned = cleaned.replace("+", "");

  return cleaned;
};

// SMS Ayarlarını getir
export const getSmsSettings = async (): Promise<SmsSettings | null> => {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "sms_settings")
      .single();

    if (error || !data) return null;
    return JSON.parse(data.value) as SmsSettings;
  } catch {
    return null;
  }
};

// Netgsm API ile SMS gönder
const sendViaNETGSM = async (
  phone: string,
  message: string,
  settings: SmsSettings
): Promise<{ success: boolean; error?: string }> => {
  try {
    const params = new URLSearchParams({
      usercode: settings.api_key,
      password: settings.api_secret || "",
      gsmno: formatPhoneNumber(phone),
      message: message,
      msgheader: settings.sender_id,
    });

    const response = await fetch(
      `https://api.netgsm.com.tr/sms/send/get?${params.toString()}`
    );

    const result = await response.text();

    // Netgsm başarı kodları: 00, 01, 02
    if (result.startsWith("00") || result.startsWith("01") || result.startsWith("02")) {
      return { success: true };
    }

    return { success: false, error: `Netgsm error: ${result}` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// İletimerkezi API ile SMS gönder
const sendViaIletiMerkezi = async (
  phone: string,
  message: string,
  settings: SmsSettings
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch("https://api.iletimerkezi.com/v1/send-sms/get/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        request: {
          authentication: {
            key: settings.api_key,
            hash: settings.api_secret,
          },
          order: {
            sender: settings.sender_id,
            sendDateTime: "",
            message: {
              text: message,
              receipents: {
                number: [formatPhoneNumber(phone)],
              },
            },
          },
        },
      }),
    });

    const result = await response.json();

    if (result?.response?.status?.code === "200") {
      return { success: true };
    }

    return { success: false, error: result?.response?.status?.message || "Unknown error" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Ana SMS gönderme fonksiyonu
export const sendSms = async (
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> => {
  const settings = await getSmsSettings();

  if (!settings) {
    console.log("SMS ayarları bulunamadı");
    return { success: false, error: "SMS ayarları yapılandırılmamış" };
  }

  if (!settings.is_enabled) {
    console.log("SMS servisi devre dışı");
    return { success: false, error: "SMS servisi devre dışı" };
  }

  // SMS log'a kaydet
  await logSms(phone, message, "pending");

  let result: { success: boolean; error?: string };

  switch (settings.provider) {
    case "netgsm":
      result = await sendViaNETGSM(phone, message, settings);
      break;
    case "iletimerkezi":
      result = await sendViaIletiMerkezi(phone, message, settings);
      break;
    default:
      result = { success: false, error: "Bilinmeyen SMS sağlayıcısı" };
  }

  // Log'u güncelle
  await updateSmsLog(phone, message, result.success ? "sent" : "failed", result.error);

  return result;
};

// SMS Log kaydet
const logSms = async (phone: string, message: string, status: string) => {
  try {
    await supabase.from("sms_logs").insert({
      phone: formatPhoneNumber(phone),
      message,
      status,
    });
  } catch (error) {
    console.error("SMS log error:", error);
  }
};

// SMS Log güncelle
const updateSmsLog = async (
  phone: string,
  message: string,
  status: string,
  error?: string
) => {
  try {
    await supabase
      .from("sms_logs")
      .update({ status, error_message: error, sent_at: new Date().toISOString() })
      .eq("phone", formatPhoneNumber(phone))
      .eq("message", message)
      .eq("status", "pending");
  } catch (error) {
    console.error("SMS log update error:", error);
  }
};

// Sipariş durumu değiştiğinde SMS gönder
export const sendOrderStatusSms = async (
  phone: string,
  orderNumber: string,
  status: string,
  trackingCode?: string
) => {
  let message: string;

  switch (status) {
    case "confirmed":
    case "pending":
      message = SMS_TEMPLATES.ORDER_CONFIRMED(orderNumber);
      break;
    case "preparing":
      message = SMS_TEMPLATES.ORDER_PREPARING(orderNumber);
      break;
    case "shipped":
      message = SMS_TEMPLATES.ORDER_SHIPPED(orderNumber, trackingCode);
      break;
    case "delivered":
      message = SMS_TEMPLATES.ORDER_DELIVERED(orderNumber);
      break;
    default:
      return { success: false, error: "Bilinmeyen sipariş durumu" };
  }

  return sendSms(phone, message);
};

// Destek bildirimi SMS gönder
export const sendSupportSms = async (
  phone: string,
  ticketNumber: string,
  type: "reply" | "resolved"
) => {
  const message =
    type === "reply"
      ? SMS_TEMPLATES.SUPPORT_REPLY(ticketNumber)
      : SMS_TEMPLATES.SUPPORT_RESOLVED(ticketNumber);

  return sendSms(phone, message);
};

// OTP kodu gönder
export const sendOtpSms = async (phone: string, code: string) => {
  return sendSms(phone, SMS_TEMPLATES.OTP_CODE(code));
};
