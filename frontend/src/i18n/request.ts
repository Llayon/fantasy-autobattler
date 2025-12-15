/**
 * Server-side i18n request configuration for next-intl.
 * Loads messages for the current locale on each request.
 * 
 * @fileoverview Request-scoped i18n configuration for Next.js App Router.
 */

import { getRequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, type Locale } from './config';

/**
 * Get messages for a specific locale.
 * Dynamically imports the message file for the requested locale.
 * 
 * @param locale - Locale code to load messages for
 * @returns Messages object for the locale
 */
async function getMessages(locale: Locale): Promise<Record<string, unknown>> {
  try {
    // Dynamic import of locale messages
    const messages = (await import(`../../messages/${locale}.json`)).default;
    return messages;
  } catch {
    // Fallback to default locale if requested locale not found
    const fallbackMessages = (await import(`../../messages/${DEFAULT_LOCALE}.json`)).default;
    return fallbackMessages;
  }
}

/**
 * Next-intl request configuration.
 * Called on each request to provide locale-specific messages.
 */
export default getRequestConfig(async () => {
  // For now, always use Russian locale
  // In the future, this can be extended to detect locale from:
  // - URL path (e.g., /ru/page, /en/page)
  // - Cookie
  // - Accept-Language header
  const locale: Locale = DEFAULT_LOCALE;

  return {
    locale,
    messages: await getMessages(locale),
  };
});
