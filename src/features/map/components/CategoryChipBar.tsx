import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { NearbyCategory } from '../services/overpassService';

interface CategoryChip {
  id: NearbyCategory;
  titleTR: string;
  titleEN: string;
  icon: string;
  color: string;
}

export const CATEGORY_CHIPS: CategoryChip[] = [
  { id: 'hospital', titleTR: 'Hastaneler', titleEN: 'Hospitals', icon: 'medical', color: '#E53935' },
  { id: 'pharmacy', titleTR: 'Eczaneler', titleEN: 'Pharmacies', icon: 'medkit', color: '#2E7D32' },
  { id: 'fire_station', titleTR: 'İtfaiye', titleEN: 'Fire Station', icon: 'flame', color: '#E65100' },
  { id: 'police', titleTR: 'Polis', titleEN: 'Police', icon: 'shield', color: '#1565C0' },
  { id: 'shelter', titleTR: 'Barınma / Toplanma', titleEN: 'Shelter / Assembly', icon: 'location', color: '#00838F' },
];

interface CategoryChipBarProps {
  language: 'tr' | 'en';
  selectedCategories: NearbyCategory[];
  fetchingCategories: NearbyCategory[];
  onToggleCategory: (category: NearbyCategory) => void;
  onQuickRoute: (category: 'hospital' | 'shelter') => void;
}

/**
 * PRD §11-12: hastane/eczane/itfaiye/polis/toplanma alanı katman seçici
 * + tek dokunuşla en yakın hastane/toplanma alanına rota kısayolları.
 * Çoklu seçimi destekler.
 */
export const CategoryChipBar: React.FC<CategoryChipBarProps> = ({
  language,
  selectedCategories,
  fetchingCategories,
  onToggleCategory,
  onQuickRoute,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.quickRouteBtn, { backgroundColor: '#E53935' }]}
          onPress={() => onQuickRoute('hospital')}
        >
          <Ionicons name="flash" size={14} color="#FFFFFF" />
          <Text style={styles.quickRouteText}>
            {language === 'tr' ? 'En Yakın Hastane Rotası' : 'Nearest Hospital Route'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.quickRouteBtn, { backgroundColor: '#00838F' }]}
          onPress={() => onQuickRoute('shelter')}
        >
          <Ionicons name="navigate" size={14} color="#FFFFFF" />
          <Text style={styles.quickRouteText}>
            {language === 'tr' ? 'En Yakın Barınma Rotası' : 'Nearest Shelter Route'}
          </Text>
        </TouchableOpacity>

        {CATEGORY_CHIPS.map((chip) => {
          const isSelected = selectedCategories.includes(chip.id);
          const isFetching = fetchingCategories.includes(chip.id);
          return (
            <TouchableOpacity
              key={chip.id}
              activeOpacity={0.85}
              style={[
                styles.chipButton,
                {
                  backgroundColor: isSelected ? chip.color : colors.surface,
                  borderColor: isSelected ? chip.color : colors.border,
                },
              ]}
              onPress={() => onToggleCategory(chip.id)}
            >
              {isFetching ? (
                <ActivityIndicator size="small" color={isSelected ? '#FFFFFF' : chip.color} />
              ) : (
                <Ionicons name={chip.icon as any} size={14} color={isSelected ? '#FFFFFF' : chip.color} />
              )}
              <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : colors.onSurface }]}>
                {language === 'tr' ? chip.titleTR : chip.titleEN}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 50, left: 0, right: 0 },
  scroll: { paddingHorizontal: 16, gap: 8 },
  quickRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  quickRouteText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
});
