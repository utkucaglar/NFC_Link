import { motion } from "framer-motion";
import { RotateCcw, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function RefundPolicy() {
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
              <RotateCcw className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">İade Politikası</h1>
              <p className="text-muted-foreground">Son güncelleme: 24 Ocak 2026</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">1. Genel İade Koşulları</h2>
              <p className="text-muted-foreground leading-relaxed">
                Esdodesign olarak müşteri memnuniyetini ön planda tutuyoruz. 
                Ürünlerimizle ilgili herhangi bir sorun yaşamanız durumunda, 
                aşağıdaki koşullar çerçevesinde iade veya değişim talep edebilirsiniz.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">2. İade Süresi</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ürününüzü teslim aldıktan sonra <strong>14 gün</strong> içinde iade talebinde bulunabilirsiniz. 
                Bu süre, ürünün size ulaştığı tarihten itibaren başlar.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">3. İade Edilebilir Ürünler</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2 text-accent">
                    <CheckCircle2 className="w-5 h-5" />
                    İade Kabul Edilen Durumlar
                  </h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-7">
                    <li>Üretim hatası bulunan ürünler</li>
                    <li>Kargoda hasar görmüş ürünler</li>
                    <li>Yanlış ürün gönderimi</li>
                    <li>NFC çipi çalışmayan ürünler</li>
                    <li>Açıklamadan farklı ürün teslimatı</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2 text-destructive">
                    <XCircle className="w-5 h-5" />
                    İade Kabul Edilmeyen Durumlar
                  </h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-7">
                    <li>Kullanıcı kaynaklı hasar (düşürme, kırma, ıslatma vb.)</li>
                    <li>Kişiselleştirilmiş ürünler (isim, logo basılı kartlar)</li>
                    <li>Aktif edilmiş ve kullanılmış NFC kartlar</li>
                    <li>14 günlük iade süresini aşmış ürünler</li>
                    <li>Orijinal ambalajı olmayan ürünler</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">4. Abonelik İadeleri</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Abonelik yenilemeleri için iade politikası:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Abonelik yenileme ödemesi yapıldıktan sonra <strong>7 gün</strong> içinde iade talep edilebilir</li>
                <li>Yenilenmiş abonelik aktif olarak kullanılmamış olmalıdır</li>
                <li>Kullanılmış abonelik süreleri için iade yapılmaz</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">5. İade Süreci</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium">İade Talebi Oluşturun</h3>
                    <p className="text-muted-foreground text-sm">
                      Destek sayfamızdan veya e-posta yoluyla iade talebinizi oluşturun. 
                      Sipariş numaranızı ve iade nedeninizi belirtin.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium">Onay Bekleyin</h3>
                    <p className="text-muted-foreground text-sm">
                      İade talebiniz 1-2 iş günü içinde değerlendirilir. 
                      Onay durumu e-posta ile bildirilir.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium">Ürünü Gönderin</h3>
                    <p className="text-muted-foreground text-sm">
                      Onaylanan iadeler için size kargo bilgileri iletilir. 
                      Ürünü orijinal ambalajında ve hasarsız şekilde gönderin.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold">
                    4
                  </div>
                  <div>
                    <h3 className="font-medium">Geri Ödeme</h3>
                    <p className="text-muted-foreground text-sm">
                      Ürün tarafımıza ulaştıktan ve kontrol edildikten sonra, 
                      ödemeniz 3-5 iş günü içinde iade edilir.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">6. Geri Ödeme Yöntemi</h2>
              <p className="text-muted-foreground leading-relaxed">
                Geri ödemeler, siparişte kullanılan ödeme yöntemine yapılır. 
                Kredi kartı ile yapılan ödemelerde, iade tutarı 3-5 iş günü içinde 
                kartınıza yansır. Banka havalesi ile yapılan ödemelerde, 
                belirteceğiniz IBAN numarasına transfer yapılır.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">7. Kargo Ücretleri</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Üretim hatası veya yanlış gönderim durumlarında kargo ücreti tarafımızca karşılanır</li>
                <li>Cayma hakkı kullanımında kargo ücreti müşteriye aittir</li>
                <li>Hasarlı kargo teslimatlarında kargo şirketine tutanak tutturulmalıdır</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">8. Değişim</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ürün değişimi talep etmeniz durumunda, önce iade süreci uygulanır, 
                ardından yeni sipariş oluşturmanız gerekir. Stok durumuna göre 
                değişim yapılabilir.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">9. İletişim</h2>
              <p className="text-muted-foreground leading-relaxed">
                İade ve değişim talepleriniz için bizimle iletişime geçebilirsiniz:
              </p>
              <div className="mt-4">
                <Link to="/contact">
                  <Button>
                    İade Talebi Oluştur
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
