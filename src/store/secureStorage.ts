import * as SecureStore from 'expo-secure-store';

const sanitizeKey = (key: string): string => {
  return key.replace(/[^a-zA-Z0-9.\-_]/g, '_');
};

export const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(sanitizeKey(key));
    } catch (e) {
      console.error('Error reading from SecureStore:', e);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(sanitizeKey(key), value);
    } catch (e) {
      console.error('Error writing to SecureStore:', e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(sanitizeKey(key));
    } catch (e) {
      console.error('Error deleting from SecureStore:', e);
    }
  },
};
