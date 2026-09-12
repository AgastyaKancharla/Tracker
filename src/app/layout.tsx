import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChronoTrack | Personal, Business & Client Hub',
  description: 'High-performance unified tracker for personal tasks, business operations, and client deliverables.',
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
