import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Alert 
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { toggleItem, addItem, removeItem, ChecklistItem } from '../../../store/slices/checklistSlice';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../../../components/ScreenState';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '../../../hooks/useTranslation';

type CategoryFilter = 'Tümü' | 'Gıda/Su' | 'Ekipman' | 'Belgeler' | 'Sağlık' | 'Diğer';

export const ChecklistScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const dispatch = useAppDispatch();
  const { t, language } = useTranslation();
  const items = useAppSelector((state) => state.checklist.items);

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('Tümü');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'Gıda/Su' | 'Ekipman' | 'Belgeler' | 'Sağlık' | 'Diğer'>('Diğer');

  const categories: CategoryFilter[] = ['Tümü', 'Gıda/Su', 'Ekipman', 'Belgeler', 'Sağlık', 'Diğer'];

  // Calculations
  const totalCount = items.length;
  const checkedCount = items.filter(item => item.checked).length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  // Missing items list (Eksikler)
  const missingItems = items.filter(item => !item.checked);

  // Filtered items
  const filteredItems = items.filter(item => {
    if (activeCategory === 'Tümü') return true;
    return item.category === activeCategory;
  });

  const handleToggle = (id: string) => {
    dispatch(toggleItem(id));
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      Alert.alert(
        language === 'tr' ? 'Hata' : 'Error', 
        language === 'tr' ? 'Lütfen malzeme ismi girin.' : 'Please enter an item name.'
      );
      return;
    }
    const id = Date.now().toString();
    dispatch(addItem({
      id,
      name: newItemName.trim(),
      required: false,
      category: newItemCategory
    }));
    setNewItemName('');
  };

  const handleRemoveItem = (id: string) => {
    dispatch(removeItem(id));
  };

  const categoryLabels = {
    'Tümü': language === 'tr' ? 'Tümü' : 'All',
    'Gıda/Su': language === 'tr' ? 'Gıda/Su' : 'Food/Water',
    'Ekipman': language === 'tr' ? 'Ekipman' : 'Equipment',
    'Belgeler': language === 'tr' ? 'Belgeler' : 'Documents',
    'Sağlık': language === 'tr' ? 'Sağlık' : 'Health',
    'Diğer': language === 'tr' ? 'Diğer' : 'Other'
  };

  const defaultItemTranslations: Record<string, string> = {
    '1': language === 'tr' ? 'Kişi başı en az 3 litre su' : 'At least 3 liters of water per person',
    '2': language === 'tr' ? 'Yüksek kalorili, kuru gıdalar (konserve, bisküvi, vb.)' : 'High-calorie, dry food (canned food, biscuits, etc.)',
    '3': language === 'tr' ? 'İlk yardım çantası ve düzenli kullanılan ilaçlar' : 'First aid kit and regularly used medicines',
    '4': language === 'tr' ? 'El feneri ve yedek piller' : 'Flashlight and spare batteries',
    '5': language === 'tr' ? 'Düdük (ses duyurmak için en kritik malzeme)' : 'Whistle (the most critical item to make noise)',
    '6': language === 'tr' ? 'Taşınabilir şarj cihazı (Powerbank) ve kablo' : 'Portable charger (Powerbank) and cable',
    '7': language === 'tr' ? 'Önemli evrak fotokopileri (kimlik, tapu, vb.)' : 'Copies of important documents (ID, deed, etc.)',
    '8': language === 'tr' ? 'Mevsime uygun giysiler ve battaniye' : 'Seasonal clothing and blankets',
    '9': language === 'tr' ? 'Hijyen malzemeleri (ıslak mendil, sabun, maske)' : 'Hygiene supplies (wet wipes, soap, mask)',
    '10': language === 'tr' ? 'Çok amaçlı çakı veya makas' : 'Multi-purpose pocket knife or scissors',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Progress Header Card */}
      <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressTitle, { color: colors.onSurface }]}>{t('checklistProgress')}</Text>
          <Text style={[styles.progressRatio, { color: colors.primary }]}>{checkedCount} / {totalCount}</Text>
        </View>
        
        {/* Progress Bar */}
        <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
        </View>
        
        <Text style={[styles.progressSubText, { color: colors.onSurfaceVariant }]}>
          {progressPercent === 100 
            ? (language === 'tr' ? 'Tebrikler! Deprem çantanız tamamen hazır.' : 'Congratulations! Your emergency bag is completely ready.') 
            : (language === 'tr' ? `Çantanızda ${totalCount - checkedCount} eksik malzeme bulunuyor.` : `You have ${totalCount - checkedCount} missing items in your bag.`)}
        </Text>
      </View>

      {/* Category Tab Row */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isActive = activeCategory === item;
            return (
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  { 
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border
                  }
                ]}
                onPress={() => setActiveCategory(item)}
              >
                <Text style={[styles.tabText, { color: isActive ? colors.onPrimary : colors.onSurface }]}>
                  {categoryLabels[item] || item}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.tabsContent}
        />
      </View>

      {/* Checklist FlatList */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.itemRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.checkboxWrapper} 
              onPress={() => handleToggle(item.id)}
            >
              <Ionicons 
                name={item.checked ? "checkbox" : "square-outline"} 
                size={24} 
                color={item.checked ? colors.primary : colors.onSurfaceVariant} 
              />
              <Text 
                style={[
                  styles.itemName, 
                  { 
                    color: item.checked ? colors.onSurfaceVariant : colors.onSurface,
                    textDecorationLine: item.checked ? 'line-through' : 'none'
                  }
                ]}
              >
                {defaultItemTranslations[item.id] || item.name}
              </Text>
            </TouchableOpacity>

            {!item.required && (
              <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={18} color={colors.red} />
              </TouchableOpacity>
            )}
          </View>
        )}
        ListHeaderComponent={
          activeCategory === 'Tümü' && missingItems.length > 0 ? (
            <View style={[styles.missingBox, { backgroundColor: colors.redContainer }]}>
              <Ionicons name="alert-circle" size={20} color={colors.red} />
              <Text style={[styles.missingText, { color: colors.red }]}>
                {language === 'tr' ? 'Kritik Eksikleriniz' : 'Critical Missing Items'}: {missingItems.filter(i => i.required).map(i => defaultItemTranslations[i.id] || i.name).slice(0, 3).join(', ')}...
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            title={language === 'tr' ? 'Malzeme Bulunmadı' : 'No Items Found'}
            description={language === 'tr' ? 'Bu kategoride çanta malzemesi bulunmuyor.' : 'There are no bag items in this category.'}
          />
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Add Custom Item Section */}
      <View style={[styles.addItemContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.onSurface }]}
          placeholder={language === 'tr' ? 'Çantaya özel malzeme ekle...' : 'Add custom item to bag...'}
          placeholderTextColor={colors.onSurfaceVariant + '70'}
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleAddItem}>
          <Ionicons name="add" size={24} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  progressRatio: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressSubText: {
    fontSize: 12,
  },
  tabsContainer: {
    marginBottom: 8,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Leave room for footer inputs
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  missingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  missingText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  addItemContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
