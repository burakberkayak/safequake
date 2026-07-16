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
import { updateEmergencyCard, EmergencyContact } from '../../../store/slices/emergencySlice';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '../../../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';

export const EmergencyCardScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const dispatch = useAppDispatch();
  const { t, language } = useTranslation();
  const card = useAppSelector((state) => state.emergency.card);

  const [isEditing, setIsEditing] = useState(false);
  const [bloodType, setBloodType] = useState(card.bloodType);
  const [allergies, setAllergies] = useState(card.allergies);
  const [chronicDiseases, setChronicDiseases] = useState(card.chronicDiseases);
  const [medications, setMedications] = useState(card.medications);
  const [contacts, setContacts] = useState<EmergencyContact[]>(card.contacts);

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
      contacts
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
    if (!newContactName || !newContactPhone || !newContactRelation) {
      Alert.alert(
        language === 'tr' ? 'Hata' : 'Error',
        language === 'tr' ? 'Lütfen tüm kişi bilgilerini doldurun.' : 'Please fill in all contact information.'
      );
      return;
    }
    const newContact: EmergencyContact = {
      name: newContactName,
      phone: newContactPhone,
      relation: newContactRelation
    };
    setContacts([...contacts, newContact]);
    setNewContactName('');
    setNewContactPhone('');
    setNewContactRelation('');
  };

  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
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
              
              {contacts.map((contact, index) => (
                <View key={index} style={[styles.contactEditRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: colors.onSurface }]}>{contact.name} ({contact.relation})</Text>
                    <Text style={{ color: colors.onSurfaceVariant }}>{contact.phone}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveContact(index)} style={styles.deleteButton}>
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
                <Text style={{ color: colors.onPrimary, fontWeight: 'bold' }}>{t('save')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={() => setIsEditing(false)}>
                <Text style={{ color: colors.onSurfaceVariant }}>{language === 'tr' ? 'Vazgeç' : 'Cancel'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // VIEW MODE
          <View style={styles.viewCard}>
            {/* Medical Red Card Header */}
            <View style={[styles.medicalCardHeader, { backgroundColor: colors.red }]}>
              <View>
                <Text style={styles.cardHeaderTitle}>{language === 'tr' ? 'TIBBİ BİLGİ KARTI' : 'MEDICAL INFORMATION CARD'}</Text>
                <Text style={styles.cardHeaderSubtitle}>{language === 'tr' ? 'ACİL DURUM İÇİN' : 'FOR EMERGENCY'}</Text>
              </View>
              <View style={styles.bloodCircle}>
                <Text style={[styles.bloodText, { color: colors.red }]}>{card.bloodType || '?'}</Text>
              </View>
            </View>

            <View style={[styles.cardBody, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardInfoRow}>
                <Ionicons name="medical-outline" size={20} color={colors.red} />
                <View style={styles.cardInfoText}>
                  <Text style={[styles.cardInfoLabel, { color: colors.onSurfaceVariant }]}>{t('allergies')}</Text>
                  <Text style={[styles.cardInfoValue, { color: colors.onSurface }]}>{card.allergies || (language === 'tr' ? 'Belirtilmedi' : 'Not specified')}</Text>
                </View>
              </View>

              <View style={styles.cardInfoRow}>
                <Ionicons name="pulse" size={20} color={colors.red} />
                <View style={styles.cardInfoText}>
                  <Text style={[styles.cardInfoLabel, { color: colors.onSurfaceVariant }]}>{t('chronicDiseases')}</Text>
                  <Text style={[styles.cardInfoValue, { color: colors.onSurface }]}>{card.chronicDiseases || (language === 'tr' ? 'Belirtilmedi' : 'Not specified')}</Text>
                </View>
              </View>

              <View style={styles.cardInfoRow}>
                <Ionicons name="flask-outline" size={20} color={colors.red} />
                <View style={styles.cardInfoText}>
                  <Text style={[styles.cardInfoLabel, { color: colors.onSurfaceVariant }]}>{t('medications')}</Text>
                  <Text style={[styles.cardInfoValue, { color: colors.onSurface }]}>{card.medications || (language === 'tr' ? 'Belirtilmedi' : 'Not specified')}</Text>
                </View>
              </View>
            </View>

            {/* Emergency Contacts Section in View Mode */}
            <View style={styles.contactsSection}>
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>{t('contacts')}</Text>
              
              {card.contacts.length === 0 ? (
                <Text style={{ color: colors.onSurfaceVariant, fontStyle: 'italic' }}>{language === 'tr' ? 'Kişi eklenmemiş.' : 'No contacts added.'}</Text>
              ) : (
                card.contacts.map((contact, index) => (
                  <View key={index} style={[styles.contactCardRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
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
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewCard: {
    gap: 20,
  },
  medicalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardHeaderSubtitle: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  bloodCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardBody: {
    borderWidth: 1,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 16,
    gap: 16,
    marginTop: -20, // Connect with header
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardInfoText: {
    flex: 1,
  },
  cardInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardInfoValue: {
    fontSize: 15,
    lineHeight: 20,
  },
  contactsSection: {
    marginTop: 8,
    gap: 12,
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
    marginBottom: 8,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  addContactCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  addContactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  addContactButton: {
    height: 40,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
