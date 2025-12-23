/**
 * Test page for i18n functionality verification.
 * Demonstrates translation hooks, formatters, and locale switching.
 * 
 * @fileoverview i18n testing and verification page.
 */

'use client';

import { 
  useCommonTranslations,
  useNavigationTranslations,
  useTeamBuilderTranslations,
  useUnitTranslations,
  useBattleTranslations,
  useErrorTranslations,
  useNumberFormatter,
  useDateFormatter,
  useRelativeTimeFormatter,
  useGameFormatter,
} from '@/i18n';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';

/**
 * i18n test page component.
 * Tests all translation hooks and formatting utilities.
 * 
 * @returns Test page component
 */
export default function I18nTestPage() {
  // Translation hooks
  const tCommon = useCommonTranslations();
  const tNav = useNavigationTranslations();
  const tTeam = useTeamBuilderTranslations();
  const tUnits = useUnitTranslations();
  const tBattle = useBattleTranslations();
  const tErrors = useErrorTranslations();

  // Formatter hooks
  const { formatNumber, formatPercent, formatInteger, formatCurrency } = useNumberFormatter();
  const { formatDate, formatTime, formatDateTime } = useDateFormatter();
  const { formatTimeAgo, formatRelativeTime } = useRelativeTimeFormatter();
  const { formatDuration, formatRating, formatWinRate, formatStat } = useGameFormatter();

  // Test data
  const testDate = new Date('2025-12-15T15:30:00Z');
  const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">
            🌐 i18n Test Page
          </h1>
          <LocaleSwitcher />
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Translation Tests */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">
              📝 Translation Tests
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-300 mb-2">Common Translations</h3>
                <div className="text-sm space-y-1">
                  <div>Loading: <span className="text-yellow-300">{tCommon('loading')}</span></div>
                  <div>Save: <span className="text-yellow-300">{tCommon('save')}</span></div>
                  <div>Cancel: <span className="text-yellow-300">{tCommon('cancel')}</span></div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-300 mb-2">Navigation</h3>
                <div className="text-sm space-y-1">
                  <div>Team Builder: <span className="text-yellow-300">{tNav('teamBuilder')}</span></div>
                  <div>Battle: <span className="text-yellow-300">{tNav('battle')}</span></div>
                  <div>History: <span className="text-yellow-300">{tNav('history')}</span></div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-300 mb-2">Team Builder</h3>
                <div className="text-sm space-y-1">
                  <div>Title: <span className="text-yellow-300">{tTeam('title')}</span></div>
                  <div>Budget: <span className="text-yellow-300">{tTeam('budget')}</span></div>
                  <div>Start Battle: <span className="text-yellow-300">{tTeam('startBattle')}</span></div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-300 mb-2">Units</h3>
                <div className="text-sm space-y-1">
                  <div>Knight: <span className="text-yellow-300">{tUnits('names.knight')}</span></div>
                  <div>Mage: <span className="text-yellow-300">{tUnits('names.mage')}</span></div>
                  <div>Tank Role: <span className="text-yellow-300">{tUnits('roles.tank')}</span></div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-300 mb-2">Battle & Errors</h3>
                <div className="text-sm space-y-1">
                  <div>Searching: <span className="text-yellow-300">{tBattle('searching')}</span></div>
                  <div>Network Error: <span className="text-yellow-300">{tErrors('network')}</span></div>
                  <div>Not Found: <span className="text-yellow-300">{tErrors('notFound')}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Number Formatting Tests */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-400">
              🔢 Number Formatting
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-300 mb-2">Basic Numbers</h3>
                <div className="text-sm space-y-1">
                  <div>1234.56: <span className="text-yellow-300">{formatNumber(1234.56)}</span></div>
                  <div>Integer: <span className="text-yellow-300">{formatInteger(1234.56)}</span></div>
                  <div>Percent: <span className="text-yellow-300">{formatPercent(0.75)}</span></div>
                  <div>Currency: <span className="text-yellow-300">{formatCurrency(1234.56)}</span></div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-300 mb-2">Game Stats</h3>
                <div className="text-sm space-y-1">
                  <div>Rating: <span className="text-yellow-300">{formatRating(1547.8)}</span></div>
                  <div>Win Rate: <span className="text-yellow-300">{formatWinRate(7, 10)}</span></div>
                  <div>Stat: <span className="text-yellow-300">{formatStat(12.5)}</span></div>
                  <div>Duration: <span className="text-yellow-300">{formatDuration(125000)}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Date Formatting Tests */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-purple-400">
              📅 Date Formatting
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-300 mb-2">Date & Time</h3>
                <div className="text-sm space-y-1">
                  <div>Date: <span className="text-yellow-300">{formatDate(testDate)}</span></div>
                  <div>Time: <span className="text-yellow-300">{formatTime(testDate)}</span></div>
                  <div>DateTime: <span className="text-yellow-300">{formatDateTime(testDate)}</span></div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-300 mb-2">Relative Time</h3>
                <div className="text-sm space-y-1">
                  <div>2 hours ago: <span className="text-yellow-300">{formatTimeAgo(pastDate)}</span></div>
                  <div>In 1 day: <span className="text-yellow-300">{formatRelativeTime(1, 'day')}</span></div>
                  <div>3 minutes ago: <span className="text-yellow-300">{formatRelativeTime(-3, 'minute')}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Interpolation Tests */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-orange-400">
              🔗 Interpolation Tests
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-300 mb-2">Dynamic Values</h3>
                <div className="text-sm space-y-1">
                  <div>
                    Budget: <span className="text-yellow-300">
                      {tTeam('budgetRemaining', { remaining: 15, total: 30 })}
                    </span>
                  </div>
                  <div>
                    Exceeded: <span className="text-yellow-300">
                      {tTeam('budgetExceeded', { amount: 5 })}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-300 mb-2">Rich Content</h3>
                <div className="text-sm space-y-1">
                  <div>
                    Round: <span className="text-yellow-300">
                      {tBattle('round', { number: 5 })}
                    </span>
                  </div>
                  <div>
                    Wait Time: <span className="text-yellow-300">
                      {tBattle('waitTime', { time: '2:30' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-900/30 border border-blue-500 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3 text-blue-300">
            🧪 Test Instructions
          </h2>
          <div className="text-sm text-blue-200 space-y-2">
            <p>1. Use the locale switcher above to test language switching (placeholder functionality)</p>
            <p>2. Verify all translations display correctly in the current locale</p>
            <p>3. Check that numbers and dates format according to locale conventions</p>
            <p>4. Test interpolation with dynamic values</p>
            <p>5. Ensure no missing translation keys show as [namespace.key] format</p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            ← {tCommon('back')} {tCommon('home')}
          </a>
        </div>
      </div>
    </div>
  );
}