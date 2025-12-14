/**
 * Test page for enhanced Navigation component.
 * Tests mobile bottom tab bar, desktop top navigation, breadcrumbs, and keyboard shortcuts.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navigation, NavigationWrapper, useNavigation, useKeyboardNavigation, BreadcrumbItem } from '@/components/Navigation';

/**
 * Test page component for Navigation enhancements.
 */
export default function TestNavigationPage() {
  const [customBreadcrumbs, setCustomBreadcrumbs] = useState<BreadcrumbItem[] | undefined>(undefined);
  const { activeTab, breadcrumbs } = useNavigation();
  const { navigateToTab, shortcuts } = useKeyboardNavigation();

  const testBreadcrumbs: BreadcrumbItem[] = [
    { label: 'История', href: '/history', icon: '📚' },
    { label: 'Повтор боя #123', icon: '▶️' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Enhanced Navigation */}
      <Navigation breadcrumbs={customBreadcrumbs} />
      
      <NavigationWrapper>
        <div className="container mx-auto p-6">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              🧪 Enhanced Navigation Test
            </h1>
            <p className="text-gray-300 mb-4">
              Testing mobile bottom tab bar, desktop top navigation, breadcrumbs, and keyboard shortcuts
            </p>
            
            <Link 
              href="/"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              ← Back to Team Builder
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Navigation Features */}
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4">🎯 Navigation Features</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-blue-400 mb-2">Mobile Bottom Tab Bar</h3>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>✅ Fixed at bottom on mobile (&lt;640px)</p>
                      <p>✅ 4 icons: Команда, Бой, История, Профиль</p>
                      <p>✅ Active tab highlighted</p>
                      <p>✅ Badge on История (unviewed battles)</p>
                      <p>✅ Safe area support</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-green-400 mb-2">Desktop Top Navigation</h3>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>✅ Logo on left (clickable → home)</p>
                      <p>✅ Tabs in center</p>
                      <p>✅ Profile on right (avatar + name)</p>
                      <p>✅ Sticky header</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-purple-400 mb-2">Breadcrumbs</h3>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>✅ Auto-generated from URL</p>
                      <p>✅ Custom breadcrumbs support</p>
                      <p>✅ Icons and navigation</p>
                      <p>Current: {breadcrumbs.map(b => b.label).join(' → ')}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-yellow-400 mb-2">Keyboard Shortcuts</h3>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>✅ Keys 1-4 for tab navigation</p>
                      <p>✅ Tooltips show shortcuts on hover</p>
                      <p>✅ Works when not in input fields</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current State */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4">📊 Current State</h2>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-blue-400">Active Tab:</span>
                    <span className="ml-2">{activeTab?.label || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-blue-400">Current Path:</span>
                    <span className="ml-2 font-mono">/test-navigation</span>
                  </div>
                  <div>
                    <span className="text-blue-400">Breadcrumbs:</span>
                    <div className="ml-2 mt-1">
                      {breadcrumbs.map((crumb, index) => (
                        <span key={index} className="inline-flex items-center gap-1 mr-2">
                          {crumb.icon} {crumb.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Tests */}
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4">🎮 Interactive Tests</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Keyboard Shortcuts</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {shortcuts.map((shortcut) => (
                        <button
                          key={shortcut.key}
                          onClick={() => navigateToTab(shortcut.key)}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
                        >
                          {shortcut.key}: {shortcut.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Try pressing keys 1-4 on your keyboard!
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Custom Breadcrumbs</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setCustomBreadcrumbs(testBreadcrumbs)}
                        className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm transition-colors mr-2"
                      >
                        Set Battle Replay Breadcrumbs
                      </button>
                      <button
                        onClick={() => setCustomBreadcrumbs(undefined)}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
                      >
                        Reset to Auto
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Preview */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4">📱 Mobile Preview</h2>
                
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                  <div className="text-center text-sm text-gray-400 mb-4">
                    Mobile Bottom Tab Bar Preview
                  </div>
                  
                  {/* Mock mobile tab bar */}
                  <div className="bg-gray-800 rounded-lg border-t border-gray-600 p-2">
                    <div className="flex items-center justify-around">
                      {[
                        { icon: '⚔️', label: 'Команда', active: false },
                        { icon: '🎮', label: 'Бой', active: false },
                        { icon: '📚', label: 'История', active: false, badge: 3 },
                        { icon: '👤', label: 'Профиль', active: false },
                      ].map((tab, index) => (
                        <div
                          key={index}
                          className={`flex flex-col items-center text-xs px-2 py-2 rounded-lg ${
                            tab.active ? 'bg-blue-600 text-white' : 'text-gray-300'
                          } relative`}
                        >
                          <span className="text-lg">{tab.icon}</span>
                          <span className="mt-1">{tab.label}</span>
                          {tab.badge && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                              {tab.badge}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4">✅ Feature Checklist</h2>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>Mobile bottom tab bar (&lt;640px)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>Desktop top navigation with logo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>Player profile with avatar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>Auto-generated breadcrumbs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>Custom breadcrumbs support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>Keyboard shortcuts (1-4)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>Tooltip shortcuts on hover</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>Badge notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>Responsive design</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>Accessibility support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </NavigationWrapper>
    </div>
  );
}