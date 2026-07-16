import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { secureStorage } from './secureStorage';

import authReducer from './slices/authSlice';
import settingsReducer from './slices/settingsSlice';
import emergencyReducer from './slices/emergencySlice';
import checklistReducer from './slices/checklistSlice';
import filterReducer from './slices/filterSlice';

const emergencyPersistConfig = {
  key: 'emergency',
  storage: secureStorage,
};

const rootReducer = combineReducers({
  auth: authReducer,
  settings: settingsReducer,
  emergency: persistReducer(emergencyPersistConfig, emergencyReducer),
  checklist: checklistReducer,
  filters: filterReducer,
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  // We want to persist preferences and checklist items on regular storage.
  // The emergency medical card data is persisted securely via SecureStore above.
  whitelist: ['settings', 'checklist', 'filters'],
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
