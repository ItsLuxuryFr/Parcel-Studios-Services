import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, AuthContextType } from '../types';
import { isAdmin } from '../data/adminList';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        // Check if mute has expired and update if necessary
        if (profile.is_muted && profile.muted_until && new Date(profile.muted_until) < new Date()) {
          // Mute has expired, update the profile
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              is_muted: false,
              muted_until: null,
              muted_reason: null,
              muted_by: null
            })
            .eq('id', authUser.id);

          if (updateError) {
            console.error('Error updating expired mute:', updateError);
          } else {
            // Update the profile data
            profile.is_muted = false;
            profile.muted_until = null;
            profile.muted_reason = null;
            profile.muted_by = null;
          }
        }

        setUser({
          id: profile.id,
          email: profile.email,
          username: profile.username || '',
          displayName: profile.display_name || '',
          avatar: profile.avatar || undefined,
          bio: profile.bio || undefined,
          joinDate: profile.created_at,
          onboardingCompleted: profile.onboarding_completed || false,
          isAdmin: isAdmin(profile.id),
        });
      } else {
        // User exists in auth but no profile yet - they need to complete onboarding
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          username: authUser.user_metadata?.display_name || '',
          displayName: '',
          avatar: undefined,
          bio: undefined,
          joinDate: authUser.created_at,
          onboardingCompleted: false,
          isAdmin: false,
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to refresh user profile (useful after unmuting)
  const refreshUserProfile = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await loadUserProfile(authUser);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if email is banned before attempting login
      const { data: banData, error: banError } = await supabase
        .from('banned_users')
        .select('reason, expires_at')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (banError && banError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw banError;
      }

      if (banData) {
        // Check if ban has expired
        if (banData.expires_at && new Date(banData.expires_at) < new Date()) {
          // Ban has expired, deactivate it
          await supabase
            .from('banned_users')
            .update({ is_active: false })
            .eq('email', email);
        } else {
          // User is banned
          const banMessage = banData.expires_at 
            ? `This account has been banned until ${new Date(banData.expires_at).toLocaleString()}. Reason: ${banData.reason}`
            : `This account has been permanently banned. Reason: ${banData.reason}`;
          return {
            success: false,
            error: banMessage
          };
        }
      }

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

  const signup = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Note: Ban checking removed as it requires admin access. Bans will be checked during login instead.

      // Check if username is already taken
      const { data: existingUsername, error: usernameError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim())
        .maybeSingle();

      if (usernameError) {
        console.error('Error checking username:', usernameError);
        // Continue with signup attempt
      } else if (existingUsername) {
        return {
          success: false,
          error: 'This username is already taken.'
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: username.trim()
          }
        }
      });

      if (error) {
        console.log('Supabase signup error:', error);
        // Check for specific error types
        if (error.message.includes('already registered') || 
            error.message.includes('already been registered') ||
            error.message.includes('User already registered') ||
            error.message.includes('email address is already in use') ||
            error.message.includes('duplicate key value violates unique constraint') ||
            error.message.includes('signup_disabled') ||
            error.message.includes('email_not_confirmed') ||
            error.message.includes('User already exists') ||
            error.message.includes('already exists')) {
          return {
            success: false,
            error: 'This email has already been used, try logging in.'
          };
        }
        throw error;
      }

      // Check if user was created successfully
      if (!data.user) {
        return { success: false, error: 'Signup failed - no user returned' };
      }

      // For unconfirmed users, we'll let them verify their email first
      // No need to test sign-in as it will fail for unconfirmed users

      // Check if email confirmation is required
      if (!data.user.email_confirmed_at) {
        console.log('User created but email not confirmed:', data.user);
        
        // For unconfirmed users, we can't sign them in immediately
        // We'll set the user in context but they'll need to confirm email first
        console.log('Email confirmation required. User will need to confirm email before signing in.');
        
        // Don't try to sign in - just set the user data for now
        // They'll need to confirm their email and then sign in manually
      } else if (!data.session) {
        console.log('No session after signup, attempting to sign in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          console.error('Sign in after signup failed:', signInError);
          throw new Error('Failed to establish session after signup. Please try signing in manually.');
        }
        
        console.log('Successfully signed in after signup');
        console.log('Sign in session:', !!signInData.session);
        console.log('Sign in user ID:', signInData.user?.id);
      } else {
        console.log('Session already established after signup');
        console.log('Session user ID:', data.session.user.id);
      }

      // Don't load user profile yet - wait for onboarding completion
      // Just set a basic user object for navigation purposes
      setUser({
        id: data.user.id,
        email: data.user.email || email,
        username: username.trim(),
        displayName: '',
        avatar: undefined,
        bio: undefined,
        joinDate: data.user.created_at,
        onboardingCompleted: false,
        isAdmin: false,
      });
      
      // Check if email confirmation is required
      if (!data.user.email_confirmed_at) {
        console.log('Email confirmation required for user:', data.user.id);
        // Store email in localStorage for the verify-email page
        localStorage.setItem('pendingEmail', email);
        return { 
          success: true, 
          requiresEmailConfirmation: true,
          message: 'Please check your email and click the confirmation link before signing in.'
        };
      }
      
      // Wait a moment for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify session is established
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('Signup successful, user ID:', data.user.id);
      console.log('Session established:', !!authUser);
      console.log('Auth user matches:', authUser?.id === data.user.id);
      
      if (!authUser) {
        console.warn('Warning: User not authenticated after signup, but continuing...');
      }
      
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

  const completeOnboarding = async (username: string, displayName: string, avatar: string, bio: string) => {
    if (!user) {
      throw new Error('No user found. Please sign in first.');
    }

    // Get username from auth metadata if available, otherwise use the passed username
    const finalUsername = user.username || username;

    console.log('Creating profile for user:', user.id);
    console.log('Username (from auth metadata):', finalUsername);
    console.log('Display name:', displayName);

    // Ensure user is properly authenticated
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    console.log('Current auth user:', authUser?.id);
    console.log('User matches auth:', user.id === authUser?.id);

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error('Authentication error. Please sign in again.');
    }

    if (!authUser) {
      console.log('No authenticated user found, checking session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Authentication session expired. Please sign in again.');
      }
      
      if (!session) {
        console.log('No session found, user needs to sign in again');
        throw new Error('No active session. Please sign in again.');
      }
      
      console.log('Session found, user ID:', session.user.id);
      
      // Verify the session user matches our context user
      if (session.user.id !== user.id) {
        console.error('Session user ID mismatch:', session.user.id, 'vs', user.id);
        throw new Error('User ID mismatch. Please sign in again.');
      }
    } else {
      console.log('User is authenticated, proceeding with profile creation');
    }

    try {
      // Create the profile in the database
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          username: finalUsername.trim(),
          display_name: displayName.trim(),
          avatar: avatar || null,
          bio: bio || null,
          onboarding_completed: true,
        });

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }

      // Update the user state
      setUser({
        ...user,
        username: finalUsername.trim(),
        displayName: displayName.trim(),
        avatar: avatar || undefined,
        bio: bio || undefined,
        onboardingCompleted: true,
      });
    } catch (error) {
      throw error;
    }
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
        refreshUserProfile,
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
