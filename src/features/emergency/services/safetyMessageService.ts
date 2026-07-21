import { Linking, Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { EmergencyContact } from '../../../store/slices/emergencySlice';

export type StatusType = 'safe' | 'danger';
export type MessageChannel = 'sms' | 'whatsapp';

/**
 * Hızlı ve zaman aşımlı GPS alma fonksiyonu.
 * GPS 1.5 saniyede yanıt vermezse mesaj göndermeyi KİLİTLEMEZ.
 */
export const getDeviceCoordinatesFast = async (): Promise<{ lat: number; lng: number } | null> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const req = await Location.requestForegroundPermissionsAsync();
      if (req.status !== 'granted') return null;
    }

    // Önce hafızadaki son hızlı konuma bak
    const lastKnown = await Location.getLastKnownPositionAsync();
    if (lastKnown) {
      return { lat: lastKnown.coords.latitude, lng: lastKnown.coords.longitude };
    }

    // 1.5 saniyelik zaman aşımı koruması
    const locationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));

    const result = await Promise.race([locationPromise, timeoutPromise]);
    if (result && 'coords' in result) {
      return { lat: result.coords.latitude, lng: result.coords.longitude };
    }
    return null;
  } catch (err) {
    return null;
  }
};

/**
 * Güvendeyim veya Tehlikedeyim mesajını oluşturur.
 */
export const buildSafetyMessage = (
  type: StatusType,
  coords: { lat: number; lng: number } | null,
  customNote?: string
): string => {
  const mapLink = coords
    ? `https://maps.google.com/?q=${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`
    : 'Konum izni kapalı';

  if (type === 'safe') {
    let msg = `SafeQuake: Ben güvendeyim! Deprem sonrası durumum iyi.\n\n📍 Anlık Konumum:\n${mapLink}`;
    if (customNote && customNote.trim()) {
      msg += `\n\n💬 Not: ${customNote.trim()}`;
    }
    return msg;
  } else {
    let msg = `🚨 SafeQuake ACİL YARDIM:\nTehlikedeyim! Acil yardıma ihtiyacım var!\n\n📍 Anlık Konumum:\n${mapLink}`;
    if (customNote && customNote.trim()) {
      msg += `\n\n💬 Durum Notu: ${customNote.trim()}`;
    }
    return msg;
  }
};

/**
 * SMS veya WhatsApp ile mesajı 0 TL ücretle gönderir.
 * Android ve iOS özel SMS URL formatlarını (%100 uyumlu) destekler.
 */
export const sendSafetyMessage = async (
  contacts: EmergencyContact[],
  type: StatusType,
  channel: MessageChannel,
  customNote?: string
): Promise<boolean> => {
  if (!contacts || contacts.length === 0) {
    Alert.alert(
      'Acil Kişi Ekleyin',
      'Mesaj gönderebilmek için lütfen önce en az 1 acil durum kişisi ekleyin.'
    );
    return false;
  }

  // 1. GPS koordinatını hızlıca al (zaman aşımlı)
  const coords = await getDeviceCoordinatesFast();
  const messageText = buildSafetyMessage(type, coords, customNote);
  const encodedText = encodeURIComponent(messageText);

  // Telefon numaralarını temizle
  const cleanNumbers = contacts
    .map((c) => c.phone.replace(/[^0-9+]/g, ''))
    .filter((num) => num.length > 0);

  if (cleanNumbers.length === 0) {
    Alert.alert('Geçersiz Numara', 'Lütfen acil kişilerinizin telefon numaralarını kontrol edin.');
    return false;
  }

  if (channel === 'whatsapp') {
    // WhatsApp Evrensel Link Yapısı (wa.me)
    const rawPhone = cleanNumbers[0]!;
    const formattedPhone = rawPhone.startsWith('+')
      ? rawPhone.slice(1)
      : rawPhone.startsWith('0')
      ? `90${rawPhone.slice(1)}`
      : `90${rawPhone}`;

    const waUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;

    try {
      await Linking.openURL(waUrl);
      return true;
    } catch (e) {
      Alert.alert('WhatsApp Açılamadı', 'Cihazınızda WhatsApp uygulamasının açılmasında bir sorun oluştu.');
      return false;
    }
  } else {
    // Platform bazlı SMS Yapısı
    // iOS için separator '&', Android için '?' kullanılır.
    const isIOS = Platform.OS === 'ios';
    const numberSeparator = isIOS ? ';' : ',';
    const bodySeparator = isIOS ? '&' : '?';

    const recipientList = cleanNumbers.join(numberSeparator);
    const smsUrl = `sms:${recipientList}${bodySeparator}body=${encodedText}`;

    try {
      await Linking.openURL(smsUrl);
      return true;
    } catch (e) {
      // Standart tek kişi fallback SMS formatı
      const singleSmsUrl = `sms:${cleanNumbers[0]}${bodySeparator}body=${encodedText}`;
      try {
        await Linking.openURL(singleSmsUrl);
        return true;
      } catch (err) {
        Alert.alert('SMS Açılamadı', 'Cihazınızda SMS uygulaması açılamadı.');
        return false;
      }
    }
  }
};
