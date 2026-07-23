import { motion } from "framer-motion";
import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Back Button */}
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ana Sayfa
            </Button>
          </Link>

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Gizlilik Politikası</h1>
              <p className="text-muted-foreground">Son güncelleme: 24 Ocak 2026</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">1. Giriş</h2>
              <p className="text-muted-foreground leading-relaxed">
                Esdodesign olarak, kişisel verilerinizin gizliliğine büyük önem veriyoruz. 
                Bu Gizlilik Politikası, web sitemizi ve hizmetlerimizi kullandığınızda 
                kişisel bilgilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklamaktadır.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">2. Toplanan Bilgiler</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Hizmetlerimizi kullanırken aşağıdaki bilgileri toplayabiliriz:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Kimlik Bilgileri:</strong> Ad, soyad, e-posta adresi, telefon numarası</li>
                <li><strong>İletişim Bilgileri:</strong> Teslimat adresi, fatura adresi</li>
                <li><strong>Sipariş Bilgileri:</strong> Satın aldığınız ürünler, sipariş geçmişi</li>
                <li><strong>Ödeme Bilgileri:</strong> Ödeme işlemleri PayTR altyapısı üzerinden güvenli şekilde gerçekleştirilir</li>
                <li><strong>NFC Kart Bilgileri:</strong> Kartvizit, evcil hayvan kimliği veya yönlendirme için girdiğiniz bilgiler</li>
                <li><strong>Teknik Bilgiler:</strong> IP adresi, tarayıcı türü, cihaz bilgisi</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">3. Bilgilerin Kullanımı</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Topladığımız bilgileri aşağıdaki amaçlarla kullanırız:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Siparişlerinizi işlemek ve teslim etmek</li>
                <li>NFC kartlarınızı programlamak ve yönetmek</li>
                <li>Müşteri hizmetleri desteği sağlamak</li>
                <li>Sipariş durumu ve kargo bildirimleri göndermek</li>
                <li>Hizmetlerimizi geliştirmek ve kişiselleştirmek</li>
                <li>Yasal yükümlülüklerimizi yerine getirmek</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">4. Bilgi Güvenliği</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kişisel verilerinizi korumak için endüstri standardı güvenlik önlemleri kullanıyoruz. 
                Verileriniz SSL şifreleme ile korunur ve güvenli sunucularda saklanır. 
                Ödeme işlemleri PCI-DSS uyumlu PayTR altyapısı üzerinden gerçekleştirilir.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">5. Çerezler (Cookies)</h2>
              <p className="text-muted-foreground leading-relaxed">
                Web sitemiz, deneyiminizi geliştirmek için çerezler kullanmaktadır. 
                Çerezler, oturum yönetimi, tercihlerinizin hatırlanması ve site 
                performansının analiz edilmesi için kullanılır. Tarayıcı ayarlarınızdan 
                çerezleri yönetebilirsiniz.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">6. Üçüncü Taraflarla Paylaşım</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Kişisel verilerinizi aşağıdaki durumlar dışında üçüncü taraflarla paylaşmayız:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Kargo şirketleri (teslimat için gerekli bilgiler)</li>
                <li>Ödeme hizmeti sağlayıcıları (PayTR)</li>
                <li>Yasal zorunluluklar gerektirdiğinde</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">7. Haklarınız</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                KVKK kapsamında aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>Kişisel verileriniz hakkında bilgi talep etme</li>
                <li>Kişisel verilerinizin düzeltilmesini isteme</li>
                <li>Kişisel verilerinizin silinmesini talep etme</li>
                <li>Kişisel verilerinizin işlenmesine itiraz etme</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">8. İletişim</h2>
              <p className="text-muted-foreground leading-relaxed">
                Gizlilik politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz:
              </p>
              <div className="mt-4">
                <Link to="/contact">
                  <Button>
                    İletişime Geç
                  </Button>
                </Link>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
