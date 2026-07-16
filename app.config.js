// app.json yerine app.config.js kullanıyoruz: Google Maps API anahtarı gibi
// hassas değerler artık kaynak koda gömülmüyor, process.env üzerinden
// okunuyor (.env -> EXPO_PUBLIC_GOOGLE_MAPS_API_KEY).
module.exports = ({ config }) => ({
  ...config,
  expo: {
    name: "SafeQuake",
    slug: "safequake",
    scheme: "safequake",
    version: "0.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.safequake.app",
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "SafeQuake, yakınınızdaki depremleri ve güvenli alanları gösterebilmek için konumunuza ihtiyaç duyar.",
        UIBackgroundModes: ["remote-notification"],
      },
    },
    android: {
      package: "com.safequake.app",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FAFAFA",
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
      ],
      config: {
        googleMaps: {
          // ÖNEMLİ: Eskiden bu dosyada (app.json) düz metin olarak duran
          // gerçek bir Google Maps API anahtarı vardı. Artık .env'den
          // okunuyor. O anahtarı Google Cloud Console'dan MUTLAKA
          // döndür/rotate et ve yeni anahtara Android paket adı (SHA-1) /
          // iOS bundle ID kısıtlaması ekle — bkz. README "Güvenlik" bölümü.
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "SafeQuake, yakınınızdaki depremleri gösterebilmek için konumunuzu kullanır.",
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#2E7D32",
        },
      ],
      "expo-asset",
      "expo-font",
      "expo-secure-store",
      [
        "expo-splash-screen",
        {
          image: "./assets/splash.png",
          resizeMode: "contain",
          backgroundColor: "#FAFAFA",
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "7bf54350-c1c6-4354-85e2-6654cc1cf04e",
      },
    },
    owner: "burakberkayak",
  },
});
