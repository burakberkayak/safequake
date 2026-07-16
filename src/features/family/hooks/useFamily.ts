import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setFamilyMembers, updateFamilyMemberStatus, FamilyMember } from '../../../store/slices/emergencySlice';
import { db, auth } from '../../../services/firebase';
import { 
  doc, 
  setDoc, 
  getDoc,
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot 
} from 'firebase/firestore';
import * as Location from 'expo-location';

export const useFamily = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const familyMembers = useAppSelector((state) => state.emergency.familyMembers);
  const [loading, setLoading] = useState(false);

  // Sync family members' real-time statuses from Firestore
  useEffect(() => {
    if (!currentUser) return;

    // Listen to changes in each family member's document
    const unsubscribes = familyMembers.map((member) => {
      const docRef = doc(db, 'users', member.id);
      return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          dispatch(updateFamilyMemberStatus({
            id: member.id,
            isSafe: data.isSafe,
            lastSeen: data.lastStatusUpdate,
            latitude: data.latitude,
            longitude: data.longitude,
          }));
        }
      });
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [currentUser, familyMembers.length, dispatch]);

  const addFamilyMemberByEmail = async (email: string, relation: FamilyMember['relation']) => {
    if (!currentUser) throw new Error('Oturum açılmamış.');
    setLoading(true);

    try {
      // Find user by email in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Belirtilen e-posta adresine sahip bir kullanıcı bulunamadı.');
      }

      const targetDoc = querySnapshot.docs[0]!;
      const targetData = targetDoc.data();
      const targetId = targetDoc.id;

      if (targetId === currentUser.uid) {
        throw new Error('Kendinizi yakınlarınız listesine ekleyemezsiniz.');
      }

      const newMember: FamilyMember = {
        id: targetId,
        name: targetData.displayName || targetData.email,
        relation,
        phone: targetData.phoneNumber || '',
        email: targetData.email,
        isSafe: targetData.isSafe ?? true,
        lastSeen: targetData.lastStatusUpdate || '',
        latitude: targetData.latitude,
        longitude: targetData.longitude,
      };

      // Add to Redux store (will be persisted)
      dispatch({ type: 'emergency/addFamilyMember', payload: newMember });

      // Save to own Firestore profile
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const currentFamilyIds = userSnap.data()?.familyIds || [];
      
      await updateDoc(userRef, {
        familyIds: [...currentFamilyIds, targetId],
      });

    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reportSafeStatus = async (shareLocation: boolean) => {
    if (!currentUser) throw new Error('Oturum açılmamış.');
    setLoading(true);

    try {
      let lat: number | null = null;
      let lon: number | null = null;

      if (shareLocation) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
        }
      }

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        isSafe: true,
        lastStatusUpdate: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        latitude: lat,
        longitude: lon,
      });

      // Update in Redux locally too
      dispatch({
        type: 'auth/setUser',
        payload: {
          ...currentUser,
          isSafe: true,
        }
      });
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    familyMembers,
    loading,
    addFamilyMemberByEmail,
    reportSafeStatus,
  };
};
