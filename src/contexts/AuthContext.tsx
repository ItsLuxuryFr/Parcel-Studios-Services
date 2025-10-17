import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'parcel_studio_user';
const USERS_KEY = 'parcel_studio_users';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const usersData = localStorage.getItem(USERS_KEY);
    const users = usersData ? JSON.parse(usersData) : {};

    if (!users[email]) {
      return { success: false, error: 'User not found. Please sign up first.' };
    }

    if (users[email].password !== password) {
      return { success: false, error: 'Incorrect password.' };
    }

    const userData = users[email];
    const userObj: User = {
      id: userData.id,
      email: userData.email,
      displayName: userData.displayName,
      avatar: userData.avatar,
      bio: userData.bio,
      joinDate: userData.joinDate,
      onboardingCompleted: userData.onboardingCompleted,
    };

    setUser(userObj);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));

    return { success: true };
  };

  const signup = async (email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const usersData = localStorage.getItem(USERS_KEY);
    const users = usersData ? JSON.parse(usersData) : {};

    if (users[email]) {
      return { success: false, error: 'User already exists. Please log in instead.' };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      displayName,
      joinDate: new Date().toISOString(),
      onboardingCompleted: false,
    };

    users[email] = {
      ...newUser,
      password,
    };

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

    const usersData = localStorage.getItem(USERS_KEY);
    if (usersData) {
      const users = JSON.parse(usersData);
      if (users[user.email]) {
        users[user.email] = { ...users[user.email], ...updates };
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
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
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
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
