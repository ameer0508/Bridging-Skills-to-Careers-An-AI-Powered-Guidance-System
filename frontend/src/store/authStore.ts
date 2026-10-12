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
  isHydrated: boolean;
  setSession: (
    user: UserInfo | null,
    accessToken: string | null,
    refreshToken: string | null
  ) => void;
  clearSession: () => void;
  updateUser: (user: Partial<UserInfo>) => void;
  fetchCurrentUser: () => Promise<UserInfo | null>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initialToken = localStorage.getItem('sb-access-token') || null;
  const initialUser: UserInfo | null = (() => {
    try {
      const stored = localStorage.getItem('sb-user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  return {
    user: initialUser,
    accessToken: initialToken,
    refreshToken: localStorage.getItem('sb-refresh-token') || null,
    isAuthenticated: !!initialToken,
    // If no token exists, auth is immediately hydrated. If token exists, mark hydrated once verified or immediately with user.
    isHydrated: !initialToken || !!initialUser,

    setSession: (user, accessToken, refreshToken) => {
      if (accessToken && refreshToken && user) {
        localStorage.setItem('sb-access-token', accessToken);
        localStorage.setItem('sb-refresh-token', refreshToken);
        localStorage.setItem('sb-user', JSON.stringify(user));
        // Compatibility fallback for Axios instance
        localStorage.setItem('skillbridge-auth-token', accessToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true, isHydrated: true });
      } else {
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('sb-user');
        localStorage.removeItem('skillbridge-auth-token');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isHydrated: true });
      }
    },

    clearSession: () => {
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('sb-user');
      localStorage.removeItem('skillbridge-auth-token');
      try {
        import('../lib/queryClient').then(m => m.queryClient.clear()).catch(() => {});
      } catch {
        // Ignore cache clear error if offline
      }
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isHydrated: true });
    },

    updateUser: updatedFields => {
      set(state => {
        if (!state.user) return state;
        const updatedUser = { ...state.user, ...updatedFields };
        localStorage.setItem('sb-user', JSON.stringify(updatedUser));
        return { user: updatedUser };
      });
    },

    fetchCurrentUser: async () => {
      const token = get().accessToken;
      if (!token) {
        set({ isHydrated: true });
        return null;
      }
      try {
        const { default: apiClient } = await import('../lib/axios');
        const response = await apiClient.get('/users/me');
        const freshUser: UserInfo = response.data?.data;
        if (freshUser) {
          localStorage.setItem('sb-user', JSON.stringify(freshUser));
          set({ user: freshUser, isHydrated: true });
          return freshUser;
        }
      } catch (err: unknown) {
        const axiosErr = err as { response?: { status?: number }; status?: number };
        if (axiosErr?.response?.status === 401 || axiosErr?.status === 401) {
          get().clearSession();
        }
      } finally {
        set({ isHydrated: true });
      }
      return null;
    }
  };
});

export default useAuthStore;

