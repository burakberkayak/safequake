import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FamilyMember {
  id: string;
  name: string;
  relation: 'Anne' | 'Baba' | 'Kardeş' | 'Arkadaş' | 'Eş' | 'Diğer';
  phone: string;
  email?: string;
  isSafe?: boolean;
  lastSeen?: string;
  latitude?: number;
  longitude?: number;
}

export type EmergencyContact = FamilyMember;

export interface EmergencyCard {
  bloodType: string;
  allergies: string;
  chronicDiseases: string;
  medications: string;
}

interface EmergencyState {
  card: EmergencyCard;
  familyMembers: FamilyMember[];
}

const initialState: EmergencyState = {
  card: {
    bloodType: '',
    allergies: '',
    chronicDiseases: '',
    medications: '',
  },
  familyMembers: [],
};

const emergencySlice = createSlice({
  name: 'emergency',
  initialState,
  reducers: {
    updateEmergencyCard: (state, action: PayloadAction<Partial<EmergencyCard>>) => {
      state.card = { ...state.card, ...action.payload };
    },
    setFamilyMembers: (state, action: PayloadAction<FamilyMember[]>) => {
      state.familyMembers = action.payload;
    },
    addFamilyMember: (state, action: PayloadAction<FamilyMember>) => {
      if (!state.familyMembers.some((f) => f.phone === action.payload.phone)) {
        state.familyMembers.push(action.payload);
      }
    },
    addEmergencyContact: (state, action: PayloadAction<{ id?: string; name: string; phone: string; relation: string }>) => {
      if (!state.familyMembers.some((f) => f.phone === action.payload.phone)) {
        state.familyMembers.push({
          id: action.payload.id || `member-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: action.payload.name,
          phone: action.payload.phone,
          relation: (action.payload.relation as any) || 'Diğer',
          isSafe: true,
          lastSeen: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        });
      }
    },
    removeFamilyMember: (state, action: PayloadAction<string>) => {
      state.familyMembers = state.familyMembers.filter((m) => m.id !== action.payload);
    },
    removeEmergencyContact: (state, action: PayloadAction<number>) => {
      state.familyMembers.splice(action.payload, 1);
    },
    updateFamilyMemberStatus: (
      state,
      action: PayloadAction<{ id: string; isSafe?: boolean; lastSeen?: string; latitude?: number; longitude?: number }>
    ) => {
      const index = state.familyMembers.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) {
        state.familyMembers[index] = { ...state.familyMembers[index]!, ...action.payload };
      }
    },
  },
});

export const {
  updateEmergencyCard,
  setFamilyMembers,
  addFamilyMember,
  addEmergencyContact,
  removeFamilyMember,
  removeEmergencyContact,
  updateFamilyMemberStatus,
} = emergencySlice.actions;

export default emergencySlice.reducer;
