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
  signInAnonymously,
  GoogleAuthProvider,
  signInWithCredential,
  User
} from 'firebase/auth';
// Safely require Google Sign-in to prevent Expo Go crashes due to missing native binary modules
let GoogleSignin: any = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  if (isFirebaseConfigured && process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID && GoogleSignin) {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });
  }
} catch (e) {
  console.warn('Google Sign-in native module is not available (normal in Expo Go).');
}

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);

  const loginWithEmail = async (email: string, pass: string) => {
    dispatch(setLoading(true));
    
    if (!isFirebaseConfigured) {
      const errorMsg = 'Firebase configuration is missing. Please check your .env file.';
      dispatch(setError(errorMsg));
      throw new Error(errorMsg);
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
      const errorMsg = 'Firebase configuration is missing. Please check your .env file.';
      dispatch(setError(errorMsg));
      throw new Error(errorMsg);
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

  const loginAnonymously = async () => {
    dispatch(setLoading(true));

    if (!isFirebaseConfigured) {
      // Fallback for offline/demo mode
      dispatch(setUser({
        uid: 'demo-anon-user',
        email: null,
        displayName: 'Misafir Kullanıcı',
        phoneNumber: null,
      }));
      return;
    }

    try {
      const credential = await signInAnonymously(auth);
      const firebaseUser = credential.user;
      dispatch(setUser({
        uid: firebaseUser.uid,
        email: null,
        displayName: 'Misafir Kullanıcı',
        phoneNumber: null,
      }));
    } catch (err: any) {
      dispatch(setError(err.message || 'Misafir girişi yapılamadı.'));
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    dispatch(setLoading(true));

    if (!GoogleSignin) {
      const errorMsg = 'Google Girişi bu cihazda/emülatörde desteklenmiyor. Lütfen Expo Go yerine yerel bir geliştirme derlemesi (development build) kullanın.';
      dispatch(setError(errorMsg));
      throw new Error(errorMsg);
    }

    if (!isFirebaseConfigured) {
      const errorMsg = 'Firebase configuration is missing. Please check your .env file.';
      dispatch(setError(errorMsg));
      throw new Error(errorMsg);
    }

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      const idToken = (response as any).data?.idToken || (response as any).idToken;

      if (!idToken) {
        throw new Error('Google Sign-In failed: No ID Token returned.');
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;

      dispatch(setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Google Kullanıcısı',
        phoneNumber: firebaseUser.phoneNumber,
      }));
    } catch (err: any) {
      dispatch(setError(err.message || 'Google girişi yapılamadı.'));
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
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignored if not signed in with Google
      }
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
    loginAnonymously,
    loginWithGoogle,
    logout,
  };
};
