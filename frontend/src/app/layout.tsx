import type { Metadata } from 'next';
import './globals.css';
import { RootErrorBoundary } from '@/components/RootErrorBoundary';

export const metadata: Metadata = {
  title: 'Fantasy Autobattler',
  description: 'Build your team and battle!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="text-white min-h-screen">
        <RootErrorBoundary>
          {children}
        </RootErrorBoundary>
      </body>
    </html>
  );
}
