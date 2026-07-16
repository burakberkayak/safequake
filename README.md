# SafeQuake — Mimari İskelet

Bu paket, PRD'nin tamamını değil; **temel mimariyi + Ana Sayfa (§7) özelliğini**
uçtan uca, production kalitesinde içerir. PRD 26 bölümden oluşuyor (Firebase Auth,
Google Maps, offline mod, aile güvende sistemi vb.) — hepsini tek seferde üretmek
yerine sağlam bir temel + bir referans özellik üretip, üzerine katman katman
inşa etmek daha sürdürülebilir.

## Neden bu yapı?

- **Feature-Based Folder Structure** (§24): Her özellik (`earthquake`, `map`,
  `family`, ...) kendi `api/`, `components/`, `hooks/`, `screens/`, `types/`
  alt klasörlerine sahip, birbirinden bağımsız geliştirilip commit'lenebilir.
- **Repository Pattern + Dependency Injection**: `EarthquakeRepository`
  arayüzü sayesinde ekranlar AFAD/Kandilli'ye değil soyutlamaya bağımlı.
  `earthquakeRepositoryFactory.ts` hangi implementasyonun (Mock/AFAD)
  kullanılacağına `EXPO_PUBLIC_USE_MOCK_DATA` env değişkeniyle karar verir.
  Bu sayede **API anahtarları/gerçek endpoint'ler netleşmeden de** uygulama
  gerçekçi mock veriyle uçtan uca çalışır ve test edilebilir.
- **TypeScript strict mode** (`tsconfig.json`): `strict`, `noUncheckedIndexedAccess`
  açık.
- **Reusable UI state bileşenleri** (§21): `LoadingState`, `EmptyState`,
  `ErrorState`, `SkeletonBlock` — `src/components/ScreenState.tsx` içinde,
  her feature ekranı bunları tekrar tekrar kullanır.
- **React Query**: Ağ state'i (loading/error/cache/otomatik yenileme) için;
  Redux Toolkit ise §25'te istenen client-side global state (filtreler, auth
  session, tema tercihi vb.) için ayrılacak — ikisini karıştırmamak önemli.

## Şu an çalışan akış

```
App.tsx
 └─ ThemeProvider (light/dark/system)
     └─ QueryClientProvider
         └─ HomeScreen
             ├─ useLatestEarthquake() ─┐
             ├─ useEarthquakes()      ─┴─> getEarthquakeRepository()
             │                              └─ MockEarthquakeRepository (şimdilik)
             ├─ LastEarthquakeCard
             ├─ EarthquakeListItem (FlatList)
             └─ Loading/Empty/Error state'leri
```

## Kurulum

```bash
npm install
npx expo start
```

Bu proje gerçekten `npm install` ile kurulup Metro ile bundle edilerek
doğrulandı (1194 modül, hatasız).

### Önemli düzeltme: `src/app` → `src/bootstrap`

Önceki sürümde kök App bileşeni `src/app/App.tsx` yolundaydı. Expo CLI,
proje içinde adı `app` olan bir klasörü otomatik olarak **Expo Router**
kökü sanıp yanlış yapılandırma/route çözümlemesi yapıyordu — projenin
"bozuk" görünmesinin sebebi buydu. Klasör `src/bootstrap` olarak yeniden
adlandırıldı; kök dizindeki `App.tsx` (Expo'nun `expo/AppEntry.js`
betiğinin aradığı standart giriş dosyası) sadece oraya yönlendiriyor:

```ts
// App.tsx (proje kökü)
export { default } from './src/bootstrap/App';
```

Bu proje Expo Router **kullanmıyor** — PRD §25'te Expo Router "isteğe
bağlı" olarak listelenmişti; navigasyon React Navigation (Bottom Tabs +
tip güvenli param'lar) ile manuel kuruldu.

Gerçek AFAD verisine geçmek için `.env` dosyasına:

```
EXPO_PUBLIC_USE_MOCK_DATA=false
EXPO_PUBLIC_AFAD_BASE_URL=<doğrulanmış AFAD endpoint>
```

## Sırada ne var? (önerilen sıra)

1. ~~**Navigasyon iskeleti**~~ ✅ — Bottom Tabs (Ana Sayfa, Harita),
   `navigation/types.ts` ile tip güvenli route param'ları.
2. ~~**Harita sayfası (§8)**~~ ✅ — `react-native-maps`, büyüklüğe göre
   renkli marker'lar, tıklanınca açılan Bottom Sheet (büyüklük/tarih/saat/
   koordinat/derinlik). Ana Sayfa'dan bir depreme dokunulunca Harita'ya o
   depreme odaklanmış şekilde geçiliyor.
3. **Filtreleme (§9)** — `EarthquakeFilters` tipi ve util fonksiyonları
   (`filterByTimeRange`, `filterByRadius`) zaten hazır; bir filtre bottom
   sheet UI'ı + Redux slice (`filtersSlice`) eklenmesi yeterli.
4. **Bildirimler (§10)** — `expo-notifications`; büyüklük/mesafe eşiği
   kullanıcı ayarına göre local/push tetikleme.
5. **Aile Güvende (§13) + Acil Durum Kartı (§14)** — Firebase Firestore +
   AsyncStorage/SecureStore (offline erişim şart).
6. **Deprem Çantası (§15) ve Eğitim (§16)** — tamamen local state/AsyncStorage,
   backend gerektirmez, hızlı kazanılabilecek bölümler.
7. **Offline mod (§17)** — react-query persist + AsyncStorage cache.

## Bu adımda eklenenler

- `navigation/types.ts`, `navigation/RootTabNavigator.tsx`
- `components/BottomSheet.tsx` — harici kütüphanesiz, yeniden kullanılabilir
  bottom sheet (ileride `@gorhom/bottom-sheet`'e geçilirse yalnızca bu dosya
  değişir, tüketen ekranlar etkilenmez)
- `features/map/screens/MapScreen.tsx`, `features/map/components/EarthquakeDetailSheetContent.tsx`
- `App.tsx` artık `NavigationContainer` içeriyor ve SafeQuake `ThemeProvider`'ı
  ile React Navigation temasını senkronize ediyor.

Her adımı ayrı, bağımsız commit'lenebilir bir PR olarak ele almanı öneririm;
sıradaki adım filtreleme (§9) — istersen onunla devam edelim.
