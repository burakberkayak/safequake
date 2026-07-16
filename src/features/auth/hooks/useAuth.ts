import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setUser, setLoading, setError, logout as logoutAction } from '../../../store/slices/authSlice';
import { auth, db, isFirebaseConfigured } from '../../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);

  const loginWithEmail = async (email: string, pass: string) => {
    dispatch(setLoading(true));
    
    if (!isFirebaseConfigured) {
      // Offline fallback
      setTimeout(() => {
        dispatch(setUser({
          uid: 'demo_user_123',
          email: email.toLowerCase().trim(),
          displayName: 'Demo Kullanıcı (Offline)',
          phoneNumber: '+905555555555',
        }));
      }, 500);
      return;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email, pass);
      const firebaseUser = credential.user;
      dispatch(setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        phoneNumber: firebaseUser.phoneNumber,
      }));
    } catch (err: any) {
      dispatch(setError(err.message || 'Giriş yapılamadı.'));
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    dispatch(setLoading(true));

    if (!isFirebaseConfigured) {
      // Offline fallback
      setTimeout(() => {
        dispatch(setUser({
          uid: 'demo_user_123',
          email: email.toLowerCase().trim(),
          displayName: name,
          phoneNumber: '+905555555555',
        }));
      }, 500);
      return;
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = credential.user;
      
      // Update display name in Firebase Auth
      await updateProfile(firebaseUser, { displayName: name });

      // Save user profile to Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        displayName: name,
        email: email.toLowerCase().trim(),
        isSafe: true,
        lastStatusUpdate: '',
        familyIds: [],
        latitude: null,
        longitude: null,
      });

      dispatch(setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: name,
        phoneNumber: firebaseUser.phoneNumber,
      }));
    } catch (err: any) {
      dispatch(setError(err.message || 'Kayıt olunamadı.'));
      throw err;
    }
  };

  const logout = async () => {
    dispatch(setLoading(true));
    
    if (!isFirebaseConfigured) {
      dispatch(logoutAction());
      return;
    }

    try {
      await signOut(auth);
      dispatch(logoutAction());
    } catch (err: any) {
      dispatch(setError(err.message || 'Çıkış yapılamadı.'));
    }
  };

  return {
    user,
    loading,
    error,
    loginWithEmail,
    registerWithEmail,
    logout,
  };
};
