import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
  isReadOnly: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, currentUser?: User | null) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Profile not found, using metadata fallback');
        // Fallback: usar nombre del email o metadatos
        const activeUser = currentUser || user;
        const nameFromEmail = activeUser?.email?.split('@')[0] || 'Usuario';
        const firstName = activeUser?.user_metadata?.first_name || nameFromEmail;
        
        return {
          id: userId,
          first_name: firstName,
          last_name: activeUser?.user_metadata?.last_name || '',
          email: activeUser?.email || '',
          role: 'Usuario',
        };
      }

      return {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: user?.email || data.email || '',
        role: data.role,
        avatar_url: data.avatar_url,
      };
    } catch (err) {
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      setProfile(p);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 1. Obtener sesión de forma directa
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error al obtener sesión:', error.message);
          setLoading(false);
          return;
        }

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        // NO hacemos await aquí para no bloquear la aplicación si la DB tarda
        if (currentUser) {
          fetchProfile(currentUser.id, currentUser).then(setProfile);
        }
      } catch (error) {
        console.error('Error crítico al inicializar auth:', error);
      } finally {
        // Pase lo que pase, liberamos la pantalla de carga
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Suscribirse a cambios de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        // Carga en segundo plano
        fetchProfile(currentUser.id, currentUser).then(setProfile);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Role flags robustos
  const userRole = profile?.role?.trim().toLowerCase();
  const isAdmin = userRole === 'administrador' || userRole === 'socio ingentia' || userRole === 'project manager';
  const isReadOnly = userRole === 'lector' || !userRole;

  return (
    <UserContext.Provider value={{ 
      user, 
      profile, 
      setProfile, 
      loading, 
      signOut, 
      refreshProfile,
      isAdmin,
      isReadOnly
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
