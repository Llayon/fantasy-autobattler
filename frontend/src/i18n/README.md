# Internationalization (i18n) Setup

## Overview

The Fantasy Autobattler project uses **next-intl** for internationalization, providing comprehensive support for multiple languages with type-safe translations, number/date formatting, and easy extensibility.

## Current Status ✅

### ✅ Completed Features

1. **Core i18n Infrastructure**
   - ✅ next-intl package installed and configured
   - ✅ Russian (ru) as default locale
   - ✅ English (en) translations complete
   - ✅ Type-safe translation hooks
   - ✅ Server-side rendering support

2. **Translation Files**
   - ✅ `messages/ru.json` - Complete Russian translations (672 strings)
   - ✅ `messages/en.json` - Complete English translations (672 strings)
   - ✅ Comprehensive coverage of all UI elements

3. **Custom Hooks**
   - ✅ Namespace-specific hooks (useCommonTranslations, useNavigationTranslations, etc.)
   - ✅ Type-safe parameter interpolation
   - ✅ Fallback handling for missing translations

4. **Formatting Utilities**
   - ✅ Number formatting (integers, decimals, percentages, currency)
   - ✅ Date/time formatting (locale-aware)
   - ✅ Relative time formatting ("2 hours ago")
   - ✅ Game-specific formatters (ratings, win rates, durations)

5. **Components**
   - ✅ LocaleSwitcher component (UI ready, switching logic placeholder)
   - ✅ i18n provider integration in layout
   - ✅ Test page for verification (`/test-i18n`)

## File Structure

```
frontend/src/i18n/
├── config.ts          # Locale configuration and utilities
├── hooks.ts           # Custom translation hooks
├── formatters.ts      # Number/date formatting utilities
├── provider.tsx       # Client-side i18n provider
├── request.ts         # Server-side configuration
├── index.ts           # Main exports
└── README.md          # This documentation

frontend/messages/
├── ru.json            # Russian translations (default)
└── en.json            # English translations

frontend/src/components/
└── LocaleSwitcher.tsx # Language selection component
```

## Usage Examples

### Basic Translations

```typescript
import { useCommonTranslations, useTeamBuilderTranslations } from '@/i18n';

function MyComponent() {
  const tCommon = useCommonTranslations();
  const tTeam = useTeamBuilderTranslations();
  
  return (
    <div>
      <h1>{tTeam('title')}</h1>
      <button>{tCommon('save')}</button>
    </div>
  );
}
```

### Interpolation

```typescript
// With parameters
const message = tTeam('budgetRemaining', { remaining: 15, total: 30 });
// Result: "Remaining: 15 of 30" (en) or "Осталось: 15 из 30" (ru)
```

### Number Formatting

```typescript
import { useNumberFormatter, useGameFormatter } from '@/i18n';

function StatsComponent() {
  const { formatNumber, formatPercent } = useNumberFormatter();
  const { formatRating, formatWinRate } = useGameFormatter();
  
  return (
    <div>
      <div>Score: {formatNumber(1234.56)}</div>
      <div>Win Rate: {formatWinRate(7, 10)}</div>
      <div>Rating: {formatRating(1547.8)}</div>
    </div>
  );
}
```

### Date Formatting

```typescript
import { useDateFormatter, useRelativeTimeFormatter } from '@/i18n';

function DateComponent() {
  const { formatDate, formatDateTime } = useDateFormatter();
  const { formatTimeAgo } = useRelativeTimeFormatter();
  
  const date = new Date();
  
  return (
    <div>
      <div>Date: {formatDate(date)}</div>
      <div>Last seen: {formatTimeAgo(date)}</div>
    </div>
  );
}
```

## Translation Namespaces

| Namespace | Hook | Description |
|-----------|------|-------------|
| `common` | `useCommonTranslations()` | Buttons, loading states, generic UI |
| `navigation` | `useNavigationTranslations()` | Menu items, navigation labels |
| `teamBuilder` | `useTeamBuilderTranslations()` | Team building interface |
| `units` | `useUnitTranslations()` | Unit names, roles, descriptions |
| `synergies` | `useSynergyTranslations()` | Synergy types and bonuses |
| `battle` | `useBattleTranslations()` | Battle interface, matchmaking |
| `battleReplay` | `useBattleReplayTranslations()` | Replay controls, events |
| `battleResult` | `useBattleResultTranslations()` | Victory/defeat messages |
| `history` | `useHistoryTranslations()` | Battle history page |
| `profile` | `useProfileTranslations()` | Player profile page |
| `errors` | `useErrorTranslations()` | Error messages |
| `grid` | `useGridTranslations()` | Grid-related labels |
| `accessibility` | `useAccessibilityTranslations()` | Screen reader labels |

## Locale Configuration

### Supported Locales

- **Russian (ru)** - Default locale, Europe/Moscow timezone
- **English (en)** - UTC timezone, US formatting

### Adding New Locales

1. Add locale to `SUPPORTED_LOCALES` in `config.ts`
2. Add locale configuration to `LOCALE_CONFIGS`
3. Create `messages/{locale}.json` with translations
4. Update formatter configurations in `formatters.ts`

```typescript
// config.ts
export const SUPPORTED_LOCALES: Locale[] = ['ru', 'en', 'fr']; // Add 'fr'

export const LOCALE_CONFIGS: Record<Locale, LocaleConfig> = {
  // ... existing locales
  fr: {
    code: 'fr',
    name: 'Français',
    nameEn: 'French',
    flag: '🇫🇷',
  },
};
```

## Testing

### Test Page
Visit `/test-i18n` to verify:
- ✅ All translation hooks work
- ✅ Number/date formatting is locale-appropriate
- ✅ Interpolation works correctly
- ✅ No missing translation keys
- ✅ Locale switcher UI (switching logic is placeholder)

### Verification Checklist

- [ ] All hardcoded strings replaced with translation calls
- [ ] No `[namespace.key]` fallbacks visible in UI
- [ ] Numbers format correctly for each locale
- [ ] Dates display in appropriate format
- [ ] Relative time works ("2 hours ago")
- [ ] Interpolation parameters work
- [ ] Error boundaries handle i18n errors gracefully

## Future Enhancements

### 🔄 Planned Features

1. **Dynamic Locale Switching**
   - URL-based locale detection (`/en/page`, `/ru/page`)
   - Cookie-based locale persistence
   - Automatic browser locale detection

2. **Advanced Features**
   - Pluralization rules for complex cases
   - RTL language support preparation
   - Translation management system integration
   - Lazy loading of translation files

3. **Developer Experience**
   - TypeScript types for translation keys
   - ESLint rules for hardcoded strings
   - Translation extraction tools
   - Missing translation detection

### Implementation Notes

- Current setup uses Russian as default to match existing UI
- Locale switching is prepared but not fully implemented (shows placeholder)
- All formatters respect locale-specific conventions
- Error handling prevents crashes from missing translations
- Server-side rendering fully supported

## Migration Guide

### Replacing Hardcoded Strings

```typescript
// ❌ Before
<button>Сохранить</button>
<h1>Создание команды</h1>

// ✅ After
const tCommon = useCommonTranslations();
const tTeam = useTeamBuilderTranslations();

<button>{tCommon('save')}</button>
<h1>{tTeam('title')}</h1>
```

### Number Formatting Migration

```typescript
// ❌ Before
const formatted = number.toLocaleString();

// ✅ After
const { formatNumber } = useNumberFormatter();
const formatted = formatNumber(number);
```

This i18n setup provides a solid foundation for internationalization while maintaining type safety and developer experience.