import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#348CB2',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'SalesX-Ai — Smart Sales, Distribution & Field Operations Platform',
  description:
    'Platform operasional penjualan dan distribusi berbasis AI yang menghubungkan tim sales lapangan, outlet, SmartOrder, SmartReward, Realtime GPS, dan Staff AI SalesX-Ai.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SalesX-Ai',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'SalesX-Ai — Smart Sales, Distribution & Field Operations Platform',
    description:
      'Kelola tim sales, pantau aktivitas lapangan secara real-time, percepat pemesanan, dan optimalkan kinerja dengan Staff AI SalesX-Ai.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SalesX-Ai — Smart Sales & Field Operations',
    description:
      'Platform Sales Cerdas untuk Pertumbuhan Bisnis Anda — SmartTeam, SmartOrder, SmartReward, Realtime GPS & AI Assistant.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
