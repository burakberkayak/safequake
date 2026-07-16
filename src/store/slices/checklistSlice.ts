import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChecklistItem {
  id: string;
  name: string;
  checked: boolean;
  required: boolean;
  category: 'Gıda/Su' | 'Ekipman' | 'Belgeler' | 'Sağlık' | 'Diğer';
}

interface ChecklistState {
  items: ChecklistItem[];
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: '1', name: 'Kişi başı en az 3 litre su', checked: false, required: true, category: 'Gıda/Su' },
  { id: '2', name: 'Yüksek kalorili, kuru gıdalar (konserve, bisküvi, vb.)', checked: false, required: true, category: 'Gıda/Su' },
  { id: '3', name: 'İlk yardım çantası ve düzenli kullanılan ilaçlar', checked: false, required: true, category: 'Sağlık' },
  { id: '4', name: 'El feneri ve yedek piller', checked: false, required: true, category: 'Ekipman' },
  { id: '5', name: 'Düdük (ses duyurmak için en kritik malzeme)', checked: false, required: true, category: 'Ekipman' },
  { id: '6', name: 'Taşınabilir şarj cihazı (Powerbank) ve kablo', checked: false, required: true, category: 'Ekipman' },
  { id: '7', name: 'Önemli evrak fotokopileri (kimlik, tapu, vb.)', checked: false, required: false, category: 'Belgeler' },
  { id: '8', name: 'Mevsime uygun giysiler ve battaniye', checked: false, required: false, category: 'Diğer' },
  { id: '9', name: 'Hijyen malzemeleri (ıslak mendil, sabun, maske)', checked: false, required: false, category: 'Diğer' },
  { id: '10', name: 'Çok amaçlı çakı veya makas', checked: false, required: false, category: 'Ekipman' },
];

const initialState: ChecklistState = {
  items: DEFAULT_ITEMS,
};

const checklistSlice = createSlice({
  name: 'checklist',
  initialState,
  reducers: {
    toggleItem: (state, action: PayloadAction<string>) => {
      const item = state.items.find(i => i.id === action.payload);
      if (item) {
        item.checked = !item.checked;
      }
    },
    addItem: (state, action: PayloadAction<Omit<ChecklistItem, 'checked'>>) => {
      state.items.push({ ...action.payload, checked: false });
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    resetChecklist: (state) => {
      state.items = DEFAULT_ITEMS;
    },
  },
});

export const { toggleItem, addItem, removeItem, resetChecklist } = checklistSlice.actions;
export default checklistSlice.reducer;
