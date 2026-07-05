import React, { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { auth, onAuthStateChanged, signOut } from '@/lib/firebase'
import { authService } from '@/services/auth.service'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setFirebaseUser, setLoading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
      setLoading(true)
      if (firebaseUser) {
        setFirebaseUser(firebaseUser)
        try {
          const profile = await authService.getCurrentUser()
          setUser(profile)
        } catch (err: any) {
          const status = err?.response?.status
          if (status === 404) {
            const authPagePaths = ['/login', '/register', '/admin']
            const isAuthPage = authPagePaths.some(p => window.location.pathname.startsWith(p))

            if (isAuthPage) {
              setFirebaseUser(firebaseUser)
              setUser(null)
              setLoading(false)
              return
            }

            console.warn('User not found in database, signing out Firebase session.')
            await signOut(auth).catch(() => {})
          } else {
            console.error('Failed to load user profile from database:', err)
          }
          setFirebaseUser(null)
          setUser(null)
        }
      } else {
        // No Firebase user — check for mockToken (works in both dev and prod for demo mode)
        const mockToken = localStorage.getItem('mockToken')
        if (mockToken) {
          try {
            const profile = await authService.getCurrentUser()
            setFirebaseUser({
              uid: profile.firebaseUid,
              email: profile.email,
              displayName: profile.name,
              getIdToken: async () => mockToken,
            } as any)
            setUser(profile)
          } catch (err) {
            setFirebaseUser(null)
            setUser(null)
            localStorage.removeItem('mockToken')
          }
        } else {
          setFirebaseUser(null)
          setUser(null)
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [setUser, setFirebaseUser, setLoading])

  return <>{children}</>
}
