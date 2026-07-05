import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile } from '@/types'

interface AuthState {
  user: UserProfile | null
  firebaseUser: unknown | null
  isLoading: boolean
  isAuthenticated: boolean

  setUser: (user: UserProfile | null) => void
  setFirebaseUser: (user: unknown | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      firebaseUser: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () =>
        set({ user: null, firebaseUser: null, isAuthenticated: false }),
    }),
    {
      name: 'vsb-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
