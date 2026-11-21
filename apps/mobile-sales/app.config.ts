import type { ExpoConfig } from 'expo/config';

const androidMapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();
const iosMapsKey = process.env.GOOGLE_MAPS_IOS_API_KEY?.trim();
const mapsPlugin = ['react-native-maps', {
  ...(androidMapsKey ? { androidGoogleMapsApiKey: androidMapsKey } : {}),
  ...(iosMapsKey ? { iosGoogleMapsApiKey: iosMapsKey } : {}),
}] as const;
const config: ExpoConfig = {
  name: 'SalesX-Ai Mobile Sales',
  slug: 'salesx-ai-mobile-sales',
  scheme: 'salesxai',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'id.salesxai.mobile',
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'SalesX-Ai menggunakan lokasi saat Anda memulai shift dan menjalankan kunjungan kerja.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'SalesX-Ai melanjutkan pelacakan selama sesi kerja yang Anda mulai dan setujui.',
      UIBackgroundModes: ['location'],
      NSPhotoLibraryUsageDescription: 'SalesX-Ai mengakses foto yang Anda pilih untuk bukti kunjungan.',
    },
  },
  android: {
    package: 'id.salesxai.mobile',
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION', 'ACCESS_BACKGROUND_LOCATION', 'FOREGROUND_SERVICE', 'FOREGROUND_SERVICE_LOCATION'],
  },
  assetBundlePatterns: ['**/*'],
  plugins: ['expo-location', 'expo-sqlite', 'expo-image-picker', 'expo-document-picker', mapsPlugin],
};
export default config;
