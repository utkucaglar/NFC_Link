import { motion } from "framer-motion";
import { ScrollText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function DistanceSalesAgreement() {
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
              <ScrollText className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Mesafeli Satış Sözleşmesi</h1>
              <p className="text-muted-foreground">Son güncelleme: 24 Ocak 2026</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">MADDE 1 - TARAFLAR</h2>
              <div className="text-muted-foreground leading-relaxed space-y-4">
                <div>
                  <p className="font-medium text-foreground">1.1 SATICI:</p>
                  <p><strong>Unvan:</strong> Doğukan Akar</p>
                  <p><strong>Adres:</strong> Esenköy mh. Esenköy sol sk. 437/2 15 Muğla/Fethiye</p>
                  <p><strong>Telefon:</strong> 0538 415 50 42</p>
                  <p><strong>E-posta:</strong> info@esdodesign.com</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">1.2 ALICI (TÜKETİCİ):</p>
                  <p>Sipariş sırasında sisteme girilen ad, soyad, adres ve iletişim bilgileri geçerlidir.</p>
                </div>
              </div>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">MADDE 2 - KONU</h2>
              <p className="text-muted-foreground leading-relaxed">
                İşbu Mesafeli Satış Sözleşmesi, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve 
                Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerini düzenler.
                Sözleşme konusu ürün/hizmetlerin temel nitelikleri, satış fiyatı ve ödeme şekli ile teslimata 
                ilişkin bilgiler aşağıda ve sipariş sayfasında yer almaktadır.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">MADDE 3 - SÖZLEŞME KONUSU ÜRÜN/HİZMETLER</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Esdodesign tarafından satışa sunulan NFC teknolojili ürünler:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>NFC Dijital Kartvizit:</strong> Profesyonel bilgilerinizi tek dokunuşla paylaşmanızı sağlayan akıllı kart</li>
                <li><strong>NFC Evcil Hayvan Kimliği:</strong> Evcil hayvanlarınız için dijital kimlik çözümü</li>
                <li><strong>NFC Özel Yönlendirme:</strong> İstediğiniz URL'e yönlendiren kişiselleştirilebilir NFC kart</li>
                <li><strong>Dijital Abonelik Hizmetleri:</strong> NFC kartların aktif kalması için gerekli yıllık veya ömür boyu abonelik</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Ürünlerin özellikleri, renk seçenekleri ve fiyatları sipariş sayfasında belirtilmektedir.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">MADDE 4 - FİYAT VE ÖDEME</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Ürün fiyatları Türk Lirası (TL) cinsinden belirlenmiş olup KDV dahildir.</li>
                <li>Kargo ücreti, sipariş özet sayfasında ayrıca belirtilir.</li>
                <li>Ödeme, PayTR güvenli ödeme altyapısı üzerinden kredi kartı veya banka kartı ile yapılır.</li>
                <li>Taksitli ödeme imkanı, anlaşmalı bankalar ve kart tipleri için geçerlidir.</li>
                <li>Sipariş tutarı, ödeme onayı alındıktan sonra kesinleşir.</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">MADDE 5 - TESLİMAT</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Ürünler, sipariş onayından itibaren en geç <strong>30 (otuz) gün</strong> içinde teslim edilir.</li>
                <li>Standart teslimat süresi 1-5 iş günüdür.</li>
                <li>Teslimat, ALICI'nın sipariş sırasında belirttiği adrese yapılır.</li>
                <li>Teslimat sırasında ALICI'nın adreste bulunmaması halinde kargo firmasının prosedürü uygulanır.</li>
                <li>Kargo firması kaynaklı gecikmelerden SATICI sorumlu tutulamaz.</li>
                <li>Ürün tesliminde hasar tespit edilirse, tutanak tutularak SATICI'ya bildirilmelidir.</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">MADDE 6 - ALICININ YÜKÜMLÜLÜKLERİ</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>ALICI, sipariş sırasında beyan ettiği bilgilerin doğruluğundan sorumludur.</li>
                <li>ALICI, ürünü teslim aldığında kontrol etmekle yükümlüdür.</li>
                <li>ALICI, NFC ürünleri yasalara uygun şekilde kullanmayı kabul eder.</li>
                <li>Abonelik yenileme bildirimleri, ALICI'nın kayıtlı iletişim bilgilerine gönderilir.</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">MADDE 7 - SATICININ YÜKÜMLÜLÜKLERİ</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>SATICI, sözleşme konusu ürünü eksiksiz ve siparişe uygun şekilde teslim etmekle yükümlüdür.</li>
                <li>SATICI, ürünün kalite standartlarına uygunluğunu garanti eder.</li>
                <li>SATICI, ALICI'nın kişisel verilerini gizli tutmakla yükümlüdür.</li>
                <li>SATICI, abonelik süresince dijital hizmetlerin kesintisiz sunulması için azami özeni gösterir.</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">MADDE 8 - CAYMA HAKKI</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                ALICI, hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin, 
                ürünü teslim aldığı tarihten itibaren <strong>14 (on dört) gün</strong> içinde cayma hakkını kullanabilir.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Cayma hakkının kullanılması için:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>14 gün içinde SATICI'ya yazılı bildirimde bulunulmalıdır.</li>
                <li>Ürün, orijinal ambalajında ve kullanılmamış olarak iade edilmelidir.</li>
                <li>İade kargo ücreti ALICI'ya aittir (üretim hatası durumları hariç).</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">MADDE 9 - CAYMA HAKKININ KULLANILAMAYACAĞI HALLER</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi gereği aşağıdaki durumlarda cayma hakkı kullanılamaz:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Tüketicinin istekleri veya açıkça kişisel ihtiyaçları doğrultusunda hazırlanan ürünler (kişiselleştirilmiş NFC kartlar)</li>
                <li>Çabuk bozulabilen veya son kullanma tarihi geçebilecek ürünler</li>
                <li>Tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış ürünler</li>
                <li>Elektronik ortamda anında ifa edilen hizmetler</li>
                <li>Abonelik süresi başlamış dijital içerikler</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">MADDE 10 - İADE VE GERİ ÖDEME</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Cayma hakkı kullanıldığında, SATICI ürünü teslim aldığından itibaren 14 gün içinde ödemeyi iade eder.</li>
                <li>İade, sipariş sırasında kullanılan ödeme yöntemiyle yapılır.</li>
                <li>Kredi kartı ile yapılan ödemelerde iade, bankanın prosedürüne bağlı olarak 1-4 hafta sürebilir.</li>
                <li>Ürünün SATICI'ya ulaşmadan iade işlemi başlatılmaz.</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">MADDE 11 - GARANTİ</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>NFC ürünleri, üretim hatalarına karşı <strong>1 (bir) yıl</strong> garantilidir.</li>
                <li>Garanti süresi, ürünün teslim tarihinden itibaren başlar.</li>
                <li>Kullanıcı kaynaklı arızalar garanti kapsamı dışındadır.</li>
                <li>Garanti kapsamındaki ürünler ücretsiz onarılır veya yenisiyle değiştirilir.</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">MADDE 12 - GİZLİLİK</h2>
              <p className="text-muted-foreground leading-relaxed">
                SATICI, ALICI'nın kişisel verilerini 6698 sayılı Kişisel Verilerin Korunması Kanunu 
                kapsamında korumayı taahhüt eder. Kişisel veriler, yasal zorunluluklar dışında 
                üçüncü kişilerle paylaşılmaz. Detaylı bilgi için{" "}
                <Link to="/privacy-policy" className="text-primary hover:underline">Gizlilik Politikası</Link>
                {" "}sayfasını inceleyebilirsiniz.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">MADDE 13 - UYUŞMAZLIK ÇÖZÜMÜ</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                İşbu sözleşmeden doğan uyuşmazlıklarda:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.</li>
                <li>Parasal sınırlar her yıl güncellenmekte olup güncel sınırlar için Ticaret Bakanlığı'nın duyuruları esas alınır.</li>
                <li>SATICI'nın bulunduğu yer mahkemeleri ve icra daireleri de yetkilidir.</li>
              </ul>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">MADDE 14 - YÜRÜRLÜK</h2>
              <p className="text-muted-foreground leading-relaxed">
                İşbu sözleşme, ALICI tarafından elektronik ortamda onaylanması ile yürürlüğe girer. 
                ALICI, siparişi tamamlamadan önce sözleşmenin tüm hükümlerini okuduğunu, anladığını 
                ve kabul ettiğini beyan eder.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>Sözleşme Tarihi:</strong> Sipariş tarihinde elektronik ortamda onaylanmıştır.
              </p>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">İLETİŞİM</h2>
              <p className="text-muted-foreground leading-relaxed">
                Sözleşme ile ilgili sorularınız için bizimle iletişime geçebilirsiniz:
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
