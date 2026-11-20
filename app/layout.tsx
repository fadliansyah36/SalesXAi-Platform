import type { Metadata, Viewport } from "next";
import "./globals.css";
import { salesxTokens } from "../packages/design-tokens/generated/native";
import { AppProviders } from "@/components/providers/AppProviders";

export const viewport: Viewport = {
  themeColor: salesxTokens.primitives.color.brand[600].$value,
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "SalesX-Ai — Smart Sales, Distribution & Field Operations Platform",
  description:
    "Platform operasional penjualan dan distribusi berbasis AI yang menghubungkan tim sales lapangan, outlet, SmartOrder, SmartReward, Realtime GPS, dan Staff AI SalesX-Ai.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SalesX-Ai",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "SalesX-Ai — Smart Sales, Distribution & Field Operations Platform",
    description:
      "Kelola tim sales, pantau aktivitas lapangan secara real-time, percepat pemesanan, dan optimalkan kinerja dengan Staff AI SalesX-Ai.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SalesX-Ai — Smart Sales & Field Operations",
    description:
      "Platform Sales Cerdas untuk Pertumbuhan Bisnis Anda — SmartTeam, SmartOrder, SmartReward, Realtime GPS & AI Assistant.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
