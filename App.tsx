// Expo'nun varsayılan giriş noktası (node_modules/expo/AppEntry.js) proje
// KÖKÜNDEKİ App dosyasını arar. Gerçek uygulama kompozisyonu (provider'lar,
// navigasyon) src/app/App.tsx içinde tutulur (feature-based yapı ile
// tutarlı olması için); bu dosya sadece oraya yönlendirir.
export { default } from './src/bootstrap/App';
