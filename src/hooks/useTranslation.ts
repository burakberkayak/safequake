import { useAppSelector } from '../store/hooks';

export type TranslationKey = keyof typeof translations['tr'];

export const translations = {
  tr: {
    // Tabs
    tabHome: 'Ana Sayfa',
    tabMap: 'Harita',
    tabEmergency: 'Acil Durum',
    tabFamily: 'Aile',
    tabProfile: 'Profil',

    // Common/Auth
    login: 'Giriş Yap',
    register: 'Kayıt Ol',
    email: 'E-Posta Adresi',
    password: 'Şifre',
    name: 'İsim Soyisim',
    noAccount: 'Hesabınız yok mu? Kayıt Ol',
    hasAccount: 'Zaten hesabınız var mı? Giriş Yap',
    logout: 'Oturumu Kapat',
    save: 'Kaydet',
    edit: 'Düzenle',
    add: 'Ekle',
    delete: 'Sil',
    close: 'Kapat',
    error: 'Hata',
    success: 'Başarılı',
    info: 'Bilgi',
    guestUser: 'Misafir Kullanıcı',
    noEmailProvided: 'E-posta belirtilmemiş',

    // Home
    filter: 'Filtrele',
    filters: 'Filtreler',
    latestEarthquake: 'En Son Deprem',
    magnitude: 'Büyüklük',
    depth: 'Derinlik',
    location: 'Konum',
    distance: 'Mesafe',
    time: 'Zaman',
    noEarthquakes: 'Deprem Bulunamadı',
    noEarthquakesDesc: 'Seçtiğiniz filtrelere uyan herhangi bir deprem kaydı bulunmamaktadır. Filtreleri sıfırlamayı veya genişletmeyi deneyebilirsiniz.',
    last24h: 'Son 24 Saat',
    last7d: 'Son 7 Gün',
    last30d: 'Son 30 Gün',

    // Map
    mapEarthquakes: 'Depremler',
    mapShelters: 'Toplanma',
    mapHospitals: 'Hastaneler',
    mapPharmacies: 'Eczaneler',
    getDirections: 'Yol Tarifi Al',
    address: 'Adres',
    phone: 'Telefon',

    // Emergency Hub
    emergencyHubTitle: 'Acil Durum Merkezi',
    emergencyHubSubtitle: 'Deprem öncesi ve sonrasında ihtiyacınız olabilecek tüm araçlar tek bir yerde.',
    cardTitle: 'Acil Durum Kartı',
    cardDesc: 'Sağlık bilgilerinizi ve acil durum kişilerinizi internetsiz açılacak şekilde kaydedin.',
    bagTitle: 'Deprem Çantası',
    bagDesc: 'Deprem çantanızdaki eksik malzemeleri takip edin ve tamamlayın.',
    eduTitle: 'Deprem Eğitimi',
    eduDesc: 'Hayat kurtaran hareketleri öğrenin ve bilginizi quiz ile test edin.',

    // Emergency Card
    bloodType: 'Kan Grubu',
    allergies: 'Alerjiler',
    chronicDiseases: 'Kronik Hastalıklar',
    medications: 'Kullanılan İlaçlar',
    contacts: 'Acil Durum Yakınları',
    cardOfflineWarning: 'Bu sayfadaki bilgiler cihazınızda güvenli bir şekilde saklanır ve internet bağlantısı olmasa bile erişilebilir durumdadır.',
    addContact: 'Kişi Ekle',
    contactName: 'Yakınınızın Adı Soyadı',
    contactPhone: 'Telefon Numarası',
    relation: 'Yakınlık Derecesi',

    // Checklist
    checklistTitle: 'Deprem Çantası',
    checklistSubtitle: 'Çantanızdaki malzemeleri işaretleyin. Hazırlık oranınızı takip edin.',
    checklistProgress: 'Çanta Hazırlık Oranı',
    missingItems: 'Eksik Eşyalarınız Var!',
    missingItemsDesc: 'Deprem çantanızda henüz tamamlanmamış kritik malzemeler bulunuyor. Lütfen en kısa sürede ekleyin.',

    // Education
    eduTabGuide: 'Rehber',
    eduTabQuiz: 'Quiz',
    eduScore: 'Puan',
    eduBadge: 'Rozet',
    eduQuizFinished: 'Test Bitti!',
    eduCorrect: 'Doğru',
    eduWrong: 'Yanlış',
    eduRestart: 'Tekrar Çöz',

    // Family
    familyTitle: 'Deprem Sonrası Durum Bildir',
    familySubtitle: 'Tek tuşla yakınlarınıza güvende olduğunuzu ve güncel saatinizi bildirebilirsiniz.',
    shareLocation: 'Konumumu Paylaş',
    btnSafe: 'GÜVENDEYİM',
    familyListTitle: 'Yakınlarım',
    addFamilyMember: 'Yakın Ekle',
    familyEmailPlaceholder: 'Yakınınızın E-Posta adresi',
    safeStatus: 'Güvende',
    unknownStatus: 'Durum Bilinmiyor',
    showOnMap: 'Haritada Göster',

    // Profile Settings
    appSettings: 'Uygulama Ayarları',
    theme: 'Tema',
    themeLight: 'Açık',
    themeDark: 'Koyu',
    themeSystem: 'Sistem',
    languageSetting: 'Dil / Language',
    locationSetting: 'Konum Servisleri',
    locationSettingDesc: 'Mesafe bazlı deprem takibi için konum izni.',
    notificationSetting: 'Bildirim İzinleri',
    notificationSettingDesc: 'Yakınlarınızdan haber almak ve deprem uyarıları için bildirim izni.',
    minMagNotify: 'Bildirim Alınacak Min. Deprem Büyüklüğü',
    maxDistNotify: 'Sadece Belirli Mesafedeki Depremleri Bildir',
    notifyAll: 'Hepsi / Tümü',

    // Notifications
    newEarthquakeAlert: '⚠️ YENİ DEPREM',
    alertMag: 'Büyüklük',
    alertDepth: 'Derinlik',
    alertDate: 'Tarih/Saat',
  },
  en: {
    // Tabs
    tabHome: 'Home',
    tabMap: 'Map',
    tabEmergency: 'Emergency',
    tabFamily: 'Family',
    tabProfile: 'Profile',

    // Common/Auth
    login: 'Login',
    register: 'Register',
    email: 'Email Address',
    password: 'Password',
    name: 'Full Name',
    noAccount: "Don't have an account? Register",
    hasAccount: 'Already have an account? Login',
    logout: 'Sign Out',
    save: 'Save',
    edit: 'Edit',
    add: 'Add',
    delete: 'Delete',
    close: 'Close',
    error: 'Error',
    success: 'Success',
    info: 'Info',
    guestUser: 'Guest User',
    noEmailProvided: 'Email not provided',

    // Home
    filter: 'Filter',
    filters: 'Filters',
    latestEarthquake: 'Latest Earthquake',
    magnitude: 'Magnitude',
    depth: 'Depth',
    location: 'Location',
    distance: 'Distance',
    time: 'Time',
    noEarthquakes: 'No Earthquakes Found',
    noEarthquakesDesc: 'There are no earthquake records matching your selected filters. Try resetting or expanding your filters.',
    last24h: 'Last 24 Hours',
    last7d: 'Last 7 Days',
    last30d: 'Last 30 Days',

    // Map
    mapEarthquakes: 'Earthquakes',
    mapShelters: 'Assembly',
    mapHospitals: 'Hospitals',
    mapPharmacies: 'Pharmacies',
    getDirections: 'Get Directions',
    address: 'Address',
    phone: 'Phone',

    // Emergency Hub
    emergencyHubTitle: 'Emergency Hub',
    emergencyHubSubtitle: 'All the tools you may need before and after an earthquake in one place.',
    cardTitle: 'Emergency Card',
    cardDesc: 'Save your medical info and emergency contacts to access them 100% offline.',
    bagTitle: 'Emergency Bag',
    bagDesc: 'Track and complete the missing items in your emergency bag.',
    eduTitle: 'Earthquake Education',
    eduDesc: 'Learn life-saving moves and test your knowledge with a quiz.',

    // Emergency Card
    bloodType: 'Blood Type',
    allergies: 'Allergies',
    chronicDiseases: 'Chronic Illnesses',
    medications: 'Medications',
    contacts: 'Emergency Contacts',
    cardOfflineWarning: 'The information on this page is stored securely on your device and is accessible even without an internet connection.',
    addContact: 'Add Contact',
    contactName: 'Contact Name & Surname',
    contactPhone: 'Phone Number',
    relation: 'Relation',

    // Checklist
    checklistTitle: 'Emergency Bag',
    checklistSubtitle: 'Check off items in your bag. Track your preparation rate.',
    checklistProgress: 'Bag Preparation Rate',
    missingItems: 'You Have Missing Items!',
    missingItemsDesc: 'There are critical items not yet completed in your emergency bag. Please add them as soon as possible.',

    // Education
    eduTabGuide: 'Guide',
    eduTabQuiz: 'Quiz',
    eduScore: 'Score',
    eduBadge: 'Badge',
    eduQuizFinished: 'Quiz Finished!',
    eduCorrect: 'Correct',
    eduWrong: 'Wrong',
    eduRestart: 'Restart Quiz',

    // Family
    familyTitle: 'Report Status After Earthquake',
    familySubtitle: 'With a single tap, you can notify your relatives that you are safe with your current time.',
    shareLocation: 'Share My Location',
    btnSafe: 'I AM SAFE',
    familyListTitle: 'My Relatives',
    addFamilyMember: 'Add Relative',
    familyEmailPlaceholder: "Relative's Email address",
    safeStatus: 'Safe',
    unknownStatus: 'Status Unknown',
    showOnMap: 'Show on Map',

    // Profile Settings
    appSettings: 'Application Settings',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    languageSetting: 'Language / Dil',
    locationSetting: 'Location Services',
    locationSettingDesc: 'Location permission for distance-based earthquake tracking.',
    notificationSetting: 'Notification Permissions',
    notificationSettingDesc: 'Notification permission to get news from relatives and earthquake alerts.',
    minMagNotify: 'Min. Magnitude to Notify',
    maxDistNotify: 'Only Notify Earthquakes within Distance',
    notifyAll: 'All',

    // Notifications
    newEarthquakeAlert: '⚠️ NEW EARTHQUAKE',
    alertMag: 'Magnitude',
    alertDepth: 'Depth',
    alertDate: 'Date/Time',
  },
};

export const useTranslation = () => {
  const language = useAppSelector((state) => state.settings.language);
  
  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations['tr'][key] || String(key);
  };

  return { t, language };
};
