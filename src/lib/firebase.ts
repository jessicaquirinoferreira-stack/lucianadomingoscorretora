import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const BOOTSTRAPPED_ADMIN_EMAIL = 'jessicaq2204@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'settings', 'main'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    return true;
  }
}

export async function checkIsFirestoreAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  if (user.emailVerified && user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL) {
    return true;
  }
  try {
    const snap = await getDocFromServer(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch {
    try {
      const snap = await getDoc(doc(db, 'admins', user.uid));
      return snap.exists();
    } catch {
      return false;
    }
  }
}

export async function ensureAdminDocInFirestore(
  targetUid: string,
  targetEmail: string
): Promise<boolean> {
  if (!auth.currentUser || !targetUid) return false;
  try {
    const ref = doc(db, 'admins', targetUid);
    const snap = await getDoc(ref);
    if (snap.exists()) return true;
    await setDoc(ref, {
      uid: targetUid.slice(0, 128),
      email: targetEmail.trim().toLowerCase().slice(0, 160),
      role: 'admin',
      createdAt: serverTimestamp(),
    });
    return true;
  } catch {
    return false;
  }
}

export async function signInWithGoogleAdmin(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export interface FirebaseEmailLoginResult {
  user: User | null;
  action: 'signed_in' | 'created' | 'operation_not_allowed' | 'error';
  errorMessage?: string;
}

export async function tryFirebaseEmailLogin(
  email: string,
  password: string,
  allowAutoRegister = true
): Promise<FirebaseEmailLoginResult> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    return { user: cred.user, action: 'signed_in' };
  } catch (err) {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/operation-not-allowed') {
      return {
        user: null,
        action: 'operation_not_allowed',
        errorMessage:
          'Ative o provedor E-mail/senha no Firebase Console (Authentication → Sign-in method).',
      };
    }

    if (
      allowAutoRegister &&
      (code === 'auth/user-not-found' || code === 'auth/invalid-credential')
    ) {
      try {
        const created = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        if (!cleanEmail.endsWith('@x.com')) {
          sendEmailVerification(created.user).catch(() => {});
        }
        return { user: created.user, action: 'created' };
      } catch (createErr) {
        const createCode = (createErr as { code?: string })?.code || '';
        if (createCode === 'auth/operation-not-allowed') {
          return {
            user: null,
            action: 'operation_not_allowed',
            errorMessage:
              'Ative o provedor E-mail/senha no Firebase Console (Authentication → Sign-in method).',
          };
        }
        return {
          user: null,
          action: 'error',
          errorMessage:
            createErr instanceof Error
              ? createErr.message
              : 'Não foi possível cadastrar o admin no Firebase Auth.',
        };
      }
    }

    return {
      user: null,
      action: 'error',
      errorMessage:
        err instanceof Error ? err.message : 'Falha ao autenticar no Firebase Auth.',
    };
  }
}

export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

export function subscribeAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function normalizeTimestamps<T extends object>(data: T): T {
  const copy = { ...data } as Record<string, unknown>;
  if (copy.createdAt instanceof Timestamp) {
    copy.createdAt = copy.createdAt.toDate().toISOString();
  }
  if (copy.updatedAt instanceof Timestamp) {
    copy.updatedAt = copy.updatedAt.toDate().toISOString();
  }
  return copy as T;
}

export {
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  serverTimestamp,
};
