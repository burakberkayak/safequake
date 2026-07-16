import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AppThemeMode = 'light' | 'dark' | 'system';
export type AppLanguage = 'tr' | 'en';

interface SettingsState {
  themeMode: AppThemeMode;
  language: AppLanguage;
  locationPermissionGranted: boolean;
  notificationPermissionGranted: boolean;
  minMagnitudeNotify: number | undefined; // e.g. 3, 4, 5 or undefined
  maxDistanceNotifyKm: number | undefined; // e.g. 50, 100, 250 or undefined
}

const initialState: SettingsState = {
  themeMode: 'system',
  language: 'tr',
  locationPermissionGranted: false,
  notificationPermissionGranted: false,
  minMagnitudeNotify: 4, // Default to 4.0+
  maxDistanceNotifyKm: undefined, // Default to all distances
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<AppThemeMode>) => {
      state.themeMode = action.payload;
    },
    setLanguage: (state, action: PayloadAction<AppLanguage>) => {
      state.language = action.payload;
    },
    setLocationPermission: (state, action: PayloadAction<boolean>) => {
      state.locationPermissionGranted = action.payload;
    },
    setNotificationPermission: (state, action: PayloadAction<boolean>) => {
      state.notificationPermissionGranted = action.payload;
    },
    setMinMagnitudeNotify: (state, action: PayloadAction<number | undefined>) => {
      state.minMagnitudeNotify = action.payload;
    },
    setMaxDistanceNotifyKm: (state, action: PayloadAction<number | undefined>) => {
      state.maxDistanceNotifyKm = action.payload;
    },
  },
});

export const { 
  setThemeMode, 
  setLanguage, 
  setLocationPermission, 
  setNotificationPermission,
  setMinMagnitudeNotify,
  setMaxDistanceNotifyKm
} = settingsSlice.actions;
export default settingsSlice.reducer;
