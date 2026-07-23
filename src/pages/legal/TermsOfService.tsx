import { motion } from "framer-motion";
import { FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
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
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Kullanım Koşulları</h1>
              <p className="text-muted-foreground">Son güncelleme: 24 Ocak 2026</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">1. Genel Hükümler</h2>
              <p className="text-muted-foreground leading-relaxed">
                Bu web sitesini kullanarak, aşağıdaki kullanım koşullarını kabul etmiş olursunuz. 
                Esdodesign, bu koşulları herhangi bir zamanda değiştirme hakkını saklı tutar. 
                Güncellemeler web sitesinde yayınlandığı anda yürürlüğe girer.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">2. Hizmet Tanımı</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Esdodesign, NFC teknolojisi tabanlı dijital çözümler sunmaktadır:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Dijital Kartvizit:</strong> NFC kartlarla profesyonel bilgilerinizi paylaşın</li>
                <li><strong>Evcil Hayvan Kimliği:</strong> Evcil hayvanlarınız için akıllı kimlik çözümü</li>
                <li><strong>Özel Yönlendirme:</strong> Herhangi bir URL'e yönlendiren NFC kartlar</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">3. Hesap Oluşturma</h2>
              <p className="text-muted-foreground leading-relaxed">
                Hizmetlerimizi kullanmak için bir hesap oluşturmanız gerekebilir. 
                Hesap bilgilerinizin doğru ve güncel olmasından siz sorumlusunuz. 
                Hesabınızın güvenliğini korumak ve şifrenizi başkalarıyla paylaşmamak 
                sizin sorumluluğunuzdadır.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">4. Sipariş ve Ödeme</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Sipariş ve ödeme süreçleri hakkında:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Tüm fiyatlar Türk Lirası (TL) cinsindendir ve KDV dahildir</li>
                <li>Ödemeler güvenli PayTR altyapısı üzerinden gerçekleştirilir</li>
                <li>Sipariş onayı e-posta ve/veya SMS ile bildirilir</li>
                <li>Ürünler sipariş onayından sonra hazırlanmaya başlanır</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">5. Abonelik Sistemi</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                NFC kartlarımız abonelik sistemi ile çalışmaktadır:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Her NFC kart satın alımı, belirtilen süre için abonelik içerir</li>
                <li>Abonelik süresi dolmadan önce yenileme hatırlatması yapılır</li>
                <li>Abonelik yenilenmezse, NFC kart yönlendirmesi devre dışı kalır</li>
                <li>Abonelik yenilemesi istediğiniz zaman yapılabilir</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">6. Kullanıcı Yükümlülükleri</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Hizmetlerimizi kullanırken aşağıdaki kurallara uymanız gerekmektedir:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Yasalara aykırı içerik paylaşmamak</li>
                <li>Başkalarının haklarını ihlal etmemek</li>
                <li>Yanıltıcı veya sahte bilgi vermemek</li>
                <li>Sistemi kötüye kullanmamak veya zarar vermemek</li>
                <li>Spam veya istenmeyen içerik paylaşmamak</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">7. Fikri Mülkiyet</h2>
              <p className="text-muted-foreground leading-relaxed">
                Web sitemizdeki tüm içerik, tasarım, logo, yazılım ve diğer materyaller 
                Esdodesign'a aittir ve telif hakları yasaları ile korunmaktadır. 
                Bu içeriklerin izinsiz kullanımı, kopyalanması veya dağıtılması yasaktır.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">8. Sorumluluk Sınırlaması</h2>
              <p className="text-muted-foreground leading-relaxed">
                Esdodesign, hizmetlerin kesintisiz veya hatasız olacağını garanti etmez. 
                Teknik sorunlar, bakım çalışmaları veya mücbir sebepler nedeniyle 
                hizmetlerde kesinti yaşanabilir. Bu durumlardan kaynaklanan zararlardan 
                sorumlu değiliz.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">9. Hesap Feshi</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kullanım koşullarının ihlali durumunda, Esdodesign hesabınızı askıya alma 
                veya feshetme hakkını saklı tutar. Hesabınızı istediğiniz zaman 
                kapatabilirsiniz.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">10. Uygulanacak Hukuk</h2>
              <p className="text-muted-foreground leading-relaxed">
                Bu kullanım koşulları Türkiye Cumhuriyeti yasalarına tabidir. 
                Herhangi bir uyuşmazlık durumunda İstanbul mahkemeleri ve icra daireleri yetkilidir.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">11. İletişim</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kullanım koşulları hakkında sorularınız için bizimle iletişime geçebilirsiniz:
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
