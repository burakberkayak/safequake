# SafeQuake

Türkiye için deprem bilgilendirme ve acil durum uygulaması (React Native +
Expo + TypeScript).

## Kurulum

```bash
npm install
npx expo prebuild --clean   # native projeyi (yeniden) üret
npx expo run:android        # ya da run:ios
```

`react-native-maps` / Google Maps artık **kullanılmıyor** — harita render'ı
için Google Cloud'da hesap/kart/API anahtarı gerekmiyor.

## Bu turda yapılan değişiklikler

### 🗺️ Google Maps → MapLibre + OpenFreeMap (tamamen ücretsiz)
- `react-native-maps` kaldırıldı, yerine `@maplibre/maplibre-react-native`
  (açık kaynak, MapLibre Native tabanlı) geldi.
- Harita stili/tile'ları [OpenFreeMap](https://openfreemap.org)'ten geliyor
  (`https://tiles.openfreemap.org/styles/positron`) — **API anahtarı
  gerekmiyor, kullanım sınırı yok, kart eklemene gerek yok**.
- `app.config.js`'deki `android.config.googleMaps` bloğu ve
  `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` tamamen kaldırıldı.
- Koordinat sırasına dikkat: MapLibre `[longitude, latitude]` kullanır,
  react-native-maps'in `{latitude, longitude}` nesnesinden farklı — tüm
  `MapScreen.tsx` buna göre güncellendi (Camera `flyTo`, `Marker lngLat`).
- `npx expo prebuild` ile native tarafta doğrulandı: `AndroidManifest.xml`'de
  artık Google Maps referansı yok.

### 📍 Google Places → OpenStreetMap Overpass API (tamamen ücretsiz)
- Hastane/eczane/toplanma alanı verisi artık Google Places yerine
  **Overpass API** (`overpass-api.de`) üzerinden, OpenStreetMap verisiyle
  geliyor — anahtarsız, ücretsiz.
- **Bilinen sınırlama:** Veri kalitesi OSM katkıcılarına bağlı; büyük
  şehirlerde iyi, küçük yerleşimlerde eksik olabilir. Toplanma alanları
  `emergency=assembly_point` etiketiyle aranıyor — bu etiket Google'ın hiç
  sunmadığı, OSM'e özgü bir kategori, dolayısıyla bazı bölgelerde önceki
  Google Text Search'ten daha iyi/kötü sonuç verebilir.
- Overpass paylaşımlı/ücretsiz bir servis olduğu için `MapScreen.tsx`'teki
  1500ms debounce korundu (nazik kullanım / rate limiting).

### 🐛 Filtreleme hatası düzeltildi
- **Kök sebep:** `MapScreen.tsx`, Ana Sayfa'daki filtre state'ini
  (büyüklük/yarıçap/zaman aralığı) hiç okumuyordu; `useEarthquakes({
  timeRange: '7d' })` olarak sabit kodlanmıştı. Ana Sayfa'da filtre
  değiştirdiğinde Harita bunu tamamen yok sayıyordu.
- Artık `useAppSelector((state) => state.filters.filters)` ile Redux'tan
  okunuyor — iki ekran tutarlı.

### 🧹 Şablon kalıntıları temizlendi
Repoda tekrar `create-expo-app` varsayılan şablonundan kalma ölü dosyalar
vardı (`hint-row.tsx`, `themed-text.tsx`, `themed-view.tsx`,
`use-color-scheme.ts`, `use-theme.ts`, `constants/theme.ts`, `global.css`,
`scripts/reset-project.js`, kullanılmayan `assets/images/*` ve
`assets/expo.icon/*`) — hiçbiri gerçek kodda import edilmiyordu, silindi.
Ayrıca kök dizinde `r.json()).then(console.log)` adında, muhtemelen bir
araç/agent hatasından kalma anlamsız bir dosya vardı — silindi.

## Bilinen eksikler (önceki turlardan, hâlâ geçerli)

- SecureStore boyut limiti (iOS Keychain ~2KB/kayıt) hiç test edilmedi
- Places/Overpass hata durumunda kullanıcıya net bir "tekrar dene" UI'ı yok
  (konsola log basıp sessizce boş liste dönüyor)
- Rate limiting sadece Overpass için var (debounce); AFAD/Kandilli API'sine
  karşı yok
