import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChronoTrack | Personal, Business & Client Hub',
  description: 'High-performance unified tracker for personal tasks, business operations, and client deliverables.',
  manifest: '/manifest.webmanifest',
  applicationName: 'ChronoTrack',
  appleWebApp: { capable: true, title: 'ChronoTrack', statusBarStyle: 'default' },
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#171717',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-800 min-h-screen antialiased selection:bg-neutral-600/20 selection:text-black">
        {children}
      </body>
    </html>
  );
}
