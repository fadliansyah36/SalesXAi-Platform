import type { MetadataRoute } from 'next';
import { salesxTokens } from '../../../packages/design-tokens/generated/native';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/principal/',
    name: 'SalesX-Ai — Principal Portal',
    short_name: 'Principal',
    description: 'Portal operasional principal SalesX-Ai.',
    start_url: '/principal/',
    scope: '/principal/',
    display: 'standalone',
    background_color: salesxTokens.primitives.color.neutral[50].$value,
    theme_color: salesxTokens.primitives.color.brand[600].$value,
    orientation: 'portrait-primary',
    icons: [
      { src: '/principal/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/principal/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/principal/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
