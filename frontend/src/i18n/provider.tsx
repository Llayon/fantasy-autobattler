/**
 * Internationalization provider for Fantasy Autobattler.
 * Wraps the application with next-intl context.
 * 
 * @fileoverview Client-side i18n provider component.
 */

'use client';

import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl';
import { ReactNode } from 'react';
import { DEFAULT_LOCALE, type Locale } from './config';

// =============================================================================
// TYPES
// =============================================================================

/**
 * I18n provider props.
 */
interface I18nProviderProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Locale code */
  locale?: Locale;
  /** Messages for the locale */
  messages: AbstractIntlMessages;
  /** Timezone for date formatting */
  timeZone?: string;
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * I18n provider component that wraps the application.
 * Provides translation context to all child components.
 * 
 * @param props - Provider props
 * @returns Provider component wrapping children
 * @example
 * <I18nProvider locale="ru" messages={messages}>
 *   <App />
 * </I18nProvider>
 */
export function I18nProvider({
  children,
  locale = DEFAULT_LOCALE,
  messages,
  timeZone = 'Europe/Moscow',
}: I18nProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={timeZone}
      // Error handling for missing translations
      onError={(error) => {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          // Silently handle missing translations in development
          // This prevents console spam while still allowing the app to work
          void error;
        }
      }}
      // Return the key as fallback for missing translations
      getMessageFallback={({ namespace, key }) => {
        const fullKey = namespace ? `${namespace}.${key}` : key;
        return `[${fullKey}]`;
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}

export default I18nProvider;
