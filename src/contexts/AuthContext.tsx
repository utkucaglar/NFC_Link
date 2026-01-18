import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, UserProfile } from "@/lib/supabase";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
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
  };

  for (const [eng, tr] of Object.entries(translations)) {
    if (message.toLowerCase().includes(eng.toLowerCase())) {
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
        },
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      const turkishMessage = translateAuthError(error.message);
      toast.error(turkishMessage);
      throw error;
    }

    if (data.user) {
      toast.success("Hesabınız oluşturuldu! E-postanızı doğrulayın.");
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
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
