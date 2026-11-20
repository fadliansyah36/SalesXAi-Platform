import type { MetadataRoute } from 'next';
import { salesxTokens } from '../../../packages/design-tokens/generated/native';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/admin/',
    name: 'SalesX-Ai — Super Admin',
    short_name: 'Admin',
    description: 'Portal administrasi platform SalesX-Ai.',
    start_url: '/admin/',
    scope: '/admin/',
    display: 'standalone',
    background_color: salesxTokens.primitives.color.neutral[50].$value,
    theme_color: salesxTokens.primitives.color.brand[600].$value,
    orientation: 'portrait-primary',
    icons: [
      { src: '/admin/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/admin/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/admin/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
