/**
 * Internationalization formatters for Fantasy Autobattler.
 * Provides locale-aware number, date, and time formatting.
 * 
 * @fileoverview i18n formatting utilities for numbers, dates, and relative time.
 */

'use client';

import { useLocale } from 'next-intl';
import { useMemo } from 'react';
import { type Locale } from './config';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Number formatting options.
 */
interface NumberFormatOptions {
  /** Minimum number of fraction digits */
  minimumFractionDigits?: number;
  /** Maximum number of fraction digits */
  maximumFractionDigits?: number;
  /** Whether to use grouping separators */
  useGrouping?: boolean;
}

/**
 * Date formatting options.
 */
interface DateFormatOptions {
  /** Date style (full, long, medium, short) */
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  /** Time style (full, long, medium, short) */
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  /** Custom format options */
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
}

/**
 * Relative time formatting options.
 */
interface RelativeTimeOptions {
  /** Numeric style (always, auto) */
  numeric?: 'always' | 'auto';
  /** Style (long, short, narrow) */
  style?: 'long' | 'short' | 'narrow';
}

// =============================================================================
// LOCALE CONFIGURATIONS
// =============================================================================

/**
 * Locale-specific configurations for formatting.
 */
const LOCALE_CONFIGS: Record<Locale, {
  /** Intl locale identifier */
  intlLocale: string;
  /** Timezone */
  timeZone: string;
  /** Currency code */
  currency: string;
}> = {
  ru: {
    intlLocale: 'ru-RU',
    timeZone: 'Europe/Moscow',
    currency: 'RUB',
  },
  en: {
    intlLocale: 'en-US',
    timeZone: 'UTC',
    currency: 'USD',
  },
};

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook for number formatting with current locale.
 * 
 * @returns Number formatting functions
 * @example
 * const { formatNumber, formatPercent, formatInteger } = useNumberFormatter();
 * formatNumber(1234.56); // "1,234.56" (en) or "1 234,56" (ru)
 */
