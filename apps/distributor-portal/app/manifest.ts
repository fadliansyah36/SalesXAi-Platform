import type { MetadataRoute } from 'next';
import { salesxTokens } from '../../../packages/design-tokens/generated/native';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/distributor/',
    name: 'SalesX-Ai — Distributor Portal',
    short_name: 'Distributor',
    description: 'Portal operasional distributor SalesX-Ai.',
    start_url: '/distributor/',
    scope: '/distributor/',
    display: 'standalone',
    background_color: salesxTokens.primitives.color.neutral[50].$value,
    theme_color: salesxTokens.primitives.color.brand[600].$value,
    orientation: 'portrait-primary',
    icons: [
      { src: '/distributor/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/distributor/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/distributor/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
