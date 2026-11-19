import type { ExpoConfig } from 'expo/config';
const config: ExpoConfig = {
  name: 'SalesX-Ai Mobile Sales', slug: 'salesx-ai-mobile-sales', scheme: 'salesxai', version: '1.0.0',
  orientation: 'portrait', userInterfaceStyle: 'automatic',
  ios: { bundleIdentifier: 'id.salesxai.mobile', supportsTablet: true },
  android: { package: 'id.salesxai.mobile' },
  assetBundlePatterns: ['**/*'],
};
export default config;
