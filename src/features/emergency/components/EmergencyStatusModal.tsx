import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { addEmergencyContact, removeEmergencyContact, FamilyMember } from '../../../store/slices/emergencySlice';
import { sendSafetyMessage, StatusType, MessageChannel } from '../services/safetyMessageService';
import { useTranslation } from '../../../hooks/useTranslation';

interface EmergencyStatusModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EmergencyStatusModal: React.FC<EmergencyStatusModalProps> = ({ visible, onClose }) => {
  const { colors } = useAppTheme();
  const { language } = useTranslation();
  const dispatch = useAppDispatch();
  const contacts = useAppSelector((state) => state.emergency.familyMembers);

  const [note, setNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [selectedRelation, setSelectedRelation] = useState<FamilyMember['relation']>('Diğer');
  const [isSending, setIsSending] = useState(false);

  const relations: FamilyMember['relation'][] = ['Anne', 'Baba', 'Kardeş', 'Arkadaş', 'Eş', 'Diğer'];

  const relLabels = { 
    Anne: language === 'tr' ? 'Anne' : 'Mother', 
    Baba: language === 'tr' ? 'Baba' : 'Father', 
    Kardeş: language === 'tr' ? 'Kardeş' : 'Sibling', 
    Arkadaş: language === 'tr' ? 'Arkadaş' : 'Friend', 
    Eş: language === 'tr' ? 'Eş' : 'Spouse', 
    Diğer: language === 'tr' ? 'Diğer' : 'Other' 
  };

  const handleAddContact = () => {
    if (!nameInput.trim() || !phoneInput.trim()) {
      Alert.alert(
        language === 'tr' ? 'Eksik Bilgi' : 'Missing Information',
        language === 'tr' ? 'Lütfen ad soyad ve telefon numarasını girin.' : 'Please enter name and phone number.'
      );
      return;
    }

    dispatch(addEmergencyContact({
      name: nameInput.trim(),
      phone: phoneInput.trim(),
      relation: selectedRelation,
    }));

    setNameInput('');
    setPhoneInput('');
    setShowAddForm(false);
  };

  const handleRemoveContact = (index: number) => {
    Alert.alert(
      language === 'tr' ? 'Kişiyi Sil' : 'Delete Contact',
      language === 'tr' ? 'Bu kişiyi acil durum listenizden silmek istediğinize emin misiniz?' : 'Are you sure you want to remove this contact?',
      [
        { text: language === 'tr' ? 'İptal' : 'Cancel', style: 'cancel' },
        { text: language === 'tr' ? 'Sil' : 'Delete', style: 'destructive', onPress: () => dispatch(removeEmergencyContact(index)) },
      ]
    );
  };

  const handleBroadcast = async (status: StatusType, channel: MessageChannel) => {
    if (contacts.length === 0) {
      Alert.alert(
        language === 'tr' ? 'Kişi Listesi Boş' : 'No Emergency Contacts',
        language === 'tr' ? 'Durum mesajı gönderebilmek için lütfen önce en az 1 acil durum kişisi ekleyin.' : 'Please add at least 1 emergency contact to send status message.'
      );
      setShowAddForm(true);
      return;
    }

    setIsSending(true);
    const success = await sendSafetyMessage(contacts, status, channel, note);
    setIsSending(false);

    if (success) {
      setNote('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerTitleGroup}>
              <View style={[styles.headerIconWrapper, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
                {language === 'tr' ? 'Güvendeyim / Acil Mesaj' : 'Safety Status Broadcast'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Subtitle Info */}
            <Text style={[styles.subText, { color: colors.onSurfaceVariant }]}>
              {language === 'tr'
                ? 'Tek dokunuşla canlı GPS konumunuzu ve durumunuzu yakınlarınıza 0 TL maliyetle SMS veya WhatsApp üzerinden ulaştırın.'
                : 'Send your live GPS coordinates and safety status to relatives via SMS or WhatsApp with 0 cost.'}
            </Text>

            {/* Status Broadcast Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              {/* 🟢 I AM SAFE BUTTON (SMS & WhatsApp) */}
              <View style={styles.actionCard}>
                <View style={[styles.actionBadge, { backgroundColor: '#2E7D3215' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
                  <Text style={[styles.actionBadgeTitle, { color: '#2E7D32' }]}>
                    {language === 'tr' ? 'BEN GÜVENDEYİM' : 'I AM SAFE'}
                  </Text>
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.broadcastBtn, { backgroundColor: '#2E7D32' }]}
                    onPress={() => handleBroadcast('safe', 'sms')}
                    disabled={isSending}
                  >
                    <Ionicons name="chatbox-ellipses" size={16} color="#FFFFFF" />
                    <Text style={styles.broadcastBtnText}>
                      {language === 'tr' ? 'SMS ile Gönder' : 'Send SMS'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.broadcastBtn, { backgroundColor: '#25D366' }]}
                    onPress={() => handleBroadcast('safe', 'whatsapp')}
                    disabled={isSending}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                    <Text style={styles.broadcastBtnText}>
                      {language === 'tr' ? 'WhatsApp' : 'WhatsApp'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 🔴 I NEED HELP BUTTON (SMS & WhatsApp) */}
              <View style={styles.actionCard}>
                <View style={[styles.actionBadge, { backgroundColor: '#E5393515' }]}>
                  <Ionicons name="alert-circle" size={24} color="#E53935" />
                  <Text style={[styles.actionBadgeTitle, { color: '#E53935' }]}>
                    {language === 'tr' ? 'TEHLİKEDEYİM / ACİL YARDIM' : 'I NEED HELP'}
                  </Text>
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.broadcastBtn, { backgroundColor: '#E53935' }]}
                    onPress={() => handleBroadcast('danger', 'sms')}
                    disabled={isSending}
                  >
                    <Ionicons name="chatbox-ellipses" size={16} color="#FFFFFF" />
                    <Text style={styles.broadcastBtnText}>
                      {language === 'tr' ? 'SMS ile Gönder' : 'Send SMS'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.broadcastBtn, { backgroundColor: '#C62828' }]}
                    onPress={() => handleBroadcast('danger', 'whatsapp')}
                    disabled={isSending}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                    <Text style={styles.broadcastBtnText}>
                      {language === 'tr' ? 'WhatsApp' : 'WhatsApp'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Custom Optional Note Input */}
            <View style={styles.sectionWrapper}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                💬 {language === 'tr' ? 'İsteğe Bağlı Durum Notu' : 'Optional Custom Note'}
              </Text>
              <TextInput
                style={[
                  styles.noteInput,
                  {
                    backgroundColor: colors.surfaceVariant + '40',
                    color: colors.onSurface,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={
                  language === 'tr'
                    ? 'Örn: Binam hasarsız, toplanma alanındayım...'
                    : 'E.g. Building is undamaged, staying at assembly area...'
                }
                placeholderTextColor={colors.onSurfaceVariant}
                value={note}
                onChangeText={setNote}
                maxLength={120}
              />
            </View>

            {/* Emergency Contacts List Section */}
            <View style={styles.sectionWrapper}>
              <View style={styles.contactsHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  👥 {language === 'tr' ? 'Acil Durum Yakınlarım' : 'Emergency Contacts'} ({contacts.length})
                </Text>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setShowAddForm(!showAddForm)}
                >
                  <Ionicons name={showAddForm ? 'close' : 'add'} size={18} color="#FFFFFF" />
                  <Text style={styles.addBtnText}>
                    {showAddForm
                      ? (language === 'tr' ? 'Kapat' : 'Close')
                      : (language === 'tr' ? 'Kişi Ekle' : 'Add Contact')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Add Contact Form with Chips Selector */}
              {showAddForm && (
                <View style={[styles.formCard, { backgroundColor: colors.surfaceVariant + '30', borderColor: colors.border }]}>
                  <Text style={[styles.formTitle, { color: colors.onSurface }]}>
                    {language === 'tr' ? 'Yeni Acil Durum Kişisi Ekleyin' : 'Add New Emergency Contact'}
                  </Text>

                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.surface, color: colors.onSurface, borderColor: colors.border }]}
                    placeholder={language === 'tr' ? 'Ad Soyad (Örn: Ahmet Yılmaz)' : 'Name (E.g. John Doe)'}
                    placeholderTextColor={colors.onSurfaceVariant}
                    value={nameInput}
                    onChangeText={setNameInput}
                  />

                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.surface, color: colors.onSurface, borderColor: colors.border }]}
                    placeholder={language === 'tr' ? 'Telefon Numarası (Örn: 05551234567)' : 'Phone Number'}
                    placeholderTextColor={colors.onSurfaceVariant}
                    keyboardType="phone-pad"
                    value={phoneInput}
                    onChangeText={setPhoneInput}
                  />

                  {/* Clean Relation Chips Selector */}
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
                              backgroundColor: isActive ? colors.primary + '15' : colors.surface,
                            },
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
                    activeOpacity={0.85}
                    style={[styles.saveContactBtn, { backgroundColor: colors.primary }]}
                    onPress={handleAddContact}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    <Text style={styles.saveContactBtnText}>
                      {language === 'tr' ? 'Kaydet' : 'Save Contact'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Contact Items */}
              {contacts.length === 0 ? (
                <View style={[styles.emptyBox, { backgroundColor: colors.surfaceVariant + '20' }]}>
                  <Ionicons name="people-outline" size={32} color={colors.onSurfaceVariant} />
                  <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                    {language === 'tr'
                      ? 'Henüz acil durum kişisi eklenmedi. "Kişi Ekle" butonuna basarak yakınınızı ekleyin.'
                      : 'No emergency contacts added yet. Tap "Add Contact" to add relatives.'}
                  </Text>
                </View>
              ) : (
                contacts.map((c, index) => (
                  <View key={c.id || index} style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[styles.contactAvatar, { backgroundColor: colors.primary + '15' }]}>
                      <Ionicons name="person" size={18} color={colors.primary} />
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={[styles.contactName, { color: colors.onSurface }]}>{c.name}</Text>
                      <Text style={[styles.contactMeta, { color: colors.onSurfaceVariant }]}>
                        📞 {c.phone} · {relLabels[c.relation as keyof typeof relLabels] || c.relation}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.deleteContactBtn} onPress={() => handleRemoveContact(index)}>
                      <Ionicons name="trash-outline" size={18} color="#E53935" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#00000010',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  subText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  actionButtonsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00000015',
    padding: 12,
    gap: 10,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  actionBadgeTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  broadcastBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  broadcastBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionWrapper: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  contactsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  formCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  relationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  relationChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  relationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  saveContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  saveContactBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 14,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
  },
  contactMeta: {
    fontSize: 12,
  },
  deleteContactBtn: {
    padding: 6,
  },
});