export function useNumberFormatter() {
  const locale = useLocale() as Locale;
  const config = LOCALE_CONFIGS[locale];

  return useMemo(() => {
    const numberFormatter = new Intl.NumberFormat(config.intlLocale);
    const percentFormatter = new Intl.NumberFormat(config.intlLocale, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    const integerFormatter = new Intl.NumberFormat(config.intlLocale, {
      maximumFractionDigits: 0,
    });

    return {
      /**
       * Format a number with locale-specific formatting.
       * 
       * @param value - Number to format
       * @param options - Formatting options
       * @returns Formatted number string
       * @example
       * formatNumber(1234.56); // "1,234.56"
       */
      formatNumber: (value: number, options?: NumberFormatOptions) => {
        if (options) {
          const formatter = new Intl.NumberFormat(config.intlLocale, options);
          return formatter.format(value);
        }
        return numberFormatter.format(value);
      },

      /**
       * Format a percentage with locale-specific formatting.
       * 
       * @param value - Decimal value (0.5 = 50%)
       * @returns Formatted percentage string
       * @example
       * formatPercent(0.75); // "75%"
       */
      formatPercent: (value: number) => percentFormatter.format(value),

      /**
       * Format an integer (no decimal places).
       * 
       * @param value - Number to format as integer
       * @returns Formatted integer string
       * @example
       * formatInteger(1234.56); // "1,235"
       */
      formatInteger: (value: number) => integerFormatter.format(value),

      /**
       * Format a currency value.
       * 
       * @param value - Amount to format
       * @param currency - Currency code (optional, uses locale default)
       * @returns Formatted currency string
       * @example
       * formatCurrency(1234.56); // "$1,234.56" (en) or "1 234,56 ₽" (ru)
       */
      formatCurrency: (value: number, currency?: string) => {
        const formatter = new Intl.NumberFormat(config.intlLocale, {
          style: 'currency',
          currency: currency || config.currency,
        });
        return formatter.format(value);
      },
    };
  }, [locale, config]);
}

/**
 * Hook for date and time formatting with current locale.
 * 
 * @returns Date formatting functions
 * @example
 * const { formatDate, formatTime, formatDateTime } = useDateFormatter();
 * formatDate(new Date()); // "Dec 15, 2025" (en) or "15 дек. 2025 г." (ru)
 */
export function useDateFormatter() {
  const locale = useLocale() as Locale;
  const config = LOCALE_CONFIGS[locale];

  return useMemo(() => {
    return {
      /**
       * Format a date with locale-specific formatting.
       * 
       * @param date - Date to format
       * @param options - Formatting options
       * @returns Formatted date string
       * @example
       * formatDate(new Date(), { dateStyle: 'medium' }); // "Dec 15, 2025"
       */
      formatDate: (date: Date, options?: DateFormatOptions) => {
        const formatter = new Intl.DateTimeFormat(config.intlLocale, {
          timeZone: config.timeZone,
          dateStyle: 'medium',
          ...options,
        });
        return formatter.format(date);
      },

      /**
       * Format a time with locale-specific formatting.
       * 
       * @param date - Date to format time from
       * @param options - Formatting options
       * @returns Formatted time string
       * @example
       * formatTime(new Date()); // "3:45 PM" (en) or "15:45" (ru)
       */
      formatTime: (date: Date, options?: DateFormatOptions) => {
        const formatter = new Intl.DateTimeFormat(config.intlLocale, {
          timeZone: config.timeZone,
          timeStyle: 'short',
          ...options,
        });
        return formatter.format(date);
      },

      /**
       * Format both date and time.
       * 
       * @param date - Date to format
       * @param options - Formatting options
       * @returns Formatted date and time string
       * @example
       * formatDateTime(new Date()); // "Dec 15, 2025, 3:45 PM"
       */
      formatDateTime: (date: Date, options?: DateFormatOptions) => {
        const formatter = new Intl.DateTimeFormat(config.intlLocale, {
          timeZone: config.timeZone,
          dateStyle: 'medium',
          timeStyle: 'short',
          ...options,
        });
        return formatter.format(date);
      },

      /**
       * Format a date range.
       * 
       * @param startDate - Start date
       * @param endDate - End date
       * @param options - Formatting options
       * @returns Formatted date range string
       * @example
       * formatDateRange(start, end); // "Dec 15 – 20, 2025"
       */
      formatDateRange: (startDate: Date, endDate: Date, options?: DateFormatOptions) => {
        const formatter = new Intl.DateTimeFormat(config.intlLocale, {
          timeZone: config.timeZone,
          dateStyle: 'medium',
          ...options,
        });
        return formatter.formatRange(startDate, endDate);
      },
    };
  }, [locale, config]);
}

/**
 * Hook for relative time formatting (e.g., "2 hours ago").
 * 
 * @returns Relative time formatting functions
 * @example
 * const { formatRelativeTime, formatTimeAgo } = useRelativeTimeFormatter();
 * formatTimeAgo(new Date(Date.now() - 3600000)); // "1 hour ago"
 */
export function useRelativeTimeFormatter() {
  const locale = useLocale() as Locale;
  const config = LOCALE_CONFIGS[locale];

  return useMemo(() => {
    const relativeTimeFormatter = new Intl.RelativeTimeFormat(config.intlLocale, {
      numeric: 'auto',
      style: 'long',
    });

    return {
      /**
       * Format relative time with specific unit.
       * 
       * @param value - Time value (negative for past, positive for future)
       * @param unit - Time unit
       * @param options - Formatting options
       * @returns Formatted relative time string
       * @example
       * formatRelativeTime(-2, 'hour'); // "2 hours ago"
       */
      formatRelativeTime: (
        value: number,
        unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year',
        options?: RelativeTimeOptions
      ) => {
        if (options) {
          const formatter = new Intl.RelativeTimeFormat(config.intlLocale, options);
          return formatter.format(value, unit);
        }
        return relativeTimeFormatter.format(value, unit);
      },

      /**
       * Format time ago from a specific date.
       * Automatically chooses the best unit (seconds, minutes, hours, etc.).
       * 
       * @param date - Past date to compare with now
       * @param options - Formatting options
       * @returns Formatted "time ago" string
       * @example
       * formatTimeAgo(new Date(Date.now() - 3600000)); // "1 hour ago"
       */
      formatTimeAgo: (date: Date, options?: RelativeTimeOptions) => {
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffSeconds = Math.round(diffMs / 1000);
        const diffMinutes = Math.round(diffMs / (1000 * 60));
        const diffHours = Math.round(diffMs / (1000 * 60 * 60));
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.round(diffMs / (1000 * 60 * 60 * 24 * 7));
        const diffMonths = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30));
        const diffYears = Math.round(diffMs / (1000 * 60 * 60 * 24 * 365));

        const formatter = options 
          ? new Intl.RelativeTimeFormat(config.intlLocale, options)
          : relativeTimeFormatter;

        // Choose appropriate unit based on magnitude
        if (Math.abs(diffYears) >= 1) {
          return formatter.format(diffYears, 'year');
        } else if (Math.abs(diffMonths) >= 1) {
          return formatter.format(diffMonths, 'month');
        } else if (Math.abs(diffWeeks) >= 1) {
          return formatter.format(diffWeeks, 'week');
        } else if (Math.abs(diffDays) >= 1) {
          return formatter.format(diffDays, 'day');
        } else if (Math.abs(diffHours) >= 1) {
          return formatter.format(diffHours, 'hour');
        } else if (Math.abs(diffMinutes) >= 1) {
          return formatter.format(diffMinutes, 'minute');
        } else {
          return formatter.format(diffSeconds, 'second');
        }
      },
    };
  }, [locale, config]);
}

