import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: 'Anne' | 'Baba' | 'Kardeş' | 'Arkadaş' | 'Eş' | 'Diğer';
  phone: string;
  email: string;
  isSafe?: boolean;
  lastSeen?: string;
  latitude?: number;
  longitude?: number;
}

export interface EmergencyCard {
  bloodType: string;
  allergies: string;
  chronicDiseases: string;
  medications: string;
  contacts: EmergencyContact[];
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
    contacts: [],
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
      state.familyMembers.push(action.payload);
    },
    removeFamilyMember: (state, action: PayloadAction<string>) => {
      state.familyMembers = state.familyMembers.filter(member => member.id !== action.payload);
    },
    updateFamilyMemberStatus: (state, action: PayloadAction<{ id: string; isSafe?: boolean; lastSeen?: string; latitude?: number; longitude?: number }>) => {
      const index = state.familyMembers.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.familyMembers[index] = { ...state.familyMembers[index]!, ...action.payload };
      }
    },
  },
});

export const { updateEmergencyCard, setFamilyMembers, addFamilyMember, removeFamilyMember, updateFamilyMemberStatus } = emergencySlice.actions;
export default emergencySlice.reducer;
