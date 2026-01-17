import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase, UserProfile } from "@/lib/supabase";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile - Native fetch API kullanarak (Chrome uyumluluğu için)
  const fetchProfile = async (userId: string, userEmail?: string): Promise<UserProfile | null> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase config missing');
        return null;
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}&select=*`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Error fetching profile:', response.status);
        // Return a default profile if fetch fails
        return {
          id: userId,
          email: userEmail || user?.email || '',
          full_name: null,
          phone: null,
          address: null,
          role: 'customer' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        // Return a default profile if no data
        return {
          id: userId,
          email: userEmail || user?.email || '',
          full_name: null,
          phone: null,
          address: null,
          role: 'customer' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      return data[0] as UserProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userProfile = await fetchProfile(session.user.id, session.user.email);
          if (mounted) {
            setProfile(userProfile);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userProfile = await fetchProfile(session.user.id, session.user.email);
          if (mounted) {
            setProfile(userProfile);
          }
        } else {
          setProfile(null);
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Profile should be created automatically by the trigger
        toast.success("Hesabınız oluşturuldu! Giriş yapabilirsiniz.");
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || "Kayıt sırasında bir hata oluştu");
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Hoş geldiniz!");
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || "Giriş yapılırken bir hata oluştu");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Önce state'i temizle
      setUser(null);
      setProfile(null);
      
      // Sonra Supabase'den çıkış yap
      await supabase.auth.signOut();
      
      toast.success("Çıkış yapıldı");
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Hata olsa bile state temizlenmiş olacak
      toast.error("Çıkış yapılırken bir hata oluştu");
    }
  };

  const isAdmin = () => {
    return profile?.role === 'admin';
  };

  const isAuthenticated = () => {
    return !!user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        isAdmin,
        isAuthenticated,
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
