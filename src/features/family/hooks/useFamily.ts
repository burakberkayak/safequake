import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setFamilyMembers, updateFamilyMemberStatus, addFamilyMember, addEmergencyContact, FamilyMember } from '../../../store/slices/emergencySlice';

export const useFamily = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const familyMembers = useAppSelector((state) => state.emergency.familyMembers);
  const [loading, setLoading] = useState(false);

  /**
   * Yakın kişiyi İsim, Telefon Numarası ve Yakınlık Derecesi ile doğrudan ekler.
   */
  const addFamilyMemberDirectly = (name: string, phone: string, relation: FamilyMember['relation']) => {
    if (!name.trim() || !phone.trim()) {
      throw new Error('Lütfen ad soyad ve telefon numarasını doldurun.');
    }

    const cleanPhone = phone.trim();
    const newMember: FamilyMember = {
      id: `family-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      phone: cleanPhone,
      relation,
      isSafe: true,
      lastSeen: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };

    // 1. Aile Listesine ekle
    dispatch(addFamilyMember(newMember));

    // 2. Acil Mesaj rehberine de otomatik ekle
    dispatch(addEmergencyContact({
      id: newMember.id,
      name: newMember.name,
      phone: cleanPhone,
      relation: newMember.relation,
    }));
  };

  return {
    familyMembers,
    loading,
    addFamilyMemberDirectly,
  };
};
