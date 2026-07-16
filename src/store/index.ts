import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from './slices/authSlice';
import settingsReducer from './slices/settingsSlice';
import emergencyReducer from './slices/emergencySlice';
import checklistReducer from './slices/checklistSlice';
import filterReducer from './slices/filterSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  settings: settingsReducer,
  emergency: emergencyReducer,
  checklist: checklistReducer,
  filters: filterReducer,
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  // We want to persist preferences, emergency card data, and checklist items.
  // Auth state can also be persisted, but Firebase Auth has its own persistence.
  // Let's persist settings, emergency, checklist, and filters.
  whitelist: ['settings', 'emergency', 'checklist', 'filters'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
