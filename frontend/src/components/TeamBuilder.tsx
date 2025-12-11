/**
 * Legacy TeamBuilder component for Fantasy Autobattler.
 * 
 * @fileoverview Placeholder component for legacy team builder functionality.
 * The main team builder is now implemented in app/page.tsx.
 * @deprecated Use app/page.tsx for the main team builder interface.
 */

'use client';

import { Player } from '@/types/game';

/**
 * TeamBuilder component props.
 */
interface TeamBuilderProps {
  /** Player profile data */
  player?: Player | null;
}

/**
 * Legacy TeamBuilder component.
 * This is a placeholder - the main team builder is in app/page.tsx.
 * 
 * @param props - Component props
 * @returns Legacy team builder component
 * @example
 * <TeamBuilder player={player} />
 */
export function TeamBuilder({ player }: TeamBuilderProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">⚔️ Fantasy Autobattler</h1>
        {player && (
          <p className="text-gray-300 mb-6">
            {player.name} | Wins: {player.stats.wins} | Losses: {player.stats.losses}
          </p>
        )}
        
        <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-6 mb-6">
          <div className="text-yellow-300 mb-2">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-medium text-yellow-300 mb-2">
            Legacy Component
          </h3>
          <p className="text-yellow-200 text-sm">
            This is a legacy component. The main team builder interface is now available at the home page.
          </p>
        </div>
        
        <div className="mt-6">
          <a
            href="/"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors inline-block"
          >
            Go to Team Builder
          </a>
        </div>
      </div>
    </div>
  );
}