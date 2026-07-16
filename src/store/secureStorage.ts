import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const sanitizeKey = (key: string): string => {
  return key.replace(/[^a-zA-Z0-9.\-_]/g, '_');
};

const isWeb = Platform.OS === 'web';

export const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (isWeb) {
        return localStorage.getItem(sanitizeKey(key));
      }
      return await SecureStore.getItemAsync(sanitizeKey(key));
    } catch (e) {
      console.error('Error reading from SecureStore:', e);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (isWeb) {
        localStorage.setItem(sanitizeKey(key), value);
        return;
      }
      await SecureStore.setItemAsync(sanitizeKey(key), value);
    } catch (e) {
      console.error('Error writing to SecureStore:', e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (isWeb) {
        localStorage.removeItem(sanitizeKey(key));
        return;
      }
      await SecureStore.deleteItemAsync(sanitizeKey(key));
    } catch (e) {
      console.error('Error deleting from SecureStore:', e);
    }
  },
};
