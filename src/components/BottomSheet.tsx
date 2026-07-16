import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

/**
 * Harici bir bottom-sheet kütüphanesi eklemeden (bundle boyutunu artırmadan)
 * ihtiyacı karşılayan hafif bileşen. İleride @gorhom/bottom-sheet gibi bir
 * kütüphaneye geçilirse yalnızca bu dosya değişir — tüketen ekranlar
 * (`MapScreen` vb.) etkilenmez.
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({ visible, onClose, children }) => {
  const { colors } = useAppTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      useNativeDriver: true,
      damping: 20,
      mass: 0.8,
    }).start();
  }, [visible, translateY]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, transform: [{ translateY }] },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          {children}
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
});
