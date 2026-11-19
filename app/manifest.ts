import type { MetadataRoute } from 'next';
import { salesxTokens } from '../packages/design-tokens/generated/native';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'SalesX-Ai — Smart Sales & Field Operations',
    short_name: 'SalesX-Ai',
    description:
      'Platform operasional penjualan, distribusi, GPS lapangan, SmartOrder, SmartReward, dan Staff AI terintegrasi.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: salesxTokens.primitives.color.neutral[50].$value,
    theme_color: salesxTokens.primitives.color.brand[600].$value,
    orientation: 'portrait-primary',
    icons: [
      { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
