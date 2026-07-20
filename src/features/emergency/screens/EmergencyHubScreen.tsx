import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useTranslation } from '../../../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';

export const EmergencyHubScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const navigation = useNavigation<any>();
  const { t, language } = useTranslation();

  const menuItems = [
    {
      title: language === 'tr' ? 'Çevrimdışı İlk Yardım Rehberi' : 'Offline First Aid Guide',
      description: language === 'tr' ? 'Enkaz altı, kanama, kalp masajı, tıkanma ve kırık adımları (%100 İnternetsiz)' : 'Under rubble, CPR, bleeding, choking steps (100% Offline)',
      icon: 'heart-circle',
      color: '#E53935',
      target: 'FirstAid',
    },
    {
      title: t('cardTitle'),
      description: t('cardDesc'),
      icon: 'medical',
      color: colors.red,
      target: 'EmergencyCard',
    },
    {
      title: t('bagTitle'),
      description: t('bagDesc'),
      icon: 'briefcase',
      color: colors.primary,
      target: 'Checklist',
    },
    {
      title: t('eduTitle'),
      description: t('eduDesc'),
      icon: 'school',
      color: '#0288D1',
      target: 'Education',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onBackground }]}>{t('emergencyHubTitle')}</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          {t('emergencyHubSubtitle')}
        </Text>
      </View>

      <View style={styles.menuList}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate(item.target)}
          >
            <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon as any} size={28} color={item.color} />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>{item.title}</Text>
              <Text style={[styles.cardDesc, { color: colors.onSurfaceVariant }]}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceVariant} style={styles.arrow} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  menuList: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  arrow: {
    marginLeft: 8,
  },
});
