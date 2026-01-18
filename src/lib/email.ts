// =================================================
// Email Service - Resend API
// =================================================

import { supabase } from "./supabase";

// Email Ayarları
interface EmailSettings {
  api_key: string;
  from_email: string;
  from_name: string;
  is_enabled: boolean;
}

// Email şablonu tipi
interface EmailTemplate {
  subject: string;
  html: string;
}

// =================================================
// Email Şablonları
// =================================================

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Esdodesign</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .footer { background: #1a1a2e; color: #888; padding: 20px; text-align: center; font-size: 12px; }
    .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #fff !important; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .info-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .order-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .highlight { color: #6366f1; font-weight: 600; }
    h2 { color: #1a1a2e; }
    a { color: #6366f1; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Esdodesign</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Esdodesign. Tüm hakları saklıdır.</p>
      <p>Bu email size Esdodesign tarafından gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
`;

export const EMAIL_TEMPLATES = {
  // Sipariş Onayı
  ORDER_CONFIRMED: (orderNumber: string, items: { name: string; quantity: number; price: number }[], total: number): EmailTemplate => ({
    subject: `Siparişiniz Alındı - #${orderNumber}`,
    html: baseTemplate(`
      <h2>Siparişiniz Başarıyla Alındı!</h2>
      <p>Merhaba,</p>
      <p><strong>#${orderNumber}</strong> numaralı siparişiniz başarıyla oluşturuldu. Siparişinizi en kısa sürede hazırlayıp kargoya vereceğiz.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">Sipariş Detayları</h3>
        ${items.map(item => `
          <div class="order-item">
            <span>${item.name} x${item.quantity}</span>
            <span>₺${(item.price * item.quantity).toLocaleString('tr-TR')}</span>
          </div>
        `).join('')}
        <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #6366f1;">
          <strong>Toplam: <span class="highlight">₺${total.toLocaleString('tr-TR')}</span></strong>
        </div>
      </div>

      <p>Siparişinizin durumunu hesabınızdan takip edebilirsiniz.</p>
      <a href="https://esdodesign.com/orders" class="button">Siparişlerimi Görüntüle</a>
      
      <p>Teşekkür ederiz,<br><strong>Esdodesign Ekibi</strong></p>
    `)
  }),

  // Kargoya Verildi
  ORDER_SHIPPED: (orderNumber: string, trackingCode?: string): EmailTemplate => ({
    subject: `Siparişiniz Kargoya Verildi - #${orderNumber}`,
    html: baseTemplate(`
      <h2>Siparişiniz Yola Çıktı! 🚚</h2>
      <p>Merhaba,</p>
      <p><strong>#${orderNumber}</strong> numaralı siparişiniz kargoya verildi.</p>
      
      ${trackingCode ? `
      <div class="info-box">
        <h3 style="margin-top: 0;">Kargo Takip</h3>
        <p>Takip Numarası: <strong class="highlight">${trackingCode}</strong></p>
      </div>
      ` : ''}

      <p>Kargonuzu takip etmek için aşağıdaki butona tıklayabilirsiniz.</p>
      <a href="https://esdodesign.com/orders" class="button">Kargo Takibi</a>
      
      <p>İyi günlerde kullanın!<br><strong>Esdodesign Ekibi</strong></p>
    `)
  }),

  // Teslim Edildi
  ORDER_DELIVERED: (orderNumber: string): EmailTemplate => ({
    subject: `Siparişiniz Teslim Edildi - #${orderNumber}`,
    html: baseTemplate(`
      <h2>Siparişiniz Teslim Edildi! ✅</h2>
      <p>Merhaba,</p>
      <p><strong>#${orderNumber}</strong> numaralı siparişiniz başarıyla teslim edildi.</p>
      
      <p>Ürünlerimizi beğendiyseniz değerlendirme yaparak bize destek olabilirsiniz.</p>
      <a href="https://esdodesign.com/orders" class="button">Değerlendirme Yap</a>
      
      <p>Bizi tercih ettiğiniz için teşekkür ederiz!<br><strong>Esdodesign Ekibi</strong></p>
    `)
  }),

  // Destek Yanıtı
  SUPPORT_REPLY: (ticketNumber: string, message: string): EmailTemplate => ({
    subject: `Destek Talebinize Yanıt - #${ticketNumber}`,
    html: baseTemplate(`
      <h2>Destek Talebinize Yanıt Verildi</h2>
      <p>Merhaba,</p>
      <p><strong>#${ticketNumber}</strong> numaralı destek talebinize yanıt verildi.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">Yanıt</h3>
        <p>${message}</p>
      </div>

      <p>Yanıtlamak veya detayları görüntülemek için:</p>
      <a href="https://esdodesign.com/contact" class="button">Destek Sayfasına Git</a>
      
      <p>Saygılarımızla,<br><strong>Esdodesign Destek Ekibi</strong></p>
    `)
  }),

  // Destek Çözüldü
  SUPPORT_RESOLVED: (ticketNumber: string): EmailTemplate => ({
    subject: `Destek Talebiniz Çözüldü - #${ticketNumber}`,
    html: baseTemplate(`
      <h2>Destek Talebiniz Çözüldü ✅</h2>
      <p>Merhaba,</p>
      <p><strong>#${ticketNumber}</strong> numaralı destek talebiniz çözüldü olarak işaretlendi.</p>
      
      <p>Eğer hala yardıma ihtiyacınız varsa yeni bir talep oluşturabilirsiniz.</p>
      <a href="https://esdodesign.com/contact" class="button">Yeni Talep Oluştur</a>
      
      <p>Teşekkür ederiz,<br><strong>Esdodesign Destek Ekibi</strong></p>
    `)
  }),

  // Hoş Geldiniz
  WELCOME: (firstName: string): EmailTemplate => ({
    subject: `Esdodesign'a Hoş Geldiniz!`,
    html: baseTemplate(`
      <h2>Hoş Geldiniz, ${firstName}! 🎉</h2>
      <p>Esdodesign ailesine katıldığınız için teşekkür ederiz.</p>
      
      <p>Artık NFC ürünlerimizi keşfedebilir ve dijital kimliğinizi oluşturabilirsiniz.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">Neler Yapabilirsiniz?</h3>
        <ul>
          <li>NFC Kartvizit ile iletişim bilgilerinizi paylaşın</li>
          <li>Pet ID ile evcil hayvanınızı koruyun</li>
          <li>NFC Redirect ile tek dokunuşla yönlendirme yapın</li>
        </ul>
      </div>

      <a href="https://esdodesign.com/products" class="button">Ürünleri Keşfet</a>
      
      <p>Sorularınız için bize ulaşabilirsiniz.<br><strong>Esdodesign Ekibi</strong></p>
    `)
  }),

  // Şifre Sıfırlama
  PASSWORD_RESET: (resetLink: string): EmailTemplate => ({
    subject: `Şifre Sıfırlama - Esdodesign`,
    html: baseTemplate(`
      <h2>Şifre Sıfırlama Talebi</h2>
      <p>Merhaba,</p>
      <p>Hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
      
      <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
      <a href="${resetLink}" class="button">Şifremi Sıfırla</a>
      
      <p style="color: #666; font-size: 14px;">Bu linkin geçerlilik süresi 1 saattir.</p>
      <p style="color: #666; font-size: 14px;">Eğer bu talebi siz yapmadıysanız bu emaili görmezden gelebilirsiniz.</p>
      
      <p>Saygılarımızla,<br><strong>Esdodesign Ekibi</strong></p>
    `)
  }),
};

