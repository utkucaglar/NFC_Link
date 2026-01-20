import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  Pencil,
  Check,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getProductImage, formatPrice } from "@/lib/helpers";

interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

type NFCType = "business-card" | "pet-id" | "redirect" | null;

interface Product {
  id: number;
  name: string;
  description: string | null;
  short_description: string | null;
  long_description: string | null;
  price: number;
  category: string;
  category_id: number | null;
  image_url: string | null;
  images: string[] | null;
  features: string[] | null;
  colors: string[] | null;
  specs: Record<string, string> | null;
  monthly_subscription_fee: number;
  stock_quantity: number;
  sku: string | null;
  is_active: boolean;
  sort_order: number;
  nfc_type: NFCType;
  created_at: string;
  updated_at: string;
}

const NFC_TYPE_OPTIONS = [
  { value: "business-card", label: "Dijital Kartvizit", description: "İsim, telefon, sosyal medya bilgileri" },
  { value: "pet-id", label: "Evcil Hayvan Kimliği", description: "Hayvan bilgileri, sahip iletişimi" },
  { value: "redirect", label: "Özel Yönlendirme", description: "Sevgililer sayfası, galeri, anılar" },
];

const emptyProduct: Partial<Product> = {
  name: "",
  description: "",
  short_description: "",
  long_description: "",
  price: 0,
  category: "",
  category_id: null,
  image_url: "",
  features: [],
  colors: [],
  specs: {},
  monthly_subscription_fee: 29,
  stock_quantity: 0,
  sku: "",
  is_active: true,
  sort_order: 0,
  nfc_type: null,
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "details" | "specs">("basic");
  
  // Feature, color, spec ekleme için state'ler
  const [newFeature, setNewFeature] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  
  // Inline editing state'leri
  const [editingFeatureIndex, setEditingFeatureIndex] = useState<number | null>(null);
  const [editingFeatureValue, setEditingFeatureValue] = useState("");
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
  const [editingColorValue, setEditingColorValue] = useState("");
  const [editingSpecKey, setEditingSpecKey] = useState<string | null>(null);
  const [editingSpecKeyValue, setEditingSpecKeyValue] = useState("");
  const [editingSpecValueValue, setEditingSpecValueValue] = useState("");
  
  // Image upload state'leri
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Renk bazlı görsel state'leri - her renk için birden fazla görsel
  interface ColorImage {
    id?: number; // Veritabanından gelen ID (varsa)
    image_url: string;
    sort_order: number;
    tempId?: string; // Yeni eklenen görseller için geçici ID
  }
  const [colorImages, setColorImages] = useState<Record<string, ColorImage[]>>({});
  const [uploadingColorImages, setUploadingColorImages] = useState<Record<string, boolean>>({});
  const [colorImagePreviews, setColorImagePreviews] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    fetchData();
  }, []);

  // Ürün düzenlenirken renk görsellerini yükle
  useEffect(() => {
    if (editingProduct?.id) {
      loadColorImages(editingProduct.id);
    } else {
      setColorImages({});
      setColorImagePreviews({});
    }
  }, [editingProduct?.id]);

  const fetchData = async () => {
    try {
      // Ürünleri getir
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true });

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Kategorileri getir
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (!categoriesError && categoriesData) {
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Veri yüklenirken hata:", error);
      toast.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  // Dosya yükleme fonksiyonu
  const uploadImageFile = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      
      // Ürün ID'si varsa onu kullan, yoksa geçici bir ID oluştur
      const productId = editingProduct?.id || `temp-${Date.now()}`;
      const fileExt = file.name.split('.').pop();
      const fileName = `products/${productId}/${Date.now()}.${fileExt}`;
      
      // Önce eski görseli sil (düzenleme durumunda)
      if (editingProduct?.id && editingProduct?.image_url) {
        const oldUrl = editingProduct.image_url;
        // Supabase storage URL'i ise dosya yolunu çıkar
        if (oldUrl.includes('/storage/v1/object/public/')) {
          const pathMatch = oldUrl.match(/\/storage\/v1\/object\/public\/product-images\/(.+)/);
          if (pathMatch) {
            await supabase.storage.from("product-images").remove([pathMatch[1]]);
          }
        }
      }
      
      const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
      
      return urlData.publicUrl;
    } catch (error: any) {
      console.error("Görsel yükleme hatası:", error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  // Dosya seçildiğinde preview oluştur
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Dosya tipi kontrolü
      if (!file.type.startsWith('image/')) {
        toast.error("Lütfen bir resim dosyası seçin");
        return;
      }
      
      // Dosya boyutu kontrolü (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Dosya boyutu 10MB'dan küçük olmalıdır");
        return;
      }
      
      setSelectedFile(file);
      
      // Preview oluştur
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Renk bazlı görsel yükleme - birden fazla görsel eklenebilir
  const handleColorImageSelect = async (color: string, e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleColorImageSelect called", { color, files: e.target.files });
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      // Input'u resetle
      e.target.value = '';
      return;
    }
    
    console.log("File selected:", { name: file.name, size: file.size, type: file.type });

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      toast.error("Lütfen bir resim dosyası seçin");
      e.target.value = '';
      return;
    }
    
    // Dosya boyutu kontrolü (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Dosya boyutu 10MB'dan küçük olmalıdır");
      e.target.value = '';
      return;
    }

    // Preview oluştur
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const reader = new FileReader();
    reader.onloadend = () => {
      setColorImagePreviews(prev => ({
        ...prev,
        [color]: {
          ...(prev[color] || {}),
          [tempId]: reader.result as string
        }
      }));
    };
    reader.readAsDataURL(file);

    // Görseli yükle
    try {
      setUploadingColorImages(prev => ({ ...prev, [color]: true }));
      
      const productId = editingProduct?.id || `temp-${Date.now()}`;
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const fileName = `products/${productId}/colors/${color}/${timestamp}-${random}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }
      
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
      
      if (!urlData?.publicUrl) {
        throw new Error("Görsel URL'i alınamadı");
      }
      
      // Array'e ekle
      setColorImages(prev => {
        const currentImages = prev[color] || [];
        const maxSortOrder = currentImages.length > 0 
          ? Math.max(...currentImages.map(img => img.sort_order))
          : -1;
        
        const newImage = {
          image_url: urlData.publicUrl,
          sort_order: maxSortOrder + 1,
          tempId
        };
        
        console.log(`Adding image to ${color}:`, newImage);
        console.log(`Current images for ${color}:`, currentImages);
        
        return {
          ...prev,
          [color]: [
            ...currentImages,
            newImage
          ]
        };
      });
      
      toast.success(`${color} rengi için görsel yüklendi`);
    } catch (error: any) {
      console.error("Renk görseli yükleme hatası:", error);
      toast.error(`${color} rengi için görsel yüklenemedi: ${error.message || 'Bilinmeyen hata'}`);
      // Preview'ı da sil
      setColorImagePreviews(prev => {
        const newPreviews = { ...prev };
        if (newPreviews[color]) {
          delete newPreviews[color][tempId];
        }
        return newPreviews;
      });
    } finally {
      setUploadingColorImages(prev => ({ ...prev, [color]: false }));
      // Input'u resetle - aynı dosyayı tekrar seçebilmek için
      e.target.value = '';
    }
  };


  // Belirli bir renk görselini sil
  const removeColorImage = async (color: string, imageIndex: number) => {
    const images = colorImages[color] || [];
    const imageToRemove = images[imageIndex];
    if (!imageToRemove) return;

    try {
      // Eğer ürün kaydedilmişse ve görsel Supabase storage'da ise sil
      if (editingProduct?.id && imageToRemove.id && imageToRemove.image_url.includes('/storage/v1/object/public/')) {
        const pathMatch = imageToRemove.image_url.match(/\/storage\/v1\/object\/public\/product-images\/(.+)/);
        if (pathMatch) {
          await supabase.storage.from("product-images").remove([pathMatch[1]]);
        }

        // product_images tablosundan sil
        await supabase
          .from("product_images")
          .delete()
          .eq("id", imageToRemove.id);
      } else if (imageToRemove.image_url.includes('/storage/v1/object/public/')) {
        // Henüz kaydedilmemiş ama yüklenmiş görsel
        const pathMatch = imageToRemove.image_url.match(/\/storage\/v1\/object\/public\/product-images\/(.+)/);
        if (pathMatch) {
          await supabase.storage.from("product-images").remove([pathMatch[1]]);
        }
      }

      // State'ten sil
      setColorImages(prev => {
        const newImages = { ...prev };
        if (newImages[color]) {
          newImages[color] = newImages[color].filter((_, idx) => idx !== imageIndex);
          if (newImages[color].length === 0) {
            delete newImages[color];
          }
        }
        return newImages;
      });

      // Preview'ı da sil
      if (imageToRemove.tempId) {
        setColorImagePreviews(prev => {
          const newPreviews = { ...prev };
          if (newPreviews[color]) {
            delete newPreviews[color][imageToRemove.tempId!];
          }
          return newPreviews;
        });
      }

      toast.success("Görsel silindi");
    } catch (error) {
      console.error("Renk görseli silme hatası:", error);
      toast.error("Görsel silinemedi");
    }
  };

  // Görsel sıralamasını değiştir
  const moveColorImage = (color: string, imageIndex: number, direction: 'up' | 'down') => {
    setColorImages(prev => {
      const images = [...(prev[color] || [])];
      const newIndex = direction === 'up' ? imageIndex - 1 : imageIndex + 1;
      
      if (newIndex < 0 || newIndex >= images.length) return prev;
      
      // sort_order'ları değiştir
      const temp = images[imageIndex].sort_order;
      images[imageIndex].sort_order = images[newIndex].sort_order;
      images[newIndex].sort_order = temp;
      
      // Array'i yeniden sırala
      images.sort((a, b) => a.sort_order - b.sort_order);
      
      return {
        ...prev,
        [color]: images
      };
    });
  };

  // Ürün düzenlenirken renk görsellerini yükle
  const loadColorImages = async (productId: number) => {
    try {
      const { data, error } = await supabase
        .from("product_images")
        .select("id, color, image_url, sort_order")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      const imagesMap: Record<string, ColorImage[]> = {};
      data?.forEach(item => {
        if (!imagesMap[item.color]) {
          imagesMap[item.color] = [];
        }
        imagesMap[item.color].push({
          id: item.id,
          image_url: item.image_url,
          sort_order: item.sort_order
        });
      });

      setColorImages(imagesMap);
      
      // Preview'ları da ayarla
      const previewsMap: Record<string, Record<string, string>> = {};
      Object.entries(imagesMap).forEach(([color, images]) => {
        previewsMap[color] = {};
        images.forEach(img => {
          if (img.tempId) {
            previewsMap[color][img.tempId] = img.image_url;
          }
        });
      });
      setColorImagePreviews(previewsMap);
    } catch (error) {
      console.error("Renk görselleri yüklenemedi:", error);
    }
  };

  const handleSave = async () => {
    if (!editingProduct?.name || !editingProduct?.price || !editingProduct?.category) {
      toast.error("Lütfen zorunlu alanları doldurun (Ad, Fiyat, Kategori)");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = editingProduct.image_url || null;
      
      // Dosya seçilmişse yükle
      if (selectedFile) {
        const uploadedUrl = await uploadImageFile(selectedFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          toast.error("Görsel yüklenemedi");
          return;
        }
      }

      const productData = {
        name: editingProduct.name,
        description: editingProduct.description || null,
        short_description: editingProduct.short_description || null,
        long_description: editingProduct.long_description || null,
        price: editingProduct.price,
        category: editingProduct.category,
        category_id: editingProduct.category_id || null,
        image_url: imageUrl,
        features: editingProduct.features || null,
        colors: editingProduct.colors || null,
        specs: editingProduct.specs || null,
        monthly_subscription_fee: editingProduct.monthly_subscription_fee || 29,
        stock_quantity: editingProduct.stock_quantity || 0,
        sku: editingProduct.sku || null,
        is_active: editingProduct.is_active ?? true,
        sort_order: editingProduct.sort_order || 0,
        nfc_type: editingProduct.nfc_type || null,
        updated_at: new Date().toISOString(),
      };

      let savedProductId: number;

      if (editingProduct.id) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;
        savedProductId = editingProduct.id;
        toast.success("Ürün güncellendi");
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert({
            ...productData,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (error) throw error;
        savedProductId = data.id;
        toast.success("Ürün oluşturuldu");
      }

      // Renk görsellerini kaydet - her renk için birden fazla görsel
      if (Object.keys(colorImages).length > 0 && savedProductId) {
        // Önce bu ürünün tüm mevcut görsellerini sil
        await supabase
          .from("product_images")
          .delete()
          .eq("product_id", savedProductId);

        // Tüm renk görsellerini ekle
        const colorImageEntries: Array<{
          product_id: number;
          color: string;
          image_url: string;
          sort_order: number;
        }> = [];

        Object.entries(colorImages).forEach(([color, images]) => {
          images.forEach((img, index) => {
            colorImageEntries.push({
              product_id: savedProductId,
              color,
              image_url: img.image_url,
              sort_order: img.sort_order !== undefined ? img.sort_order : index,
            });
          });
        });

        if (colorImageEntries.length > 0) {
          const { error: imagesError } = await supabase
            .from("product_images")
            .insert(colorImageEntries);

          if (imagesError) {
            console.error("Renk görselleri kaydedilemedi:", imagesError);
            toast.error("Renk görselleri kaydedilemedi");
          } else {
            toast.success(`${colorImageEntries.length} görsel kaydedildi`);
          }
        }
      } else if (savedProductId && Object.keys(colorImages).length === 0) {
        // Eğer hiç görsel yoksa, mevcut görselleri sil
        await supabase
          .from("product_images")
          .delete()
          .eq("product_id", savedProductId);
      }

      setShowModal(false);
      setEditingProduct(null);
      setSelectedFile(null);
      setImagePreview(null);
      setColorImages({});
      setColorImagePreviews({});
      setActiveTab("basic");
      fetchData();
    } catch (error: any) {
      console.error("Kaydetme hatası:", error);
      toast.error(error.message || "Ürün kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: number) => {
    try {
      // Önce bu ürünün siparişlerde kullanılıp kullanılmadığını kontrol et
      const { data: orderItems, error: checkError } = await supabase
        .from("order_items")
        .select("id, order_id")
        .eq("product_id", productId)
        .limit(1);

      if (checkError) {
        console.error("Kontrol hatası:", checkError);
      }

      // Eğer siparişlerde kullanılıyorsa
      if (orderItems && orderItems.length > 0) {
        toast.error(
          "Bu ürün siparişlerde kullanıldığı için silinemez. Ürünü pasif yapabilirsiniz.",
          {
            duration: 5000,
          }
        );
        setDeleteConfirm(null);
        return;
      }

      // Ürün görsellerini de sil
      const { error: imagesError } = await supabase
        .from("product_images")
        .delete()
        .eq("product_id", productId);

      if (imagesError) {
        console.error("Görsel silme hatası:", imagesError);
        // Devam et, görsel silme hatası kritik değil
      }

      // Ürünü sil
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));
      toast.success("Ürün silindi");
      setDeleteConfirm(null);
    } catch (error: any) {
      console.error("Silme hatası:", error);
      
      // Foreign key hatası kontrolü
      if (error?.code === "23503" || error?.message?.includes("foreign key")) {
        toast.error(
          "Bu ürün siparişlerde kullanıldığı için silinemez. Ürünü pasif yapabilirsiniz.",
          {
            duration: 5000,
          }
        );
      } else {
        toast.error(`Ürün silinemedi: ${error?.message || "Bilinmeyen hata"}`);
      }
      setDeleteConfirm(null);
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !product.is_active, updated_at: new Date().toISOString() })
        .eq("id", product.id);

      if (error) throw error;

      setProducts(products.map(p =>
        p.id === product.id ? { ...p, is_active: !p.is_active } : p
      ));
      toast.success(product.is_active ? "Ürün pasife alındı" : "Ürün aktif edildi");
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      toast.error("Durum güncellenemedi");
    }
  };

  // Feature ekleme/silme/düzenleme/sıralama
  const addFeature = () => {
    if (!newFeature.trim()) return;
    const features = editingProduct?.features || [];
    setEditingProduct({ ...editingProduct, features: [...features, newFeature.trim()] });
    setNewFeature("");
  };

  const removeFeature = (index: number) => {
    const features = editingProduct?.features || [];
    setEditingProduct({ ...editingProduct, features: features.filter((_, i) => i !== index) });
  };

  const moveFeature = (index: number, direction: 'up' | 'down') => {
    const features = [...(editingProduct?.features || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= features.length) return;
    [features[index], features[newIndex]] = [features[newIndex], features[index]];
    setEditingProduct({ ...editingProduct, features });
  };

  const startEditFeature = (index: number) => {
    setEditingFeatureIndex(index);
    setEditingFeatureValue(editingProduct?.features?.[index] || "");
  };

  const saveEditFeature = () => {
    if (editingFeatureIndex === null || !editingFeatureValue.trim()) return;
    const features = [...(editingProduct?.features || [])];
    features[editingFeatureIndex] = editingFeatureValue.trim();
    setEditingProduct({ ...editingProduct, features });
    setEditingFeatureIndex(null);
    setEditingFeatureValue("");
  };

  // Color ekleme/silme/düzenleme/sıralama
  const addColor = () => {
    if (!newColor.trim()) return;
    const colors = editingProduct?.colors || [];
    setEditingProduct({ ...editingProduct, colors: [...colors, newColor.trim()] });
    setNewColor("");
  };

  const removeColor = (index: number) => {
    const colors = editingProduct?.colors || [];
    setEditingProduct({ ...editingProduct, colors: colors.filter((_, i) => i !== index) });
  };

  const moveColor = (index: number, direction: 'up' | 'down') => {
    const colors = [...(editingProduct?.colors || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= colors.length) return;
    [colors[index], colors[newIndex]] = [colors[newIndex], colors[index]];
    setEditingProduct({ ...editingProduct, colors });
  };

  const startEditColor = (index: number) => {
    setEditingColorIndex(index);
    setEditingColorValue(editingProduct?.colors?.[index] || "");
  };

  const saveEditColor = () => {
    if (editingColorIndex === null || !editingColorValue.trim()) return;
    const colors = [...(editingProduct?.colors || [])];
    colors[editingColorIndex] = editingColorValue.trim();
    setEditingProduct({ ...editingProduct, colors });
    setEditingColorIndex(null);
    setEditingColorValue("");
  };

  // Spec ekleme/silme/düzenleme/sıralama
  const addSpec = () => {
    if (!newSpecKey.trim() || !newSpecValue.trim()) return;
    const specs = editingProduct?.specs || {};
    setEditingProduct({ ...editingProduct, specs: { ...specs, [newSpecKey.trim()]: newSpecValue.trim() } });
    setNewSpecKey("");
    setNewSpecValue("");
  };

  const removeSpec = (key: string) => {
    const specs = { ...(editingProduct?.specs || {}) };
    delete specs[key];
    setEditingProduct({ ...editingProduct, specs });
  };

  const moveSpec = (key: string, direction: 'up' | 'down') => {
    const specs = editingProduct?.specs || {};
    const entries = Object.entries(specs);
    const index = entries.findIndex(([k]) => k === key);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= entries.length) return;
    [entries[index], entries[newIndex]] = [entries[newIndex], entries[index]];
    setEditingProduct({ ...editingProduct, specs: Object.fromEntries(entries) });
  };

  const startEditSpec = (key: string, value: string) => {
    setEditingSpecKey(key);
    setEditingSpecKeyValue(key);
    setEditingSpecValueValue(value);
  };

  const saveEditSpec = () => {
    if (!editingSpecKey || !editingSpecKeyValue.trim() || !editingSpecValueValue.trim()) return;
    const specs = { ...(editingProduct?.specs || {}) };
    // Eski key'i sil, yeni key ile ekle
    delete specs[editingSpecKey];
    // Sıralamayı koru
    const entries = Object.entries(editingProduct?.specs || {});
    const newEntries = entries.map(([k, v]) => 
      k === editingSpecKey ? [editingSpecKeyValue.trim(), editingSpecValueValue.trim()] : [k, v]
    );
    setEditingProduct({ ...editingProduct, specs: Object.fromEntries(newEntries) });
    setEditingSpecKey(null);
    setEditingSpecKeyValue("");
    setEditingSpecValueValue("");
  };

  // Kategori kaydetme
  const handleSaveCategory = async () => {
    if (!editingCategory?.name) {
      toast.error("Kategori adı gerekli");
      return;
    }

    setSaving(true);
    try {
      if (editingCategory.id) {
        const { error } = await supabase
          .from("categories")
          .update({
            name: editingCategory.name,
            description: editingCategory.description,
            is_active: editingCategory.is_active ?? true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingCategory.id);

        if (error) throw error;
        toast.success("Kategori güncellendi");
      } else {
        const { error } = await supabase
          .from("categories")
          .insert({
            name: editingCategory.name,
            description: editingCategory.description,
            is_active: editingCategory.is_active ?? true,
            sort_order: categories.length,
          });

        if (error) throw error;
        toast.success("Kategori oluşturuldu");
      }

      setShowCategoryModal(false);
      setEditingCategory(null);
      fetchData();
    } catch (error: any) {
      console.error("Kategori kaydetme hatası:", error);
      if (error.message?.includes("duplicate")) {
        toast.error("Bu kategori adı zaten mevcut");
      } else {
        toast.error("Kategori kaydedilemedi");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (categoryId: number) => {
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      setCategories(categories.filter(c => c.id !== categoryId));
      toast.success("Kategori silindi");
    } catch (error) {
      console.error("Kategori silme hatası:", error);
      toast.error("Kategori silinemedi (ürünler bu kategoriye bağlı olabilir)");
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-gradient">Ürünler</span>
            </h1>
            <p className="text-muted-foreground">
              {products.length} ürün, {products.filter(p => p.is_active).length} aktif
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingCategory({ name: "", description: "", is_active: true });
                setShowCategoryModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Kategori
            </Button>
            <Button
              onClick={() => {
                setEditingProduct(emptyProduct);
                setActiveTab("basic");
                setSelectedFile(null);
                setImagePreview(null);
                setShowModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Ürün
            </Button>
          </div>
        </motion.div>

        {/* Categories Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 flex-wrap"
        >
          <span className="text-sm text-muted-foreground py-2">Kategoriler:</span>
          {categories.map((cat) => (
            <Badge
              key={cat.id}
              variant="outline"
              className={cn(
                "cursor-pointer hover:bg-primary/10 transition-colors",
                !cat.is_active && "opacity-50"
              )}
              onClick={() => {
                setEditingCategory(cat);
                setShowCategoryModal(true);
              }}
            >
              {cat.name}
              <Edit className="w-3 h-3 ml-1" />
            </Badge>
          ))}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Ürün adı, kategori veya SKU ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden group",
                !product.is_active && "opacity-60"
              )}
            >
              <div className="aspect-square bg-muted/30 relative overflow-hidden">
                <img
                  src={getProductImage(product.image_url, product.category)}
                  alt={product.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 p-4"
                />
                {!product.is_active && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                    <Badge variant="secondary">Pasif</Badge>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs text-primary font-medium mb-1">{product.category}</p>
                    <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {product.stock_quantity} stok
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {product.short_description || product.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-gradient">
                    ₺{product.price.toLocaleString("tr-TR")}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleActive(product)}
                      title={product.is_active ? "Pasife Al" : "Aktif Et"}
                    >
                      {product.is_active ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingProduct({
                          ...product,
                          features: product.features || [],
                          colors: product.colors || [],
                          specs: product.specs || {},
                        });
                        setActiveTab("basic");
                        setSelectedFile(null);
                        setImagePreview(null);
                        setShowModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm(product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-card rounded-2xl"
          >
            <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Ürün bulunamadı</p>
          </motion.div>
        )}
      </div>

      {/* Product Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct?.id ? "Ürünü Düzenle" : "Yeni Ürün"}
            </DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border pb-4">
            <Button
              variant={activeTab === "basic" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("basic")}
            >
              Temel Bilgiler
            </Button>
            <Button
              variant={activeTab === "details" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("details")}
            >
              Özellikler & Renkler
            </Button>
            <Button
              variant={activeTab === "specs" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("specs")}
            >
              Teknik Bilgiler
            </Button>
          </div>

          <div className="space-y-6 py-4">
            {/* Basic Info Tab */}
            {activeTab === "basic" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Ürün Adı *</Label>
                    <Input
                      id="name"
                      value={editingProduct?.name || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      placeholder="NFC Kartvizit - Premium"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Kategori *</Label>
                    <select
                      id="category"
                      value={editingProduct?.category || ""}
                      onChange={(e) => {
                        const cat = categories.find(c => c.name === e.target.value);
                        // Kategori adına göre otomatik NFC tipi belirleme
                        let autoNfcType: NFCType = null;
                        const catName = e.target.value.toLowerCase();
                        if (catName.includes("kartvizit") || catName.includes("dijital")) {
                          autoNfcType = "business-card";
                        } else if (catName.includes("evcil") || catName.includes("hayvan")) {
                          autoNfcType = "pet-id";
                        } else if (catName.includes("yönlendirme") || catName.includes("özel")) {
                          autoNfcType = "redirect";
                        }
                        setEditingProduct({ 
                          ...editingProduct, 
                          category: e.target.value,
                          category_id: cat?.id || null,
                          nfc_type: editingProduct?.nfc_type || autoNfcType
                        });
                      }}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">Seçin...</option>
                      {categories.filter(c => c.is_active).map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="nfc_type">NFC Tipi *</Label>
                    <select
                      id="nfc_type"
                      value={editingProduct?.nfc_type || ""}
                      onChange={(e) => setEditingProduct({ 
                        ...editingProduct, 
                        nfc_type: (e.target.value as NFCType) || null 
                      })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">Seçin...</option>
                      {NFC_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {NFC_TYPE_OPTIONS.find(o => o.value === editingProduct?.nfc_type)?.description || "Ürünün NFC sayfası tipini belirler"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sku">SKU (Stok Kodu)</Label>
                    <Input
                      id="sku"
                      value={editingProduct?.sku || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                      placeholder="NFC-CARD-001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Fiyat (₺) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={editingProduct?.price || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                      placeholder="199"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subscription">Aylık Abonelik (₺)</Label>
                    <Input
                      id="subscription"
                      type="number"
                      value={editingProduct?.monthly_subscription_fee || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, monthly_subscription_fee: parseFloat(e.target.value) || 0 })}
                      placeholder="29"
                    />
                  </div>

                  <div>
                    <Label htmlFor="stock">Stok Miktarı</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={editingProduct?.stock_quantity || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock_quantity: parseInt(e.target.value) || 0 })}
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sort">Sıralama</Label>
                    <Input
                      id="sort"
                      type="number"
                      value={editingProduct?.sort_order || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, sort_order: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Ürün Görseli</Label>
                  
                  {/* File Input */}
                  <div>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        id="file-upload"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        {imagePreview ? (
                          <>
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-32 h-32 object-contain rounded-lg mb-2"
                            />
                            <p className="text-sm text-muted-foreground">
                              {selectedFile?.name}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedFile(null);
                                setImagePreview(null);
                                const fileInput = document.getElementById("file-upload") as HTMLInputElement;
                                if (fileInput) fileInput.value = "";
                              }}
                            >
                              Değiştir
                            </Button>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-12 h-12 text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">Dosya seçmek için tıklayın</p>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG, WEBP (Max 10MB)
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                    {uploadingImage && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Görsel yükleniyor...
                      </div>
                    )}
                  </div>

                  {/* Preview */}
                  <div className="mt-4">
                    <Label className="text-sm text-muted-foreground mb-2 block">Önizleme</Label>
                    <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted border border-border">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <img
                          src={getProductImage(editingProduct?.image_url || null, editingProduct?.category || "")}
                          alt="Preview"
                          className="w-full h-full object-contain p-2"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="short_description">Kısa Açıklama</Label>
                  <Input
                    id="short_description"
                    value={editingProduct?.short_description || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, short_description: e.target.value })}
                    placeholder="Kart listesinde görünecek kısa açıklama..."
                  />
                </div>

                <div>
                  <Label htmlFor="description">Açıklama</Label>
                  <textarea
                    id="description"
                    value={editingProduct?.description || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    placeholder="Ürün açıklaması..."
                    className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background text-sm resize-none"
                  />
                </div>

                <div>
                  <Label htmlFor="long_description">Detaylı Açıklama</Label>
                  <textarea
                    id="long_description"
                    value={editingProduct?.long_description || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, long_description: e.target.value })}
                    placeholder="Ürün detay sayfasında görünecek uzun açıklama..."
                    className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-sm resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div>
                    <p className="font-medium">Ürün Durumu</p>
                    <p className="text-sm text-muted-foreground">Pasif ürünler müşterilere gösterilmez</p>
                  </div>
                  <Switch
                    checked={editingProduct?.is_active ?? true}
                    onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, is_active: checked })}
                  />
                </div>
              </>
            )}

            {/* Features & Colors Tab */}
            {activeTab === "details" && (
              <>
                {/* Features */}
                <div>
                  <Label className="mb-3 block">Özellikler (sürükleyerek sıralayın)</Label>
                  <div className="space-y-2 mb-3">
                    {(editingProduct?.features || []).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 bg-muted/30 rounded-lg p-2 group">
                        {/* Sıralama butonları */}
                        <div className="flex flex-col gap-0.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-6 h-6 opacity-50 hover:opacity-100"
                            onClick={() => moveFeature(index, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-6 h-6 opacity-50 hover:opacity-100"
                            onClick={() => moveFeature(index, 'down')}
                            disabled={index === (editingProduct?.features?.length || 0) - 1}
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        {/* İçerik - düzenleme modu */}
                        {editingFeatureIndex === index ? (
                          <div className="flex-1 flex gap-2">
                            <Input
                              value={editingFeatureValue}
                              onChange={(e) => setEditingFeatureValue(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && saveEditFeature()}
                              autoFocus
                              className="flex-1"
                            />
                            <Button size="icon" variant="ghost" className="w-8 h-8 text-green-600" onClick={saveEditFeature}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => setEditingFeatureIndex(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1 text-sm">{feature}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => startEditFeature(index)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-8 h-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeFeature(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Yeni özellik ekle..."
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                    />
                    <Button onClick={addFeature} disabled={!newFeature.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <Label className="mb-3 block">Renk Seçenekleri</Label>
                  <div className="space-y-2 mb-3">
                    {(editingProduct?.colors || []).map((color, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2 group">
                          {/* Sıralama butonları */}
                          <div className="flex flex-col gap-0.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-6 h-6 opacity-50 hover:opacity-100"
                              onClick={() => moveColor(index, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-6 h-6 opacity-50 hover:opacity-100"
                              onClick={() => moveColor(index, 'down')}
                              disabled={index === (editingProduct?.colors?.length || 0) - 1}
                            >
                              <ArrowDown className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          {/* İçerik - düzenleme modu */}
                          {editingColorIndex === index ? (
                            <div className="flex-1 flex gap-2">
                              <Input
                                value={editingColorValue}
                                onChange={(e) => setEditingColorValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && saveEditColor()}
                                autoFocus
                                className="flex-1"
                              />
                              <Button size="icon" variant="ghost" className="w-8 h-8 text-green-600" onClick={saveEditColor}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => setEditingColorIndex(null)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="flex-1 text-sm font-medium">{color}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => startEditColor(index)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-8 h-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeColor(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                        
                        {/* Renk görseli yükleme - birden fazla görsel */}
                        <div className="ml-8 bg-muted/20 rounded-lg p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">{color} rengi için görseller</Label>
                            <span className="text-xs text-muted-foreground">
                              {(colorImages[color] || []).length} görsel
                            </span>
                          </div>
                          
                          {/* Mevcut görseller listesi */}
                          {(colorImages[color] || []).length > 0 && (
                            <div className="space-y-2">
                              {colorImages[color].map((img, imgIndex) => {
                                const previewUrl = img.tempId 
                                  ? (colorImagePreviews[color]?.[img.tempId] || img.image_url)
                                  : img.image_url;
                                
                                return (
                                  <div key={img.id || img.tempId || imgIndex} className="flex items-center gap-3 bg-background rounded-lg p-2 border border-border">
                                    {/* Sıralama butonları */}
                                    <div className="flex flex-col gap-0.5">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="w-5 h-5 opacity-50 hover:opacity-100"
                                        onClick={() => moveColorImage(color, imgIndex, 'up')}
                                        disabled={imgIndex === 0}
                                      >
                                        <ArrowUp className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="w-5 h-5 opacity-50 hover:opacity-100"
                                        onClick={() => moveColorImage(color, imgIndex, 'down')}
                                        disabled={imgIndex === (colorImages[color]?.length || 0) - 1}
                                      >
                                        <ArrowDown className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    
                                    {/* Görsel önizleme */}
                                    <img
                                      src={previewUrl}
                                      alt={`${color} renk görseli ${imgIndex + 1}`}
                                      className="w-16 h-16 object-contain rounded border border-border bg-background"
                                    />
                                    
                                    {/* Görsel bilgisi */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-muted-foreground truncate">
                                        {img.image_url.length > 50 
                                          ? `${img.image_url.substring(0, 50)}...` 
                                          : img.image_url}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Sıra: {img.sort_order + 1}
                                      </p>
                                    </div>
                                    
                                    {/* Sil butonu */}
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="text-xs text-destructive"
                                      onClick={() => removeColorImage(color, imgIndex)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Yeni görsel ekleme */}
                          <div className="pt-2 border-t border-border">
                            <input
                              type="file"
                              id={`color-image-${color}-${index}`}
                              accept="image/*"
                              multiple={false}
                              onChange={(e) => handleColorImageSelect(color, e)}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs w-full"
                              disabled={uploadingColorImages[color]}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const fileInput = document.getElementById(`color-image-${color}-${index}`) as HTMLInputElement;
                                if (fileInput) {
                                  fileInput.click();
                                }
                              }}
                            >
                              {uploadingColorImages[color] ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1" />
                                  Yükleniyor...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3 h-3 mr-1" />
                                  Dosya Yükle
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      placeholder="Yeni renk ekle..."
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addColor())}
                    />
                    <Button onClick={addColor} disabled={!newColor.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Specs Tab */}
            {activeTab === "specs" && (
              <div>
                <Label className="mb-3 block">Teknik Özellikler (sürükleyerek sıralayın)</Label>
                <div className="space-y-2 mb-4">
                  {Object.entries(editingProduct?.specs || {}).map(([key, value], index, arr) => (
                    <div key={key} className="flex items-center gap-2 bg-muted/30 rounded-lg p-3 group">
                      {/* Sıralama butonları */}
                      <div className="flex flex-col gap-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-6 h-6 opacity-50 hover:opacity-100"
                          onClick={() => moveSpec(key, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-6 h-6 opacity-50 hover:opacity-100"
                          onClick={() => moveSpec(key, 'down')}
                          disabled={index === arr.length - 1}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      {/* İçerik - düzenleme modu */}
                      {editingSpecKey === key ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={editingSpecKeyValue}
                            onChange={(e) => setEditingSpecKeyValue(e.target.value)}
                            placeholder="Özellik adı"
                            className="w-1/3"
                          />
                          <Input
                            value={editingSpecValueValue}
                            onChange={(e) => setEditingSpecValueValue(e.target.value)}
                            placeholder="Değer"
                            onKeyDown={(e) => e.key === "Enter" && saveEditSpec()}
                            className="flex-1"
                          />
                          <Button size="icon" variant="ghost" className="w-8 h-8 text-green-600" onClick={saveEditSpec}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => setEditingSpecKey(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium text-sm w-1/3">{key}</span>
                          <span className="text-sm text-muted-foreground flex-1">{value}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => startEditSpec(key, value)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeSpec(key)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-4 border-2 border-dashed border-border rounded-lg">
                  <p className="text-sm font-medium mb-3">Yeni Teknik Özellik Ekle</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={newSpecKey}
                      onChange={(e) => setNewSpecKey(e.target.value)}
                      placeholder="Özellik adı (Boyut, Malzeme...)"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={newSpecValue}
                        onChange={(e) => setNewSpecValue(e.target.value)}
                        placeholder="Değer"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpec())}
                      />
                      <Button onClick={addSpec} disabled={!newSpecKey.trim() || !newSpecValue.trim()}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowModal(false);
                  setEditingProduct(null);
                  setSelectedFile(null);
                  setImagePreview(null);
                  setImageUploadMethod("url");
                  setActiveTab("basic");
                }}
              >
                İptal
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={saving || uploadingImage}
              >
                {saving || uploadingImage ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Kaydet
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory?.id ? "Kategoriyi Düzenle" : "Yeni Kategori"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="catName">Kategori Adı *</Label>
              <Input
                id="catName"
                value={editingCategory?.name || ""}
                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                placeholder="Profesyonel"
              />
            </div>

            <div>
              <Label htmlFor="catDesc">Açıklama</Label>
              <Input
                id="catDesc"
                value={editingCategory?.description || ""}
                onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                placeholder="Kategori açıklaması..."
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium">Kategori Durumu</p>
                <p className="text-sm text-muted-foreground">Pasif kategoriler ürün eklerken görünmez</p>
              </div>
              <Switch
                checked={editingCategory?.is_active ?? true}
                onCheckedChange={(checked) => setEditingCategory({ ...editingCategory, is_active: checked })}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              {editingCategory?.id && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (editingCategory.id) {
                      deleteCategory(editingCategory.id);
                      setShowCategoryModal(false);
                      setEditingCategory(null);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Sil
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                }}
              >
                İptal
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveCategory}
                disabled={saving}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Kaydet
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ürünü Sil</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </p>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteConfirm(null)}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Sil
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
