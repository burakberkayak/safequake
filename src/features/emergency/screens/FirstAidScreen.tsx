import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useTranslation } from '../../../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';

interface FirstAidTopic {
  id: string;
  category: 'rubble' | 'bleeding' | 'cpr' | 'choking' | 'fractures' | 'burns';
  titleTR: string;
  titleEN: string;
  icon: string;
  color: string;
  warningTR?: string;
  warningEN?: string;
  stepsTR: string[];
  stepsEN: string[];
}

const FIRST_AID_TOPICS: FirstAidTopic[] = [
  {
    id: 'rubble_survival',
    category: 'rubble',
    titleTR: 'Enkaz Altında Hayatta Kalma',
    titleEN: 'Surviving Under Rubble',
    icon: 'cube-outline',
    color: '#D32F2F',
    warningTR: 'Kibrit veya çakmak yakmayın! Gaz sızıntısı patlamaya yol açabilir. Bağırmayı sadece dışarıdan ses duyduğunuz anlara saklayın.',
    warningEN: 'Do not light matches or lighters! Gas leaks may cause explosions. Save shouting for moments when you hear outside sounds.',
    stepsTR: [
      'Panik yapmayın, solunumunuzu ritmik ve sakin tutun.',
      'Ağzınızı ve burnunuzu bir giysi parçası veya mendille kapatarak toz solumayı önleyin.',
      'Hareket alanınız kısıtlıysa gereksiz hareket edip toz kaldırmayın ve enerjinizi tüketmeyin.',
      'Dışarıdan ses veya iş makinesi duyduğunuzda beton veya kalorifer/su borularına sert bir cisimle ritmik vurun (3 vur - dur - dinle).',
      'Telefonunuz çekiyorsa konumunuzu ve durumunuzu SMS veya SafeQuake S.O.S ile yakınlarınıza bildirin.',
    ],
    stepsEN: [
      'Do not panic, keep your breathing rhythmic and calm.',
      'Cover your mouth and nose with cloth or a handkerchief to avoid inhaling dust.',
      'If space is tight, avoid unnecessary movement to keep dust down and save energy.',
      'When you hear sounds or machinery outside, tap rhythmically on concrete or pipes with a hard object (tap 3 times - stop - listen).',
      'If your phone has signal, send your location and status via SMS or SafeQuake S.O.S.',
    ],
  },
  {
    id: 'bleeding_control',
    category: 'bleeding',
    titleTR: 'Şiddetli Kanama & Turnike',
    titleEN: 'Severe Bleeding & Tourniquet',
    icon: 'water-outline',
    color: '#C62828',
    warningTR: 'Turnike sadece uzuv kopması veya durdurulamayan şiddetli atardamar kanamalarında uygulanır. Her 15-20 dakikada bir 5-10 saniye gevşetilmelidir.',
    warningEN: 'Apply tourniquets only for severe arterial bleeding or limb amputations. Loosen for 5-10 seconds every 15-20 minutes.',
    stepsTR: [
      'Yaralıyı emniyetli bir yere yatırın ve yarayı açıkça görünür hale getirin.',
      'Temiz bir bez veya gazlı bez ile yaranın tam üzerine doğrudan ve kuvvetlice bastırın (Direkt Bası).',
      'Kanama durmuyorsa ilk bezi kaldırmadan üzerine ikinci bezi koyup sargı beziyle sıkıca sarın.',
      'Fışkırır tarzda kanama varsa yaranın 5-7 cm yukarısına geniş bir bant veya kumaş bağlayıp çubuk ile sıkarak turnike yapın.',
      'Turnike yapılan saati ve dakikayı yaralının alnına ruju veya kalemle mutlaka yazın.',
    ],
    stepsEN: [
      'Lie the casualty down safely and expose the wound clearly.',
      'Apply firm, direct pressure over the wound using a clean cloth or gauze.',
      'If bleeding continues, add a second cloth over the first without removing it and wrap tightly.',
      'For pulsing arterial bleeding, apply a tourniquet 5-7 cm above the wound using a wide strap and windlass stick.',
      'Write the exact time of tourniquet application on the casualty’s forehead.',
    ],
  },
  {
    id: 'cpr_basics',
    category: 'cpr',
    titleTR: 'Temel Yaşam Desteği (Kalp Masajı)',
    titleEN: 'CPR (Cardiopulmonary Resuscitation)',
    icon: 'heart-circle-outline',
    color: '#E53935',
    warningTR: 'Solunumu olan kişiye asla kalp masajı yapmayın! Bilinci ve solunumu yoksa derhal 112’yi aratıp masaja başlayın.',
    warningEN: 'Never perform CPR on someone who is breathing! If unconscious and not breathing, call 112 immediately and start CPR.',
    stepsTR: [
      'Hastanın omzuna hafifçe dokunup "İyi misiniz?" diye sorun, bilincini kontrol edin.',
      'Göğüs hareketlerini 10 saniye izleyerek solunum olup olmadığını görün.',
      'Solunumu yoksa hastayı sert bir zemine sırtüstü yatırın.',
      'Göğüs kemiğinin tam ortasına ellerinizi kenetleyerek yerleştirin. Kollarınızı bükmeden 5 cm çökecek şekilde 30 göğüs basısı yapın (Dakikada 100-120 ritim).',
      'Baş-çene pozisyonu vererek hava yolunu açın ve 2 kez suni solunum verin (30 Bası / 2 Solunum).',
    ],
    stepsEN: [
      'Tap the victim’s shoulders and ask "Are you okay?" to check consciousness.',
      'Observe chest movement for 10 seconds to check for normal breathing.',
      'If not breathing, place the person flat on a firm surface on their back.',
      'Interlock your hands over the center of the chest. Push down 5 cm deep 30 times at a rate of 100-120 compressions per minute.',
      'Tilt head back, lift chin to open airway and give 2 rescue breaths (30 Compressions / 2 Breaths).',
    ],
  },
  {
    id: 'choking_heimlich',
    category: 'choking',
    titleTR: 'Tıkanma & Heimlich Manevrası',
    titleEN: 'Choking & Heimlich Maneuver',
    icon: 'body-outline',
    color: '#FB8C00',
    warningTR: 'Kişi öksürebiliyorsa öksürmeye teşvik edin, sırtına vurmayın. Konuşamıyor ve morarıyorsa derhal müdahale edin.',
    warningEN: 'If the person can cough, encourage coughing and do not slap their back. Intervene only if they cannot speak or breathe.',
    stepsTR: [
      'Kişi öksüremiyorsa öne doğru eğin, elinizin topuğuyla kürek kemiklerinin arasına 5 kez kuvvetlice vurun.',
      'Tıkanıklık açılmadıysa arkasına geçin ve kollarınızla belini sarın.',
      'Bir elinizi yumruk yapıp göbek deliğinin hemen üstüne yerleştirin. Diğer elinizle yumruğunuzu kavrayın.',
      'Kuvvetle arkaya ve yukarı doğru 5 kez bastırın (Heimlich Manevrası).',
      'Cisim çıkana kadar 5 Sırt Vuruşu - 5 Heimlich Manevrasını tekrarlayın.',
    ],
    stepsEN: [
      'If the person cannot cough, lean them forward and give 5 firm back blows between shoulder blades.',
      'If unobstructed, stand behind them and wrap your arms around their waist.',
      'Make a fist with one hand just above the navel. Grasp the fist with your other hand.',
      'Perform 5 quick, upward abdominal thrusts (Heimlich Maneuver).',
      'Alternate between 5 back blows and 5 abdominal thrusts until the object is expelled.',
    ],
  },
  {
    id: 'fractures_sprains',
    category: 'fractures',
    titleTR: 'Kırık, Çıkık & Sabitleme',
    titleEN: 'Fractures & Immobilization',
    icon: 'bandage-outline',
    color: '#8E24AA',
    warningTR: 'Kırık kemiği asla düzeltmeye veya yerine oturtmaya çalışmayın! Kırık bölgeyi olduğu pozisyonda sabitleyin.',
    warningEN: 'Never attempt to straighten or relocate a broken bone! Immobilize the limb in the position found.',
    stepsTR: [
      'Yaralıyı hareket ettirmeyin, emniyetli bir alanda tutun.',
      'Kırık şüphesi olan uzvu, kırığın alt ve üst eklemlerini içine alacak şekilde sert karton, tahta veya rulo gazete ile sabitleyin (Atelleme).',
      'Açık kırık (kemiğin dışarı çıktığı durum) varsa yarayı temiz bezle örtün, kemiğe bastırmayın.',
      'Şişliği azaltmak için kırık üzerine doğrudan temas etmeyecek şekilde havluya sarılı soğuk kompres uygulayın.',
      'Nabız ve hissiyatı kontrol etmek için parmakları açıkta bırakın.',
    ],
    stepsEN: [
      'Do not move the casualty unless in immediate danger.',
      'Immobilize the suspected fracture using splints (sturdy cardboard, wood, rolled newspaper) covering joints above and below.',
      'If an open fracture is present, cover with a clean cloth without applying pressure on the bone.',
      'Apply an ice pack wrapped in a towel to reduce swelling (avoid direct ice contact).',
      'Leave fingers or toes exposed to monitor circulation and sensation.',
    ],
  },
  {
    id: 'burns_shock',
    category: 'burns',
    titleTR: 'Yanık Müdahalesi & Şok Pozisyonu',
    titleEN: 'Burns & Shock Position',
    icon: 'flame-outline',
    color: '#00897B',
    warningTR: 'Yanık üzerine asla yoğurt, diş macunu veya salça sürmeyin! Su kabarcıklarını patlatmayın.',
    warningEN: 'Never apply toothpaste, butter, or ointments to burns! Do not pop burn blisters.',
    stepsTR: [
      'Yanık bölgeyi derhal en az 15-20 dakika akar serin su altında tutun.',
      'Yanık alanındaki takıları (yüzük, saat) ödem oluşmadan hemen çıkarın.',
      'Giysiler cilde yapışmamışsa çıkarın, yapışmışsa etrafından keserek bırakın.',
      'Yaralıda soğuk terleme, solukluk veya hızlı nabız varsa (Şok belirtileri), hastayı sırtüstü yatırıp bacaklarını 30 cm yukarı kaldırın (Şok Pozisyonu).',
      'Yanık alanını temiz, nemli ve steril bir bezle örtün.',
    ],
    stepsEN: [
      'Cool the burn immediately under cool running water for at least 15-20 minutes.',
      'Remove rings, watches, or tight items before swelling occurs.',
      'Remove unattached clothing; if stuck to the burn, cut around it.',
      'If shock occurs (pale skin, cold sweat, rapid pulse), lay the person flat and elevate feet 30 cm (Shock Position).',
      'Cover the burn loosely with a clean, moist, sterile cloth or film.',
    ],
  },
];

