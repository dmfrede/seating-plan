import { useState, useEffect } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '../utils/firebase';

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({ user, loading: false, error: null });
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setState(s => ({ ...s, loading: false, error: message }));
      throw err;
    }
  };

  const signup = async (email: string, password: string, displayName?: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setState(s => ({ ...s, loading: false, error: message }));
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    login,
    signup,
    logout,
  };
}
