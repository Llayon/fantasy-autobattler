import type { Metadata } from 'next';
import './globals.css';
import { RootErrorBoundary } from '@/components/RootErrorBoundary';
import { AxeProvider } from '@/components/AxeProvider';

export const metadata: Metadata = {
  title: 'Fantasy Autobattler',
  description: 'Build your team and battle!',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="text-white min-h-screen">
        <AxeProvider>
          <RootErrorBoundary>
            {children}
          </RootErrorBoundary>
        </AxeProvider>
      </body>
    </html>
  );
}
