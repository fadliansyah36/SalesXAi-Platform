import type { MetadataRoute } from 'next';
import { salesxTokens } from '../../../packages/design-tokens/generated/native';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/supervisor/',
    name: 'SalesX-Ai — Supervisor Portal',
    short_name: 'Supervisor',
    description: 'Portal operasional supervisor SalesX-Ai.',
    start_url: '/supervisor/',
    scope: '/supervisor/',
    display: 'standalone',
    background_color: salesxTokens.primitives.color.neutral[50].$value,
    theme_color: salesxTokens.primitives.color.brand[600].$value,
    orientation: 'portrait-primary',
    icons: [
      { src: '/supervisor/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/supervisor/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/supervisor/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