// =================================================
// Email Gönderme Fonksiyonları
// =================================================

// Email Ayarlarını getir
export const getEmailSettings = async (): Promise<EmailSettings | null> => {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "email_settings")
      .single();

    if (error || !data) return null;
    return JSON.parse(data.value) as EmailSettings;
  } catch {
    return null;
  }
};

// Supabase Edge Function ile email gönder
export const sendEmail = async (
  to: string,
  template: EmailTemplate
): Promise<{ success: boolean; error?: string; id?: string }> => {
  const settings = await getEmailSettings();

  if (!settings) {
    console.log("Email ayarları bulunamadı");
    return { success: false, error: "Email ayarları yapılandırılmamış" };
  }

  if (!settings.is_enabled) {
    console.log("Email servisi devre dışı");
    return { success: false, error: "Email servisi devre dışı" };
  }

  try {
    // Supabase Edge Function'ı çağır
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to,
        subject: template.subject,
        html: template.html,
        from_name: settings.from_name,
        from_email: settings.from_email,
      },
    });

    if (error) {
      await logEmail(to, template.subject, "failed", error.message);
      return { success: false, error: error.message };
    }

    if (data?.success) {
      await logEmail(to, template.subject, "sent");
      return { success: true, id: data.id };
    } else {
      await logEmail(to, template.subject, "failed", data?.error);
      return { success: false, error: data?.error || "Email gönderilemedi" };
    }
  } catch (error: any) {
    await logEmail(to, template.subject, "failed", error.message);
    return { success: false, error: error.message };
  }
};

// Email Log kaydet
const logEmail = async (to: string, subject: string, status: string, error?: string) => {
  try {
    await supabase.from("email_logs").insert({
      to_email: to,
      subject,
      status,
      error_message: error,
    });
  } catch (err) {
    console.error("Email log error:", err);
  }
};

// =================================================
// Yardımcı Fonksiyonlar
// =================================================

// Sipariş durumu değiştiğinde email gönder
export const sendOrderStatusEmail = async (
  email: string,
  orderNumber: string,
  status: string,
  items?: { name: string; quantity: number; price: number }[],
  total?: number,
  trackingCode?: string
) => {
  let template: EmailTemplate;

  switch (status) {
    case "confirmed":
    case "pending":
      if (!items || !total) return { success: false, error: "Sipariş detayları eksik" };
      template = EMAIL_TEMPLATES.ORDER_CONFIRMED(orderNumber, items, total);
      break;
    case "shipped":
      template = EMAIL_TEMPLATES.ORDER_SHIPPED(orderNumber, trackingCode);
      break;
    case "delivered":
      template = EMAIL_TEMPLATES.ORDER_DELIVERED(orderNumber);
      break;
    default:
      return { success: false, error: "Bilinmeyen sipariş durumu" };
  }

  return sendEmail(email, template);
};

// Destek bildirimi email gönder
export const sendSupportEmail = async (
  email: string,
  ticketNumber: string,
  type: "reply" | "resolved",
  message?: string
) => {
  const template =
    type === "reply" && message
      ? EMAIL_TEMPLATES.SUPPORT_REPLY(ticketNumber, message)
      : EMAIL_TEMPLATES.SUPPORT_RESOLVED(ticketNumber);

  return sendEmail(email, template);
};

// Hoş geldiniz emaili
export const sendWelcomeEmail = async (email: string, firstName: string) => {
  return sendEmail(email, EMAIL_TEMPLATES.WELCOME(firstName));
};

// Test emaili
export const sendTestEmail = async (email: string) => {
  return sendEmail(email, {
    subject: "Test Email - Esdodesign",
    html: baseTemplate(`
      <h2>Test Emaili Başarılı! ✅</h2>
      <p>Bu bir test emailidir. Email sisteminiz doğru çalışıyor.</p>
      <p>Gönderim zamanı: ${new Date().toLocaleString('tr-TR')}</p>
    `)
  });
};
