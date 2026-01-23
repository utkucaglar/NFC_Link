import { motion } from "framer-motion";
import { FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PreInformationForm() {
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
              <h1 className="text-3xl font-bold">Ön Bilgilendirme Formu</h1>
              <p className="text-muted-foreground">Son güncelleme: 24 Ocak 2026</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">1. SATICI BİLGİLERİ</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <p><strong>Unvan:</strong> Doğukan Akar</p>
                <p><strong>Adres:</strong> Esenköy mh. Esenköy sol sk. 437/2 15 Muğla/Fethiye</p>
                <p><strong>Telefon:</strong> 0538 415 50 42</p>
                <p><strong>E-posta:</strong> info@esdodesign.com</p>
              </div>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">2. SÖZLEŞME KONUSU ÜRÜN/HİZMET BİLGİLERİ</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                İşbu sözleşme kapsamında satışa konu olan ürünler:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>NFC Dijital Kartvizitler</li>
                <li>NFC Evcil Hayvan Kimlik Kartları</li>
                <li>NFC Özel Yönlendirme Kartları</li>
                <li>NFC Bileklikler ve Aksesuarlar</li>
                <li>Dijital içerik ve abonelik hizmetleri</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Ürünlerin temel nitelikleri, satış fiyatı ve ödeme şekline ilişkin bilgiler 
                sipariş onay sayfasında yer almaktadır.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">3. ÜRÜN FİYATI VE ÖDEME BİLGİLERİ</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Tüm fiyatlar Türk Lirası (TL) cinsinden belirtilmiştir.</li>
                <li>Fiyatlara KDV dahildir.</li>
                <li>Kargo ücreti sipariş tutarına göre değişiklik gösterebilir ve sipariş özetinde ayrıca belirtilir.</li>
                <li>Ödeme, kredi kartı veya banka kartı ile güvenli PayTR altyapısı üzerinden gerçekleştirilir.</li>
                <li>Taksitli ödeme seçenekleri banka ve kart tipine göre değişiklik gösterebilir.</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">4. TESLİMAT BİLGİLERİ</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Teslimat Süresi:</strong> Siparişiniz, ödeme onayından itibaren 1-5 iş günü içinde kargoya verilir.</li>
                <li><strong>Teslimat Şekli:</strong> Anlaşmalı kargo firması aracılığıyla kapıda teslimat yapılır.</li>
                <li><strong>Teslimat Adresi:</strong> Sipariş sırasında belirtilen adrese teslimat yapılır.</li>
                <li>Kargo takip numarası, ürün kargoya verildiğinde SMS ve/veya e-posta ile bildirilir.</li>
                <li>Teslimat sırasında alıcının bulunmaması halinde, kargo firmasının prosedürü uygulanır.</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">5. CAYMA HAKKI</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Tüketici, hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin, 
                malı teslim aldığı tarihten itibaren <strong>14 (on dört) gün</strong> içinde cayma hakkını kullanabilir.
              </p>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mt-4">
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">⚠️ Cayma Hakkının Kullanılamayacağı Durumlar:</p>
                <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                  <li>Tüketicinin istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan, kişiselleştirilmiş ürünler (isim, logo basılı NFC kartlar)</li>
                  <li>Elektronik ortamda anında ifa edilen hizmetler (aktive edilmiş dijital içerikler)</li>
                  <li>Tüketici tarafından ambalajı açılmış ve kullanılmış ürünler</li>
                </ul>
              </div>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">6. CAYMA HAKKI KULLANIM ŞEKLİ</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Cayma hakkını kullanmak isteyen tüketici, 14 günlük süre içinde:
              </p>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                <li>Destek sayfamızdan veya e-posta yoluyla cayma talebini iletmelidir.</li>
                <li>Sipariş numarası ve cayma gerekçesini belirtmelidir.</li>
                <li>Ürünü, orijinal ambalajında ve hasarsız olarak iade etmelidir.</li>
                <li>Ürün iade kargo ücreti tüketiciye aittir (üretim hatası hariç).</li>
              </ol>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Cayma bildiriminin satıcıya ulaşmasından itibaren 14 gün içinde ödeme iade edilir.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">7. ABONELİK HİZMETLERİ</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                NFC kartlarımız abonelik sistemi ile çalışmaktadır:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Her NFC kart satın alımı, belirtilen süre için (1 yıl veya ömür boyu) abonelik içerir.</li>
                <li>Abonelik süresi dolmadan önce e-posta ve/veya SMS ile hatırlatma yapılır.</li>
                <li>Abonelik yenilenmezse, NFC kart yönlendirmesi devre dışı kalır ancak fiziksel kart kullanılabilir durumda kalır.</li>
                <li>Abonelik istediğiniz zaman yenilenebilir.</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">8. GARANTİ KOŞULLARI</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>NFC ürünlerimiz üretim hatalarına karşı <strong>1 yıl</strong> garantilidir.</li>
                <li>Garanti, normal kullanım koşullarında meydana gelen arızaları kapsar.</li>
                <li>Kullanıcı kaynaklı hasarlar (düşürme, kırma, ıslatma vb.) garanti kapsamı dışındadır.</li>
                <li>Garanti kapsamındaki ürünler ücretsiz olarak değiştirilir veya onarılır.</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">9. UYUŞMAZLIK ÇÖZÜMÜ</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                İşbu sözleşmeden doğan uyuşmazlıklarda:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Tüketici, şikayetlerini Tüketici Mahkemelerine veya Tüketici Hakem Heyetlerine başvurabilir.</li>
                <li>Parasal sınırlar dahilinde İl/İlçe Tüketici Hakem Heyetleri yetkilidir.</li>
                <li>Satıcının bulunduğu yer mahkemeleri ve icra daireleri de yetkilidir.</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">10. YÜRÜRLÜK</h2>
              <p className="text-muted-foreground leading-relaxed">
                İşbu ön bilgilendirme formu, tüketicinin elektronik ortamda onay vermesiyle birlikte 
                yürürlüğe girer. Tüketici, siparişi tamamlamadan önce bu formu okuduğunu ve anladığını kabul eder.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">İLETİŞİM</h2>
              <p className="text-muted-foreground leading-relaxed">
                Sorularınız için bizimle iletişime geçebilirsiniz:
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
