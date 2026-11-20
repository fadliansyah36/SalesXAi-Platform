import type { MetadataRoute } from 'next';
import { salesxTokens } from '../../../packages/design-tokens/generated/native';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/sales/',
    name: 'SalesX-Ai — Sales Portal',
    short_name: 'Sales',
    description: 'Portal operasional sales SalesX-Ai.',
    start_url: '/sales/',
    scope: '/sales/',
    display: 'standalone',
    background_color: salesxTokens.primitives.color.neutral[50].$value,
    theme_color: salesxTokens.primitives.color.brand[600].$value,
    orientation: 'portrait-primary',
    icons: [
      { src: '/sales/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/sales/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/sales/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
