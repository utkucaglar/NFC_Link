import { motion } from "framer-motion";
import { Phone, MapPin, Heart, AlertCircle, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PetData {
  petName: string;
  petPhoto?: string;
  ownerName: string;
  ownerPhone: string;
  address?: string;
  medicalNotes?: string;
  microchipNumber?: string;
}

const sampleData: PetData = {
  petName: "Pamuk",
  ownerName: "Ayşe Demir",
  ownerPhone: "+90 555 987 6543",
  address: "Beşiktaş, İstanbul",
  medicalNotes: "Düzenli aşıları tam. Kuru mama dışında yiyecek vermeyin.",
  microchipNumber: "982000123456789"
};

export default function NFCPetId() {
  const data = sampleData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-400 to-pink-500 p-8 text-center relative">
            <div className="absolute inset-0 opacity-20">
              <PawPrint className="absolute top-4 left-4 w-8 h-8 text-white" />
              <PawPrint className="absolute bottom-4 right-4 w-8 h-8 text-white rotate-45" />
              <PawPrint className="absolute top-1/2 right-8 w-6 h-6 text-white -rotate-12" />
            </div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-32 h-32 mx-auto bg-card rounded-full flex items-center justify-center shadow-xl mb-4 relative z-10 overflow-hidden"
            >
              <PawPrint className="w-16 h-16 text-orange-400" />
            </motion.div>
            
            <h1 className="text-3xl font-bold text-white">{data.petName}</h1>
            <div className="flex items-center justify-center gap-1 mt-2">
              <Heart className="w-4 h-4 text-white/80 fill-white/80" />
              <span className="text-white/80 text-sm">Kayıp değilim, sadece maceraperestim!</span>
            </div>
          </div>

          {/* Alert Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-6 -mt-4 relative z-20"
          >
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Beni buldunuz mu?</p>
                <p className="text-sm text-destructive/80">Lütfen aşağıdaki numaradan sahibime ulaşın!</p>
              </div>
            </div>
          </motion.div>

          {/* Owner Info */}
          <div className="p-6 space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-sm text-muted-foreground mb-1">Sahibim</p>
              <p className="font-semibold text-lg">{data.ownerName}</p>
            </motion.div>

            {/* Call Button */}
            <motion.a
              href={`tel:${data.ownerPhone}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button variant="hero" className="w-full" size="lg">
                <Phone className="w-5 h-5 mr-2" />
                Sahibimi Ara: {data.ownerPhone}
              </Button>
            </motion.a>

            {/* Address */}
            {data.address && (
              <motion.a
                href={`https://maps.google.com/?q=${encodeURIComponent(data.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Evim</p>
                  <p className="font-medium">{data.address}</p>
                </div>
              </motion.a>
            )}

            {/* Medical Notes */}
            {data.medicalNotes && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="p-4 bg-accent/10 rounded-2xl border border-accent/20"
              >
                <p className="text-sm font-medium text-accent mb-1">Sağlık Notları</p>
                <p className="text-sm text-muted-foreground">{data.medicalNotes}</p>
              </motion.div>
            )}

            {/* Microchip */}
            {data.microchipNumber && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="p-4 bg-muted/30 rounded-2xl"
              >
                <p className="text-sm text-muted-foreground">Mikroçip Numarası</p>
                <p className="font-mono font-medium">{data.microchipNumber}</p>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 text-center">
            <p className="text-xs text-muted-foreground">
              Powered by <span className="text-gradient font-semibold">NFCLink</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
