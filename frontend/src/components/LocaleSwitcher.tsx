/**
 * Locale switcher component for Fantasy Autobattler.
 * Allows users to switch between supported languages.
 * 
 * @fileoverview Language selection component with dropdown interface.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import {
  SUPPORTED_LOCALES,
  LOCALE_CONFIGS,
  type Locale
} from '@/i18n/config';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Locale switcher component props.
 */
interface LocaleSwitcherProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether to show as compact button (icon only) */
  compact?: boolean;
  /** Dropdown alignment */
  align?: 'left' | 'right';
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Locale switcher component with dropdown interface.
 * Allows users to switch between supported languages.
 * 
 * @param props - Component props
 * @returns Locale switcher component
 * @example
 * <LocaleSwitcher />
 * 
 * @example
 * // Compact version for mobile
 * <LocaleSwitcher compact align="right" />
 */
export function LocaleSwitcher({
  className = '',
  compact = false,
  align = 'left'
}: LocaleSwitcherProps) {
  const currentLocale = useLocale() as Locale;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentConfig = LOCALE_CONFIGS[currentLocale];

  /**
   * Handle locale change.
   * In a real implementation, this would update the URL or cookie.
   * For now, it's a placeholder for future implementation.
   * 
   * @param locale - New locale to switch to
   */
  const handleLocaleChange = (locale: Locale) => {
    setIsOpen(false);

    // TODO: Implement actual locale switching
    // This could involve:
    // 1. Updating URL path (e.g., /en/page, /ru/page)
    // 2. Setting a cookie
    // 3. Using router.push with locale parameter
    // 4. Triggering a page reload with new locale

    // eslint-disable-next-line no-console
    console.log(`Switching to locale: ${locale}`);

    // Placeholder: Show notification
    // In real implementation, this would trigger actual locale change
    alert(`Locale switching to ${LOCALE_CONFIGS[locale].name} will be implemented in future updates.`);
  };

  /**
   * Close dropdown when clicking outside.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    return undefined;
  }, [isOpen]);

  /**
   * Handle keyboard navigation.
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg
          bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white
          transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
          ${compact ? 'w-10 h-10 justify-center' : 'min-w-[120px]'}
        `}
        aria-label={compact ? `Current language: ${currentConfig.name}` : undefined}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-lg">{currentConfig.flag}</span>
        {!compact && (
          <>
            <span className="font-medium">{currentConfig.name}</span>
            <span className={`text-sm transition-transform ${isOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`
            absolute top-full mt-2 min-w-[160px] bg-gray-800 border border-gray-600 
            rounded-lg shadow-lg z-50 py-2
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
          role="listbox"
          aria-label="Select language"
          onKeyDown={handleKeyDown}
        >
          {SUPPORTED_LOCALES.map((locale) => {
            const config = LOCALE_CONFIGS[locale];
            const isSelected = locale === currentLocale;

            return (
              <button
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2 text-left
                  hover:bg-gray-700 transition-colors
                  ${isSelected
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                  }
                `}
                role="option"
                aria-selected={isSelected}
              >
                <span className="text-lg">{config.flag}</span>
                <div className="flex-1">
                  <div className="font-medium">{config.name}</div>
                  <div className="text-xs opacity-75">{config.nameEn}</div>
                </div>
                {isSelected && (
                  <span className="text-blue-300">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Compact locale switcher for mobile navigation.
 * 
 * @param props - Component props
 * @returns Compact locale switcher
 * @example
 * <CompactLocaleSwitcher />
 */
export function CompactLocaleSwitcher(props: Omit<LocaleSwitcherProps, 'compact'>) {
  return <LocaleSwitcher {...props} compact />;
}

/**
 * Hook to get current locale information.
 * 
 * @returns Current locale configuration and utilities
 * @example
 * const { locale, config, isRTL } = useCurrentLocale();
 */
export function useCurrentLocale() {
  const locale = useLocale() as Locale;
  const config = LOCALE_CONFIGS[locale];

  return {
    locale,
    config,
    isRTL: false, // None of our supported locales are RTL
    isDefault: locale === 'ru',
  };
}

export default LocaleSwitcher;