import { create } from 'zustand';
import { UserPublic, Role } from '@sethu/shared';
import { loginApi, demoLoginApi, getMeApi, logoutApi } from '../services/authService';

interface AuthState {
  user: UserPublic | null;
  token: string | null;
  activeRole: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  demoLogin: (role: Role) => Promise<void>;
  logout: () => Promise<void>;
  setActiveRole: (role: Role) => void;
  initialize: () => Promise<void>;
}

const TOKEN_KEY = 'sethu_auth_token';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  activeRole: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await loginApi({ username, password });
      localStorage.setItem(TOKEN_KEY, token);

      const primaryRole = user.roles[0]?.roleName as Role || Role.PATIENT;

      set({
        token,
        user,
        activeRole: primaryRole,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: (err as Error).message || 'Login failed',
      });
      throw err;
    }
  },

  demoLogin: async (role: Role) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await demoLoginApi(role);
      localStorage.setItem(TOKEN_KEY, token);

      set({
        token,
        user,
        activeRole: role,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: (err as Error).message || 'Demo login failed',
      });
      throw err;
    }
  },

  logout: async () => {
    const { token } = get();
    if (token) {
      await logoutApi(token);
    }
    localStorage.removeItem(TOKEN_KEY);
    set({
      user: null,
      token: null,
      activeRole: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  setActiveRole: (role: Role) => {
    set({ activeRole: role });
  },

  initialize: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const { user } = await getMeApi(token);
      const primaryRole = user.roles[0]?.roleName as Role || Role.PATIENT;

      set({
        token,
        user,
        activeRole: primaryRole,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({
        token: null,
        user: null,
        activeRole: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
