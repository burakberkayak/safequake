import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { MapStyleType } from '../constants/mapStyles';

interface StyleOption {
  id: MapStyleType;
  icon: keyof typeof Ionicons.glyphMap;
  labelTR: string;
  labelEN: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  { id: 'bright', icon: 'sunny', labelTR: 'Canlı & Renkli', labelEN: 'Vibrant Bright' },
  { id: 'liberty', icon: 'map-outline', labelTR: 'Detaylı Vektör', labelEN: 'Detailed Vector' },
  { id: 'dark', icon: 'moon-outline', labelTR: 'Karanlık', labelEN: 'Dark' },
  { id: 'satellite', icon: 'planet-outline', labelTR: 'Uydu', labelEN: 'Satellite' },
];

interface MapStylePickerProps {
  value: MapStyleType;
  onChange: (style: MapStyleType) => void;
  language: 'tr' | 'en';
  isOpen: boolean;
  onToggleOpen: () => void;
}

/** PRD §8: harita stili seçici (bright/vector/dark/satellite), sağ üst köşe. */
export const MapStylePicker: React.FC<MapStylePickerProps> = ({
  value,
  onChange,
  language,
  isOpen,
  onToggleOpen,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.floatingCircleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onToggleOpen}
      >
        <Ionicons name="layers" size={20} color={colors.primary} />
      </TouchableOpacity>

      {isOpen && (
        <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {STYLE_OPTIONS.map((option) => {
            const isSelected = value === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.option, isSelected && { backgroundColor: colors.primary + '15' }]}
                onPress={() => onChange(option.id)}
              >
                <Ionicons name={option.icon} size={16} color={isSelected ? colors.primary : colors.onSurface} />
                <Text style={[styles.optionText, { color: isSelected ? colors.primary : colors.onSurface }]}>
                  {language === 'tr' ? option.labelTR : option.labelEN}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', top: 105, right: 16, alignItems: 'flex-end' },
  floatingCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    padding: 6,
    gap: 4,
    minWidth: 120,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  option: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  optionText: { fontSize: 13, fontWeight: '600' },
});
