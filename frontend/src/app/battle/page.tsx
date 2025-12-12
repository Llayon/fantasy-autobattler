/**
 * Battle page for Fantasy Autobattler.
 * Main battle interface (placeholder for future implementation).
 * 
 * @fileoverview Battle page placeholder with navigation integration.
 */

'use client';

import { Navigation, NavigationWrapper } from '@/components/Navigation';

/**
 * Battle page component.
 * Currently a placeholder - will be implemented in future steps.
 * 
 * @returns Battle page
 * @example
 * <BattlePage />
 */
export default function BattlePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <div className="p-4 border-b border-gray-700">
        <div className="max-w-4xl mx-auto">
          <Navigation />
        </div>
      </div>
      
      <NavigationWrapper>
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">🎮 Бой</h1>
            <p className="text-gray-400">
              Страница боя будет реализована в следующих шагах
            </p>
          </div>

          {/* Placeholder content */}
          <div className="text-center py-16">
            <div className="text-8xl mb-4">🚧</div>
            <h3 className="text-2xl font-bold text-gray-400 mb-2">
              В разработке
            </h3>
            <p className="text-gray-500 mb-8">
              Эта страница будет содержать интерфейс для проведения боёв
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-3xl mb-2">⚔️</div>
                <h4 className="font-bold mb-2">PvP Бои</h4>
                <p className="text-sm text-gray-400">
                  Сражения с другими игроками в реальном времени
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-3xl mb-2">🤖</div>
                <h4 className="font-bold mb-2">Бои с ботами</h4>
                <p className="text-sm text-gray-400">
                  Тренировочные бои против ИИ противников
                </p>
              </div>
            </div>
          </div>
        </div>
      </NavigationWrapper>
    </div>
  );
}