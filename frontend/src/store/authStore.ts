import { create } from 'zustand';

export interface UserInfo {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatar?: string;
  primaryCareerDomain?: string;
  secondaryCareerDomains?: string[];
  targetCareerId?: string;
  targetRole?: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
  profileCompleted: boolean;
}

interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setSession: (
    user: UserInfo | null,
    accessToken: string | null,
    refreshToken: string | null
  ) => void;
  clearSession: () => void;
  updateUser: (user: Partial<UserInfo>) => void;
}

export const useAuthStore = create<AuthState>(set => ({
  user: (() => {
    try {
      const stored = localStorage.getItem('sb-user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  accessToken: localStorage.getItem('sb-access-token') || null,
  refreshToken: localStorage.getItem('sb-refresh-token') || null,
  isAuthenticated: !!localStorage.getItem('sb-access-token'),

  setSession: (user, accessToken, refreshToken) => {
    if (accessToken && refreshToken && user) {
      localStorage.setItem('sb-access-token', accessToken);
      localStorage.setItem('sb-refresh-token', refreshToken);
      localStorage.setItem('sb-user', JSON.stringify(user));
      // Compatibility fallback for Axios instance
      localStorage.setItem('skillbridge-auth-token', accessToken);
      set({ user, accessToken, refreshToken, isAuthenticated: true });
    } else {
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('sb-user');
      localStorage.removeItem('skillbridge-auth-token');
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
    }
  },

  clearSession: () => {
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('sb-user');
    localStorage.removeItem('skillbridge-auth-token');
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  updateUser: updatedFields => {
    set(state => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...updatedFields };
      localStorage.setItem('sb-user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  }
}));

export default useAuthStore;
