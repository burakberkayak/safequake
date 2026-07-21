import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  Alert,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamily } from '../hooks/useFamily';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useAppDispatch } from '../../../store/hooks';
import { removeFamilyMember, removeEmergencyContact, FamilyMember } from '../../../store/slices/emergencySlice';
import { EmergencyStatusModal } from '../../emergency/components/EmergencyStatusModal';
import { useTranslation } from '../../../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';

export const FamilyScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const dispatch = useAppDispatch();
  const { language } = useTranslation();
  const { familyMembers, addFamilyMemberDirectly } = useFamily();

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRelation, setSelectedRelation] = useState<FamilyMember['relation']>('Diğer');
  const [showAddForm, setShowAddForm] = useState(false);
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);

  const relations: FamilyMember['relation'][] = ['Anne', 'Baba', 'Kardeş', 'Arkadaş', 'Eş', 'Diğer'];

  const handleAddMember = () => {
    try {
      addFamilyMemberDirectly(name, phone, selectedRelation);
      Alert.alert(
        language === 'tr' ? 'Başarılı' : 'Success', 
        language === 'tr' ? 'Yakınınız acil durum listesine eklendi.' : 'Relative added to emergency list.'
      );
      setName('');
      setPhone('');
      setShowAddForm(false);
    } catch (err: any) {
      Alert.alert(
        language === 'tr' ? 'Eksik Bilgi' : 'Missing Info', 
        err.message || (language === 'tr' ? 'Lütfen ad soyad ve telefon numarasını doldurun.' : 'Please enter name and phone number.')
      );
    }
  };

  const handleDeleteMember = (id: string, memberIndex: number) => {
    dispatch(removeFamilyMember(id));
    dispatch(removeEmergencyContact(memberIndex));
  };

  const handleCall = (phoneNum: string) => {
    if (phoneNum) {
      Linking.openURL(`tel:${phoneNum}`).catch(() => {
        Alert.alert(
          language === 'tr' ? 'Hata' : 'Error', 
          language === 'tr' ? 'Telefon araması başlatılamadı.' : 'Could not start phone call.'
        );
      });
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
      {/* Aile & Acil Durum Mesaj Paneli */}
      <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.cardHeaderIcon, { backgroundColor: '#2E7D3215' }]}>
            <Ionicons name="shield-checkmark" size={22} color="#2E7D32" />
          </View>
          <View style={styles.cardHeaderTextGroup}>
            <Text style={[styles.statusTitle, { color: colors.onSurface }]}>
              {language === 'tr' ? 'Aile & Acil Durum Mesaj Ağı' : 'Family Emergency Safety Network'}
            </Text>
            <Text style={[styles.statusDesc, { color: colors.onSurfaceVariant }]}>
              {language === 'tr' 
                ? 'Tek tıkla canlı GPS konumunuzu SMS veya WhatsApp ile tüm aileye 0 TL maliyetle bildirin.'
                : 'Send live GPS position to all family members via SMS or WhatsApp with 0 cost.'}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          activeOpacity={0.88}
          style={[styles.safeButton, { backgroundColor: '#2E7D32' }]} 
          onPress={() => setEmergencyModalVisible(true)}
        >
          <View style={styles.safeButtonContent}>
            <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
            <Text style={styles.safeButtonText}>
              {language === 'tr' ? 'GÜVENDEYİM / ACİL MESAJ GÖNDER (0 TL)' : 'SEND SAFETY STATUS / SMS (0 TL)'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Aile Üyeleri Başlığı */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
          {language === 'tr' ? `Yakınlarım (${familyMembers.length})` : `My Family (${familyMembers.length})`}
        </Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary + '15' }]}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Ionicons name={showAddForm ? "close" : "add"} size={16} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>
            {showAddForm ? (language === 'tr' ? 'Kapat' : 'Close') : (language === 'tr' ? 'Yakın Ekle' : 'Add Member')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* İsim + Telefon Numarası + Yakınlık Ekleme Formu */}
      {showAddForm && (
        <View style={[styles.addForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.onSurface }]}>
            {language === 'tr' ? 'Yeni Yakın Ekle' : 'Add New Family Member'}
          </Text>
          
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.onSurface }]}
            placeholder={language === 'tr' ? 'Ad Soyad (Örn: Ahmet Yılmaz)' : 'Full Name'}
            placeholderTextColor={colors.onSurfaceVariant + '70'}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.onSurface }]}
            placeholder={language === 'tr' ? 'Telefon Numarası (Örn: 05551234567)' : 'Phone Number'}
            placeholderTextColor={colors.onSurfaceVariant + '70'}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
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
          >
            <Text style={{ color: colors.onPrimary, fontWeight: 'bold' }}>
              {language === 'tr' ? 'Listeye Kaydet' : 'Save to Family List'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Aile Üyeleri Listesi */}
      <FlatList
        data={familyMembers}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={[styles.memberRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.memberInfo}>
              <View style={styles.memberNameRow}>
                <Text style={[styles.memberName, { color: colors.onSurface }]}>{item.name}</Text>
                <View style={[styles.tag, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{relLabels[item.relation] || item.relation}</Text>
                </View>
              </View>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, fontWeight: '600' }}>
                📞 {item.phone}
              </Text>
            </View>

            <View style={styles.memberActions}>
              <TouchableOpacity 
                style={[styles.actionIconButton, { backgroundColor: '#2E7D3215' }]}
                onPress={() => handleCall(item.phone)}
              >
                <Ionicons name="call" size={18} color="#2E7D32" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionIconButton, { backgroundColor: '#E5393515' }]}
                onPress={() => handleDeleteMember(item.id, index)}
              >
                <Ionicons name="trash-outline" size={18} color="#E53935" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.onSurfaceVariant + '50'} />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              {language === 'tr' ? 'Henüz Yakın Eklenmemiş' : 'No Relatives Added'}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.onSurfaceVariant }]}>
              {language === 'tr' 
                ? 'Deprem anında 0 TL ile anlık konum ve SMS mesajı atmak istediğiniz aile üyelerinizin isim ve telefon numaralarını ekleyin.' 
                : 'Add family members with name and phone number to send 1-tap SMS status.'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Entegre SMS & WhatsApp Paneli */}
      <EmergencyStatusModal
        visible={emergencyModalVisible}
        onClose={() => setEmergencyModalVisible(false)}
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
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cardHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderTextGroup: {
    flex: 1,
    gap: 2,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  statusDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  safeButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  safeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  safeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
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
    borderRadius: 12,
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
    height: 42,
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
    borderRadius: 12,
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
