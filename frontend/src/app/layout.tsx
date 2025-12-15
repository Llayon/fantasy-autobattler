import type { Metadata, Viewport } from 'next';
import { getMessages, getLocale } from 'next-intl/server';
import './globals.css';
import { RootErrorBoundary } from '@/components/RootErrorBoundary';
import { AxeProvider } from '@/components/AxeProvider';
import { I18nProvider } from '@/i18n';

export const metadata: Metadata = {
  title: 'Fantasy Autobattler',
  description: 'Build your team and battle!',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

/**
 * Root layout component for the application.
 * Provides i18n context, error boundary, and accessibility tools.
 * 
 * @param props - Layout props with children
 * @returns Root layout wrapping all pages
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get locale and messages for i18n
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="text-white min-h-screen">
        <I18nProvider locale={locale as 'ru' | 'en'} messages={messages}>
          <AxeProvider>
            <RootErrorBoundary>
              {children}
            </RootErrorBoundary>
          </AxeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
