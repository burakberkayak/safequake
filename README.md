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
