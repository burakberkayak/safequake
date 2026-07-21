import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Linking
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { updateEmergencyCard, addEmergencyContact, removeFamilyMember } from '../../../store/slices/emergencySlice';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '../../../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';

export const EmergencyCardScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const dispatch = useAppDispatch();
  const { t, language } = useTranslation();

  const card = useAppSelector((state) => state.emergency.card);
  const familyMembers = useAppSelector((state) => state.emergency.familyMembers);

  const [isEditing, setIsEditing] = useState(false);
  const [bloodType, setBloodType] = useState(card.bloodType);
  const [allergies, setAllergies] = useState(card.allergies);
  const [chronicDiseases, setChronicDiseases] = useState(card.chronicDiseases);
  const [medications, setMedications] = useState(card.medications);

  // Form states for adding new contact
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');

  const handleSave = () => {
    dispatch(updateEmergencyCard({
      bloodType,
      allergies,
      chronicDiseases,
      medications,
    }));
    setIsEditing(false);
    Alert.alert(
      language === 'tr' ? 'Bilgi' : 'Info',
      language === 'tr' ? 'Acil durum kartınız başarıyla güncellendi.' : 'Your emergency card was successfully updated.'
    );
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert(
        language === 'tr' ? 'Hata' : 'Error',
        language === 'tr' ? 'Telefon araması başlatılamadı.' : 'Could not start phone call.'
      );
    });
  };

  const handleAddContact = () => {
    if (!newContactName || !newContactPhone) {
      Alert.alert(
        language === 'tr' ? 'Hata' : 'Error',
        language === 'tr' ? 'Lütfen ad soyad ve telefon numarasını doldurun.' : 'Please enter name and phone number.'
      );
      return;
    }
    dispatch(addEmergencyContact({
      name: newContactName,
      phone: newContactPhone,
      relation: newContactRelation || 'Diğer',
    }));
    setNewContactName('');
    setNewContactPhone('');
    setNewContactRelation('');
  };

  const handleRemoveContact = (id: string) => {
    dispatch(removeFamilyMember(id));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="medical" size={32} color={colors.red} />
          <Text style={[styles.title, { color: colors.onBackground }]}>{t('cardTitle')}</Text>
        </View>

        <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
          {t('cardOfflineWarning')}
        </Text>

        {isEditing ? (
          // EDIT MODE
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>{t('bloodType')}</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.onSurface }]}
                placeholder={language === 'tr' ? 'ör. AB Rh+' : 'e.g. AB Rh+'}
                placeholderTextColor={colors.onSurfaceVariant + '70'}
                value={bloodType}
                onChangeText={setBloodType}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>{t('allergies')}</Text>
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.onSurface }]}
                placeholder={language === 'tr' ? 'Alerjileriniz (ör. Penisilin, fıstık vb.)' : 'Your allergies (e.g. Penicillin, peanuts etc.)'}
                placeholderTextColor={colors.onSurfaceVariant + '70'}
                value={allergies}
                onChangeText={setAllergies}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>{t('chronicDiseases')}</Text>
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.onSurface }]}
                placeholder={language === 'tr' ? 'Kronik hastalıklarınız (ör. Diyabet, astım vb.)' : 'Chronic illnesses (e.g. Diabetes, asthma etc.)'}
                placeholderTextColor={colors.onSurfaceVariant + '70'}
                value={chronicDiseases}
                onChangeText={setChronicDiseases}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>{t('medications')}</Text>
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.onSurface }]}
                placeholder={language === 'tr' ? 'Düzenli kullandığınız ilaçlar' : 'Regular medications'}
                placeholderTextColor={colors.onSurfaceVariant + '70'}
                value={medications}
                onChangeText={setMedications}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Emergency Contacts Section in Edit Mode */}
            <View style={styles.contactsSection}>
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>{t('contacts')}</Text>
              
              {familyMembers.map((contact) => (
                <View key={contact.id} style={[styles.contactEditRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: colors.onSurface }]}>{contact.name} ({contact.relation})</Text>
                    <Text style={{ color: colors.onSurfaceVariant }}>{contact.phone}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveContact(contact.id)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={20} color={colors.red} />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={[styles.addContactCard, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.addContactTitle, { color: colors.onSurface }]}>{language === 'tr' ? 'Yeni Kişi Ekle' : 'Add New Contact'}</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.onSurface }]}
                  placeholder={language === 'tr' ? 'Ad Soyad' : 'Name Surname'}
                  placeholderTextColor={colors.onSurfaceVariant + '70'}
                  value={newContactName}
                  onChangeText={setNewContactName}
                />
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.onSurface }]}
                  placeholder={t('contactPhone')}
                  placeholderTextColor={colors.onSurfaceVariant + '70'}
                  value={newContactPhone}
                  onChangeText={setNewContactPhone}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.onSurface }]}
                  placeholder={language === 'tr' ? 'Yakınlık Derecesi (ör. Anne, Eş)' : 'Relation (e.g. Mother, Spouse)'}
                  placeholderTextColor={colors.onSurfaceVariant + '70'}
                  value={newContactRelation}
                  onChangeText={setNewContactRelation}
                />
                <TouchableOpacity style={[styles.addContactButton, { backgroundColor: colors.primary }]} onPress={handleAddContact}>
                  <Ionicons name="add" size={20} color={colors.onPrimary} />
                  <Text style={{ color: colors.onPrimary, fontWeight: 'bold' }}>{t('addContact')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.onPrimary} />
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={() => setIsEditing(false)}>
                <Text style={[styles.cancelButtonText, { color: colors.onSurfaceVariant }]}>{language === 'tr' ? 'İptal' : 'Cancel'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // VIEW MODE
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="water" size={24} color={colors.red} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.cardInfoLabel, { color: colors.onSurfaceVariant }]}>{t('bloodType')}</Text>
                <Text style={[styles.cardInfoValue, styles.bloodTypeValue, { color: colors.red }]}>{card.bloodType || (language === 'tr' ? 'Belirtilmedi' : 'Not specified')}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="warning" size={24} color={colors.orange} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.cardInfoLabel, { color: colors.onSurfaceVariant }]}>{t('allergies')}</Text>
                <Text style={[styles.cardInfoValue, { color: colors.onSurface }]}>{card.allergies || (language === 'tr' ? 'Yok / Belirtilmedi' : 'None specified')}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="pulse" size={24} color={colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.cardInfoLabel, { color: colors.onSurfaceVariant }]}>{t('chronicDiseases')}</Text>
                <Text style={[styles.cardInfoValue, { color: colors.onSurface }]}>{card.chronicDiseases || (language === 'tr' ? 'Yok / Belirtilmedi' : 'None specified')}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="bandage" size={24} color={colors.green} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.cardInfoLabel, { color: colors.onSurfaceVariant }]}>{t('medications')}</Text>
                <Text style={[styles.cardInfoValue, { color: colors.onSurface }]}>{card.medications || (language === 'tr' ? 'Belirtilmedi' : 'Not specified')}</Text>
              </View>
            </View>

            {/* Emergency Contacts Section in View Mode */}
            <View style={styles.contactsSection}>
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>{t('contacts')}</Text>
              
              {familyMembers.length === 0 ? (
                <Text style={{ color: colors.onSurfaceVariant, fontStyle: 'italic' }}>{language === 'tr' ? 'Kişi eklenmemiş.' : 'No contacts added.'}</Text>
              ) : (
                familyMembers.map((contact) => (
                  <View key={contact.id} style={[styles.contactCardRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                    <View style={styles.contactInfo}>
                      <Text style={[styles.contactName, { color: colors.onSurface }]}>{contact.name} ({contact.relation})</Text>
                      <Text style={{ color: colors.onSurfaceVariant }}>{contact.phone}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleCall(contact.phone)} style={[styles.callButton, { backgroundColor: colors.primary }]}>
                      <Ionicons name="call" size={20} color={colors.onPrimary} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            <TouchableOpacity style={[styles.editButton, { borderColor: colors.primary }]} onPress={() => setIsEditing(true)}>
              <Ionicons name="create-outline" size={20} color={colors.primary} />
              <Text style={[styles.editButtonText, { color: colors.primary }]}>{language === 'tr' ? 'Bilgileri Düzenle' : 'Edit Information'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  card: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  infoIconWrapper: {
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
    gap: 2,
  },
  cardInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardInfoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  bloodTypeValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  contactsSection: {
    marginTop: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contactCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  contactEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 6,
  },
  addContactCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  addContactTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 6,
    marginTop: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  actionButtons: {
    gap: 10,
    marginTop: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
