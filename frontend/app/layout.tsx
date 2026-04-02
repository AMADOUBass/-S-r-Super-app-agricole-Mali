// Layout global Next.js 14
// Configure les métadonnées PWA, les polices et les providers globaux

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Sɔrɔ — Marché Agricole Mali',
  description: 'Vendez et achetez vos récoltes au meilleur prix. Connecte agriculteurs et acheteurs au Mali.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sɔrɔ',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    title: 'Sɔrɔ — Marché Agricole Mali',
    description: 'Vendez vos récoltes au bon prix',
    locale: 'fr_ML',
  },
};

export const viewport: Viewport = {
  themeColor: '#2D6A4F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // évite le zoom accidentel sur mobile
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="bg-soro-fond text-soro-texte font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
