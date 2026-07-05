import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword as realSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as realCreateUserWithEmailAndPassword,
  signInWithRedirect as realSignInWithRedirect,
  signInWithPopup as realSignInWithPopup,
  getRedirectResult as realGetRedirectResult,
  signOut as realSignOut,
  deleteUser as realDeleteUser,
  sendPasswordResetEmail as realSendPasswordResetEmail,
  sendEmailVerification as realSendEmailVerification,
  onAuthStateChanged as realOnAuthStateChanged,
  type User,
} from 'firebase/auth'
import { firebaseConfig, missingFirebaseEnv } from './firebaseConfig'

const hasFirebaseConfig = missingFirebaseEnv.length === 0

type AuthListener = (user: User | null) => void

const mockListeners = new Set<AuthListener>()
const mockAuth: any = {
  currentUser: null as User | null,
}

function notifyMockListeners(user: User | null) {
  mockAuth.currentUser = user
  mockListeners.forEach((listener) => listener(user))
}

const mockUser = {
  uid: 'dev-user',
  email: 'dev@localhost',
  displayName: 'Development User',
  getIdToken: async () => localStorage.getItem('mockToken') || 'mock:dev-user:dev@localhost',
} as User

async function mockRejectedAuthOperation() {
  throw new Error('Firebase browser auth is not configured in this development environment.')
}

function mockOnAuthStateChanged(_auth: typeof mockAuth, callback: AuthListener) {
  mockListeners.add(callback)
  queueMicrotask(() => callback(mockAuth.currentUser))
  return () => mockListeners.delete(callback)
}

async function mockGetRedirectResult() {
  return null
}

async function mockSignOut() {
  localStorage.removeItem('mockToken')
  notifyMockListeners(null)
}

async function mockDeleteUser() {
  localStorage.removeItem('mockToken')
  notifyMockListeners(null)
}

async function mockSendPasswordResetEmail() {}
async function mockSendEmailVerification() {}

const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null
export const analytics = hasFirebaseConfig && firebaseConfig.measurementId ? getAnalytics(app!) : null
export const auth: any = hasFirebaseConfig ? getAuth(app!) : mockAuth
export const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({ prompt: 'select_account' })

export const signInWithEmailAndPassword: any = hasFirebaseConfig
  ? realSignInWithEmailAndPassword
  : mockRejectedAuthOperation

export const createUserWithEmailAndPassword: any = hasFirebaseConfig
  ? realCreateUserWithEmailAndPassword
  : mockRejectedAuthOperation

export const signInWithRedirect: any = hasFirebaseConfig ? realSignInWithRedirect : mockRejectedAuthOperation
export const signInWithPopup: any = hasFirebaseConfig ? realSignInWithPopup : mockRejectedAuthOperation
export const getRedirectResult: any = hasFirebaseConfig ? realGetRedirectResult : mockGetRedirectResult
export const signOut: any = hasFirebaseConfig ? realSignOut : mockSignOut
export const deleteUser: any = hasFirebaseConfig ? realDeleteUser : mockDeleteUser
export const sendPasswordResetEmail: any = hasFirebaseConfig ? realSendPasswordResetEmail : mockSendPasswordResetEmail
export const sendEmailVerification: any = hasFirebaseConfig ? realSendEmailVerification : mockSendEmailVerification
export const onAuthStateChanged: any = hasFirebaseConfig ? realOnAuthStateChanged : mockOnAuthStateChanged

export type { User }
export { hasFirebaseConfig, mockUser }
export default app
