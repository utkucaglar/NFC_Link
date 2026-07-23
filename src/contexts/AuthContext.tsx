import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, UserProfile } from "@/lib/supabase";
import { toast } from "sonner";
import { sendEmailConfirmation, sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/email";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAdmin: () => boolean;
  isAuthenticated: () => boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const translateAuthError = (message: string): string => {
  const translations: { [key: string]: string } = {
    "Invalid login credentials": "Geçersiz e-posta veya şifre",
    "Email not confirmed": "E-posta adresi henüz doğrulanmamış. Lütfen e-postanızı kontrol edin.",
    "User already registered": "Bu e-posta adresi zaten kayıtlı",
    "Password should be at least 6 characters": "Şifre en az 6 karakter olmalıdır",
    "Unable to validate email address: invalid format": "Geçersiz e-posta formatı",
    "Email rate limit exceeded": "Çok fazla istek gönderildi. Lütfen bekleyin.",
    "For security purposes, you can only request this after": "Güvenlik nedeniyle, bu işlemi ancak",
    "User not found": "Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı",
    "duplicate key value violates unique constraint": "Bu e-posta adresi zaten kayıtlı",
    "Email already exists": "Bu e-posta adresi zaten kayıtlı",
  };

  for (const [eng, tr] of Object.entries(translations)) {
    if (message.toLowerCase().includes(eng.toLowerCase())) {
      // Sayıyı çıkar ve Türkçe mesaj oluştur (rate limit için)
      const match = message.match(/(\d+)\s*seconds?/i);
      if (match && eng.includes("security purposes")) {
        return `Güvenlik nedeniyle, bu işlemi ancak ${match[1]} saniye sonra yapabilirsiniz`;
      }
      return tr;
    }
  }
  return message;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  const fetchProfile = async (userId: string, userEmail?: string): Promise<UserProfile | null> => {
    try {
      // Get profile from database
      const { data: existingProfile, error: selectError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (existingProfile && !selectError) {
        return existingProfile as UserProfile;
      }

      // Profile doesn't exist, create it
      if (selectError?.code === 'PGRST116') {
        // Get user metadata
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const userMeta = authUser?.user_metadata || {};

        const newProfile = {
          id: userId,
          email: userEmail || authUser?.email || '',
          first_name: userMeta.first_name || '',
          last_name: userMeta.last_name || '',
          full_name: userMeta.full_name || `${userMeta.first_name || ''} ${userMeta.last_name || ''}`.trim(),
          role: 'customer',
        };

        const { data: insertedProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single();

        if (insertedProfile && !insertError) {
          return insertedProfile as UserProfile;
        }

        // Return default profile if insert fails
        return {
          ...newProfile,
          phone: null,
          address: null,
          role: 'customer' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  // Handle session change
  const handleSession = async (session: Session | null) => {
    setUser(session?.user ?? null);

    if (session?.user) {
      const userProfile = await fetchProfile(session.user.id, session.user.email);
      setProfile(userProfile);
    } else {
      setProfile(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const redirectUrl = `${window.location.origin}/auth/callback`;

    // Email'in zaten kayıtlı olup olmadığını kontrol et
    // user_profiles tablosunda email kontrolü yap
    const { data: existingUser, error: checkError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (normal durum)
      // Diğer hatalar gerçek hatalar
      console.error('Email kontrol hatası:', checkError);
    }

    if (existingUser) {
      const errorMessage = "Bu e-posta adresi zaten kayıtlı. Lütfen farklı bir e-posta adresi kullanın.";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Supabase'de email confirmation'ı disable ettiğimiz için otomatik confirm edilir
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
        },
        emailRedirectTo: redirectUrl,
        // Email confirmation disabled - kullanıcı otomatik confirm edilir
      },
    });

    if (error) {
      const turkishMessage = translateAuthError(error.message);
      toast.error(turkishMessage);
      throw error;
    }

    if (data.user) {
      // Resend ile hoş geldiniz emaili gönder
      // Not: Email confirmation disabled olduğu için confirmation emaili göndermiyoruz
      // Kullanıcı zaten otomatik confirm edilmiş durumda
      try {
        await sendWelcomeEmail(email, firstName);
      } catch (emailError: any) {
        console.error("Email gönderme hatası:", emailError);
        // Email hatası olsa bile kayıt başarılı
      }

      toast.success("Hesabınız oluşturuldu! Hoş geldiniz!");
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      const turkishMessage = translateAuthError(error.message);
      toast.error(turkishMessage);
      throw error;
    }

    if (data.user) {
      toast.success("Hoş geldiniz!");
    }
  };

  const signOut = async () => {
    setUser(null);
    setProfile(null);
    await supabase.auth.signOut();
    toast.success("Çıkış yapıldı");
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user?.email) {
      toast.error("Kullanıcı bilgisi bulunamadı");
      throw new Error("User not found");
    }

    // Verify current password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      toast.error("Mevcut şifre hatalı");
      throw new Error("Mevcut şifre hatalı");
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      toast.error(translateAuthError(updateError.message));
      throw updateError;
    }

    toast.success("Şifreniz başarıyla değiştirildi");
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    // Supabase'in resetPasswordForEmail'i token oluşturur ve email gönderir
    // Email confirmation disabled olsa bile şifre sıfırlama emaili gönderilir
    // Ama email'i Resend ile göndermek için Supabase email hook kullanılmalı
    
    // Şimdilik: Supabase'in kendi email sistemini kullan
    // Production'da Resend kullanmak için Supabase Dashboard'da email hook ayarlanmalı
    
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: redirectUrl,
    });

    if (error) {
      const turkishMessage = translateAuthError(error.message);
      toast.error(turkishMessage);
      throw error;
    }

    // Not: Supabase'in oluşturduğu reset token'ını direkt alamayız
    // Resend ile email göndermek için Supabase email hook kullanılmalı
    // Veya Supabase Edge Function ile auth event'leri yakalanmalı
    
    toast.success("Şifre sıfırlama e-postası gönderildi! Lütfen e-postanızı kontrol edin.");
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) {
      toast.error("Giriş yapmalısınız");
      throw new Error("User not logged in");
    }

    const { data: updatedData, error } = await supabase
      .from('user_profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      toast.error("Profil güncellenemedi");
      throw error;
    }

    if (updatedData) {
      setProfile(updatedData as UserProfile);
      toast.success("Profil başarıyla güncellendi");
    }
  };

  const isAdmin = () => profile?.role === 'admin';
  const isAuthenticated = () => !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        updatePassword,
        resetPassword,
        isAdmin,
        isAuthenticated,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
