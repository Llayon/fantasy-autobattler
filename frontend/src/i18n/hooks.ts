/**
 * Custom i18n hooks for Fantasy Autobattler.
 * Provides convenient access to translations with type safety.
 * 
 * @fileoverview Custom hooks for internationalization.
 */

'use client';

import { useTranslations } from 'next-intl';

// =============================================================================
// NAMESPACE HOOKS
// =============================================================================

/**
 * Hook for common translations (loading, error, buttons, etc.).
 * 
 * @returns Translation function for common namespace
 * @example
 * const t = useCommonTranslations();
 * return <button>{t('save')}</button>;
 */
export function useCommonTranslations() {
  return useTranslations('common');
}

/**
 * Hook for navigation translations.
 * 
 * @returns Translation function for navigation namespace
 * @example
 * const t = useNavigationTranslations();
 * return <nav>{t('teamBuilder')}</nav>;
 */
export function useNavigationTranslations() {
  return useTranslations('navigation');
}

/**
 * Hook for team builder translations.
 * 
 * @returns Translation function for teamBuilder namespace
 * @example
 * const t = useTeamBuilderTranslations();
 * return <h1>{t('title')}</h1>;
 */
export function useTeamBuilderTranslations() {
  return useTranslations('teamBuilder');
}

/**
 * Hook for unit translations.
 * 
 * @returns Translation function for units namespace
 * @example
 * const t = useUnitTranslations();
 * return <span>{t('names.knight')}</span>;
 */
export function useUnitTranslations() {
  return useTranslations('units');
}

/**
 * Hook for synergy translations.
 * 
 * @returns Translation function for synergies namespace
 * @example
 * const t = useSynergyTranslations();
 * return <span>{t('types.frontline')}</span>;
 */
export function useSynergyTranslations() {
  return useTranslations('synergies');
}

/**
 * Hook for battle translations.
 * 
 * @returns Translation function for battle namespace
 * @example
 * const t = useBattleTranslations();
 * return <h1>{t('title')}</h1>;
 */
export function useBattleTranslations() {
  return useTranslations('battle');
}

/**
 * Hook for battle replay translations.
 * 
 * @returns Translation function for battleReplay namespace
 * @example
 * const t = useBattleReplayTranslations();
 * return <button>{t('play')}</button>;
 */
export function useBattleReplayTranslations() {
  return useTranslations('battleReplay');
}

/**
 * Hook for battle result translations.
 * 
 * @returns Translation function for battleResult namespace
 * @example
 * const t = useBattleResultTranslations();
 * return <h1>{t('victory')}</h1>;
 */
export function useBattleResultTranslations() {
  return useTranslations('battleResult');
}

/**
 * Hook for history page translations.
 * 
 * @returns Translation function for history namespace
 * @example
 * const t = useHistoryTranslations();
 * return <h1>{t('title')}</h1>;
 */
export function useHistoryTranslations() {
  return useTranslations('history');
}

/**
 * Hook for profile page translations.
 * 
 * @returns Translation function for profile namespace
 * @example
 * const t = useProfileTranslations();
 * return <h1>{t('title')}</h1>;
 */
export function useProfileTranslations() {
  return useTranslations('profile');
}

/**
 * Hook for error message translations.
 * 
 * @returns Translation function for errors namespace
 * @example
 * const t = useErrorTranslations();
 * return <p>{t('network')}</p>;
 */
export function useErrorTranslations() {
  return useTranslations('errors');
}

/**
 * Hook for grid-related translations.
 * 
 * @returns Translation function for grid namespace
 * @example
 * const t = useGridTranslations();
 * return <span>{t('playerZone')}</span>;
 */
export function useGridTranslations() {
  return useTranslations('grid');
}

/**
 * Hook for accessibility translations.
 * 
 * @returns Translation function for accessibility namespace
 * @example
 * const t = useAccessibilityTranslations();
 * return <span className="sr-only">{t('loading')}</span>;
 */
export function useAccessibilityTranslations() {
  return useTranslations('accessibility');
}
