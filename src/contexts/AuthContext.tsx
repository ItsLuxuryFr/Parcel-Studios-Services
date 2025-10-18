import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setIsLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: SupabaseUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading user profile:', error);
        throw error;
      }

      if (profile) {
        setUser({
          id: profile.id,
          email: profile.email,
          displayName: profile.display_name || '',
          avatar: profile.avatar || undefined,
          bio: profile.bio || undefined,
          joinDate: profile.created_at,
          onboardingCompleted: profile.onboarding_completed || false,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await loadUserProfile(data.user);
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Login failed. Please try again.'
      };
    }
  };

  const signup = async (email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      if (!data.user) {
        return { success: false, error: 'Signup failed - no user returned' };
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data: profile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileCheckError) {
        console.error('Error checking profile:', profileCheckError);
        return {
          success: false,
          error: 'Failed to create user profile. Please try again.'
        };
      }

      if (!profile) {
        return {
          success: false,
          error: 'Profile was not created automatically. Please contact support.'
        };
      }

      if (displayName && profile.display_name !== displayName) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ display_name: displayName })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('Error updating display name:', updateError);
        }
      }

      await loadUserProfile(data.user);
      return { success: true };
    } catch (error: any) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: error.message || 'Signup failed. Please try again.'
      };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const updateData: any = {};

      if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
      if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
      if (updates.bio !== undefined) updateData.bio = updates.bio;
      if (updates.onboardingCompleted !== undefined) updateData.onboarding_completed = updates.onboardingCompleted;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      setUser({ ...user, ...updates });
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const completeOnboarding = async (displayName: string, avatar: string, bio: string) => {
    await updateProfile({
      displayName,
      avatar,
      bio,
      onboardingCompleted: true,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateProfile,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