export const FirstAidScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const { language } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>('rubble_survival');

  const categories = [
    { id: 'all', label: language === 'tr' ? 'Tümü' : 'All', icon: 'grid-outline' },
    { id: 'rubble', label: language === 'tr' ? 'Enkaz Altı' : 'Rubble', icon: 'cube-outline' },
    { id: 'bleeding', label: language === 'tr' ? 'Kanama' : 'Bleeding', icon: 'water-outline' },
    { id: 'cpr', label: language === 'tr' ? 'Kalp Masajı' : 'CPR', icon: 'heart-circle-outline' },
    { id: 'choking', label: language === 'tr' ? 'Tıkanma' : 'Choking', icon: 'body-outline' },
    { id: 'fractures', label: language === 'tr' ? 'Kırıklar' : 'Fractures', icon: 'bandage-outline' },
    { id: 'burns', label: language === 'tr' ? 'Yanık & Şok' : 'Burns', icon: 'flame-outline' },
  ];

  const filteredTopics = useMemo(() => {
    return FIRST_AID_TOPICS.filter((topic) => {
      const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;
      const title = language === 'tr' ? topic.titleTR : topic.titleEN;
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, language]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.onBackground} />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={[styles.headerTitle, { color: colors.onBackground }]}>
            {language === 'tr' ? 'İlk Yardım Rehberi' : 'First Aid Guide'}
          </Text>
          <View style={styles.offlineBadge}>
            <Ionicons name="wifi-outline" size={12} color="#2E7D32" />
            <Text style={styles.offlineText}>
              {language === 'tr' ? '%100 Çevrimdışı İletişim Korumalı' : '100% Offline Ready'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.onSurfaceVariant} />
          <TextInput
            style={[styles.searchInput, { color: colors.onSurface }]}
            placeholder={language === 'tr' ? 'İlk yardım konusu ara (örn. turnike, kanama)...' : 'Search topic (e.g. CPR, bleeding)...'}
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Chips Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons name={cat.icon as any} size={14} color={isSelected ? '#FFFFFF' : colors.onSurface} />
                <Text style={[styles.categoryChipText, { color: isSelected ? '#FFFFFF' : colors.onSurface }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* First Aid Topics Accordion List */}
        <View style={styles.topicList}>
          {filteredTopics.map((topic) => {
            const isExpanded = expandedTopicId === topic.id;
            const title = language === 'tr' ? topic.titleTR : topic.titleEN;
            const warning = language === 'tr' ? topic.warningTR : topic.warningEN;
            const steps = language === 'tr' ? topic.stepsTR : topic.stepsEN;

            return (
              <View
                key={topic.id}
                style={[styles.topicCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.topicCardHeader}
                  onPress={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                >
                  <View style={[styles.iconBox, { backgroundColor: topic.color + '15' }]}>
                    <Ionicons name={topic.icon as any} size={24} color={topic.color} />
                  </View>
                  <Text style={[styles.topicTitle, { color: colors.onSurface }]}>{title}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.onSurfaceVariant}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.topicBody}>
                    {/* Warning Box */}
                    {warning && (
                      <View style={[styles.warningBox, { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' }]}>
                        <Ionicons name="alert-circle-outline" size={18} color="#E65100" />
                        <Text style={styles.warningText}>{warning}</Text>
                      </View>
                    )}

                    {/* Step by Step Items */}
                    <View style={styles.stepsContainer}>
                      <Text style={[styles.stepsTitle, { color: colors.onSurface }]}>
                        {language === 'tr' ? 'Adım Adım Müdahale:' : 'Step-by-Step Action:'}
                      </Text>
                      {steps.map((step, idx) => (
                        <View key={idx} style={styles.stepRow}>
                          <View style={[styles.stepNumberBadge, { backgroundColor: topic.color }]}>
                            <Text style={styles.stepNumberText}>{idx + 1}</Text>
                          </View>
                          <Text style={[styles.stepText, { color: colors.onSurface }]}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    padding: 6,
  },
  headerTextGroup: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  categoryScroll: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  topicList: {
    gap: 12,
  },
  topicCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topicCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  topicBody: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    gap: 14,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#E65100',
    fontWeight: '600',
  },
  stepsContainer: {
    gap: 10,
  },
  stepsTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});
