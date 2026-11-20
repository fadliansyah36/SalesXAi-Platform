import type { ExpoConfig } from 'expo/config';
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
      NSPhotoLibraryUsageDescription: 'SalesX-Ai mengakses foto yang Anda pilih untuk bukti kunjungan.',
    },
  },
  android: {
    package: 'id.salesxai.mobile',
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
  },
  assetBundlePatterns: ['**/*'],
  plugins: ['expo-location', 'expo-sqlite', 'expo-image-picker'],
};
export default config;