/**
 * Hook for game-specific formatting utilities.
 * 
 * @returns Game-specific formatting functions
 * @example
 * const { formatDuration, formatRating, formatWinRate } = useGameFormatter();
 * formatDuration(125000); // "2:05" (2 minutes 5 seconds)
 */
export function useGameFormatter() {
  const { formatNumber, formatPercent, formatInteger } = useNumberFormatter();

  return useMemo(() => ({
    /**
     * Format battle duration in MM:SS format.
     * 
     * @param milliseconds - Duration in milliseconds
     * @returns Formatted duration string
     * @example
     * formatDuration(125000); // "2:05"
     */
    formatDuration: (milliseconds: number) => {
      const totalSeconds = Math.floor(milliseconds / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    /**
     * Format player rating with appropriate precision.
     * 
     * @param rating - Player rating
     * @returns Formatted rating string
     * @example
     * formatRating(1547.8); // "1,548"
     */
    formatRating: (rating: number) => formatInteger(Math.round(rating)),

    /**
     * Format win rate as percentage.
     * 
     * @param wins - Number of wins
     * @param total - Total number of games
     * @returns Formatted win rate string
     * @example
     * formatWinRate(7, 10); // "70%"
     */
    formatWinRate: (wins: number, total: number) => {
      if (total === 0) return '0%';
      return formatPercent(wins / total);
    },

    /**
     * Format unit stats with appropriate precision.
     * 
     * @param value - Stat value
     * @returns Formatted stat string
     * @example
     * formatStat(12.5); // "13" (rounded)
     */
    formatStat: (value: number) => formatInteger(Math.round(value)),

    /**
     * Format damage numbers for battle display.
     * 
     * @param damage - Damage amount
     * @returns Formatted damage string
     * @example
     * formatDamage(42); // "42"
     */
    formatDamage: (damage: number) => formatInteger(damage),

    /**
     * Format large numbers with K/M suffixes.
     * 
     * @param value - Number to format
     * @returns Formatted number with suffix
     * @example
     * formatLargeNumber(1500); // "1.5K"
     * formatLargeNumber(2500000); // "2.5M"
     */
    formatLargeNumber: (value: number) => {
      if (value >= 1000000) {
        return formatNumber(value / 1000000, { maximumFractionDigits: 1 }) + 'M';
      } else if (value >= 1000) {
        return formatNumber(value / 1000, { maximumFractionDigits: 1 }) + 'K';
      } else {
        return formatInteger(value);
      }
    },
  }), [formatNumber, formatPercent, formatInteger]);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get the current locale configuration.
 * 
 * @param locale - Locale code
 * @returns Locale configuration
 * @example
 * const config = getLocaleConfig('ru');
 * console.log(config.timeZone); // "Europe/Moscow"
 */
export function getLocaleConfig(locale: Locale) {
  return LOCALE_CONFIGS[locale];
}

/**
 * Check if a locale uses 24-hour time format.
 * 
 * @param locale - Locale code
 * @returns True if locale uses 24-hour format
 * @example
 * uses24HourFormat('ru'); // true
 * uses24HourFormat('en'); // false
 */
export function uses24HourFormat(locale: Locale): boolean {
  // Russian typically uses 24-hour format
  return locale === 'ru';
}

/**
 * Get the appropriate date format for a locale.
 * 
 * @param locale - Locale code
 * @param context - Context for the date (short, medium, long)
 * @returns Date format options
 * @example
 * const format = getDateFormat('ru', 'medium');
 */
export function getDateFormat(
  locale: Locale,
  context: 'short' | 'medium' | 'long' = 'medium'
): DateFormatOptions {
  const base: DateFormatOptions = {
    year: 'numeric',
    month: context === 'short' ? 'numeric' : 'short',
    day: 'numeric',
  };

  if (context === 'long') {
    base.month = 'long';
  }

  return base;
}