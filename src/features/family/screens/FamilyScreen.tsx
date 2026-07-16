import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  Switch, 
  ActivityIndicator, 
  Alert,
  Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamily } from '../hooks/useFamily';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { FamilyMember } from '../../../store/slices/emergencySlice';
import { useTranslation } from '../../../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';

export const FamilyScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const navigation = useNavigation<any>();
  const { t, language } = useTranslation();
  const { familyMembers, loading, addFamilyMemberByEmail, reportSafeStatus } = useFamily();

  // Screen states
  const [shareLocation, setShareLocation] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedRelation, setSelectedRelation] = useState<FamilyMember['relation']>('Diğer');
  const [showAddForm, setShowAddForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const relations: FamilyMember['relation'][] = ['Anne', 'Baba', 'Kardeş', 'Arkadaş', 'Eş', 'Diğer'];

  const handleReportSafe = async () => {
    setActionLoading(true);
    try {
      await reportSafeStatus(shareLocation);
      Alert.alert(
        language === 'tr' ? 'Bilgi' : 'Info', 
        language === 'tr' ? 'Durumunuz "Güvendeyim" olarak güncellendi ve yakınlarınıza bildirildi.' : 'Your status has been updated to "Safe" and your relatives have been notified.'
      );
    } catch (err: any) {
      Alert.alert(
        language === 'tr' ? 'Hata' : 'Error', 
        err.message || (language === 'tr' ? 'Durum bildirilemedi.' : 'Could not report status.')
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!searchEmail.trim()) {
      Alert.alert(
        language === 'tr' ? 'Hata' : 'Error', 
        language === 'tr' ? 'Lütfen e-posta adresi girin.' : 'Please enter an email address.'
      );
      return;
    }
    setActionLoading(true);
    try {
      await addFamilyMemberByEmail(searchEmail, selectedRelation);
      Alert.alert(
        language === 'tr' ? 'Başarılı' : 'Success', 
        language === 'tr' ? 'Yakınınız listeye eklendi.' : 'Relative has been added to your list.'
      );
      setSearchEmail('');
      setShowAddForm(false);
    } catch (err: any) {
      Alert.alert(
        language === 'tr' ? 'Hata' : 'Error', 
        err.message || (language === 'tr' ? 'Kullanıcı eklenemedi.' : 'Could not add user.')
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {
        Alert.alert(
          language === 'tr' ? 'Hata' : 'Error', 
          language === 'tr' ? 'Telefon araması başlatılamadı.' : 'Could not start phone call.'
        );
      });
    } else {
      Alert.alert(
        language === 'tr' ? 'Uyarı' : 'Warning', 
        language === 'tr' ? 'Bu kullanıcının telefon numarası bulunmuyor.' : 'This relative has no phone number.'
      );
    }
  };

  const handleShowOnMap = (member: FamilyMember) => {
    if (member.latitude && member.longitude) {
      navigation.navigate('Map', {
        screen: 'MapHome',
        // Pass coordinates to focus on map
        params: {
          focusedLocation: {
            latitude: member.latitude,
            longitude: member.longitude,
            name: member.name
          }
        }
      });
    } else {
      Alert.alert(
        language === 'tr' ? 'Bilgi' : 'Info', 
        language === 'tr' ? 'Bu yakın konumunu paylaşmadı veya durum güncellemedi.' : 'This relative has not shared their location or updated status.'
      );
    }
  };

  const relLabels = { 
    Anne: language === 'tr' ? 'Anne' : 'Mother', 
    Baba: language === 'tr' ? 'Baba' : 'Father', 
    Kardeş: language === 'tr' ? 'Kardeş' : 'Sibling', 
    Arkadaş: language === 'tr' ? 'Arkadaş' : 'Friend', 
    Eş: language === 'tr' ? 'Eş' : 'Spouse', 
    Diğer: language === 'tr' ? 'Diğer' : 'Other' 
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* "Güvendeyim" Quick Action Box */}
      <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.statusTitle, { color: colors.onSurface }]}>{t('familyTitle')}</Text>
        <Text style={[styles.statusDesc, { color: colors.onSurfaceVariant }]}>{t('familySubtitle')}</Text>

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.onSurface }]}>{t('shareLocation')}</Text>
          <Switch 
            value={shareLocation} 
            onValueChange={setShareLocation} 
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <TouchableOpacity 
          style={[styles.safeButton, { backgroundColor: colors.green }]} 
          onPress={handleReportSafe}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.safeButtonContent}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.safeButtonText}>{t('btnSafe')}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Family Members Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>{t('familyListTitle')} ({familyMembers.length})</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary + '15' }]}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Ionicons name={showAddForm ? "close" : "add"} size={16} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>{showAddForm ? (language === 'tr' ? 'Kapat' : 'Close') : t('addFamilyMember')}</Text>
        </TouchableOpacity>
      </View>

      {/* Add Family Member Form */}
      {showAddForm && (
        <View style={[styles.addForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.onSurface }]}>{t('addFamilyMember')}</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.onSurface }]}
            placeholder={t('familyEmailPlaceholder')}
            placeholderTextColor={colors.onSurfaceVariant + '70'}
            value={searchEmail}
            onChangeText={setSearchEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.relationRow}>
            {relations.map((rel) => {
              const isActive = selectedRelation === rel;
              return (
                <TouchableOpacity
                  key={rel}
                  style={[
                    styles.relationChip,
                    { 
                      borderColor: isActive ? colors.primary : colors.border,
                      backgroundColor: isActive ? colors.primary + '15' : colors.background
                    }
                  ]}
                  onPress={() => setSelectedRelation(rel)}
                >
                  <Text style={[styles.relationText, { color: isActive ? colors.primary : colors.onSurface }]}>
                    {relLabels[rel] || rel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity 
            style={[styles.formSubmitButton, { backgroundColor: colors.primary }]}
            onPress={handleAddMember}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <Text style={{ color: colors.onPrimary, fontWeight: 'bold' }}>{language === 'tr' ? 'Listeye Ekle' : 'Add to List'}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Family Members List */}
      <FlatList
        data={familyMembers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.memberRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.memberInfo}>
              <View style={styles.memberNameRow}>
                <Text style={[styles.memberName, { color: colors.onSurface }]}>{item.name}</Text>
                <View style={[styles.tag, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{relLabels[item.relation] || item.relation}</Text>
                </View>
              </View>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>{item.email}</Text>
              
              {/* Safety Status indicator */}
              <View style={styles.statusIndicatorRow}>
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: item.isSafe ? colors.green : colors.orange }
                ]} />
                <Text style={[styles.statusText, { color: item.isSafe ? colors.green : colors.orange }]}>
                  {item.isSafe ? t('safeStatus') : t('unknownStatus')}
                  {item.lastSeen ? ` (${language === 'tr' ? 'Güncelleme' : 'Updated'}: ${item.lastSeen})` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.memberActions}>
              {item.latitude && item.longitude && (
                <TouchableOpacity 
                  style={[styles.actionIconButton, { backgroundColor: colors.primary + '15' }]}
                  onPress={() => handleShowOnMap(item)}
                >
                  <Ionicons name="map-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.actionIconButton, { backgroundColor: colors.primary }]}
                onPress={() => handleCall(item.phone)}
              >
                <Ionicons name="call" size={18} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.onSurfaceVariant + '50'} />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>{language === 'tr' ? 'Kişi Eklenmemiş' : 'No Relatives Added'}</Text>
            <Text style={[styles.emptyDesc, { color: colors.onSurfaceVariant }]}>
              {language === 'tr' 
                ? 'Deprem anında durumlarını takip etmek istediğiniz yakınlarınızı e-posta adresleri ile listenize ekleyin.' 
                : 'Add your relatives by their email address to track their safety status in case of an earthquake.'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  safeButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  safeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  safeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  addForm: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  relationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  relationChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  relationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  formSubmitButton: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  memberInfo: {
    flex: 1,
    gap: 4,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  tag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  tagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
