/**
 * Internationalization module exports for Fantasy Autobattler.
 * 
 * @fileoverview Central export point for i18n utilities and components.
 */

// Configuration exports
export {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  LOCALE_CONFIGS,
  isValidLocale,
  getBrowserLocale,
  getLocaleConfig,
  type Locale,
  type LocaleConfig,
} from './config';

// Provider export
export { I18nProvider } from './provider';

// Custom hooks exports
export {
  useCommonTranslations,
  useNavigationTranslations,
  useTeamBuilderTranslations,
  useUnitTranslations,
  useSynergyTranslations,
  useBattleTranslations,
  useBattleReplayTranslations,
  useBattleResultTranslations,
  useHistoryTranslations,
  useProfileTranslations,
  useErrorTranslations,
  useGridTranslations,
  useAccessibilityTranslations,
} from './hooks';

// Re-export next-intl hooks for convenience
export { useTranslations, useLocale, useMessages, useTimeZone } from 'next-intl';
