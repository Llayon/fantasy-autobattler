/**
 * Internationalization configuration for Fantasy Autobattler.
 * Sets up next-intl with Russian as the default locale.
 * 
 * @fileoverview i18n configuration with locale detection and message loading.
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Supported locale codes.
 */
export type Locale = 'ru' | 'en';

/**
 * Locale configuration interface.
 */
export interface LocaleConfig {
  /** Locale code */
  code: Locale;
  /** Display name in the locale's language */
  name: string;
  /** Display name in English */
  nameEn: string;
  /** Flag emoji */
  flag: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default locale for the application.
 */
export const DEFAULT_LOCALE: Locale = 'ru';

/**
 * All supported locales.
 */
export const SUPPORTED_LOCALES: Locale[] = ['ru', 'en'];

/**
 * Locale configurations with display information.
 */
export const LOCALE_CONFIGS: Record<Locale, LocaleConfig> = {
  ru: {
    code: 'ru',
    name: 'Русский',
    nameEn: 'Russian',
    flag: '🇷🇺',
  },
  en: {
    code: 'en',
    name: 'English',
    nameEn: 'English',
    flag: '🇬🇧',
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a locale is supported.
 * 
 * @param locale - Locale code to check
 * @returns True if locale is supported
 * @example
 * isValidLocale('ru'); // true
 * isValidLocale('fr'); // false
 */
export function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

/**
 * Get locale from browser settings.
 * Falls back to default locale if browser locale is not supported.
 * 
 * @returns Detected or default locale
 * @example
 * const locale = getBrowserLocale();
 */
export function getBrowserLocale(): Locale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  // Try navigator.language first
  const browserLang = navigator.language.split('-')[0];
  if (browserLang && isValidLocale(browserLang)) {
    return browserLang;
  }

  // Try navigator.languages
  for (const lang of navigator.languages) {
    const code = lang.split('-')[0];
    if (code && isValidLocale(code)) {
      return code;
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * Get locale configuration by code.
 * 
 * @param locale - Locale code
 * @returns Locale configuration
 * @example
 * const config = getLocaleConfig('ru');
 * console.log(config.name); // 'Русский'
 */
export function getLocaleConfig(locale: Locale): LocaleConfig {
  return LOCALE_CONFIGS[locale];
}
