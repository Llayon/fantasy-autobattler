/**
 * SavedTeamsPanel Test Page for Fantasy Autobattler.
 * Tests both modal and sidebar variants with mock data.
 * 
 * @fileoverview Comprehensive testing interface for SavedTeamsPanel component.
 */

'use client';

import { useState, useEffect } from 'react';
import { SavedTeamsPanel } from '@/components/SavedTeamsPanel';
import { TeamResponse } from '@/types/game';
import { useTeamStore } from '@/store/teamStore';

// Mock team data for testing
const mockTeams: TeamResponse[] = [
  {
    id: '1',
    name: 'Tank Squad',
    totalCost: 28,
    units: [
      { unitId: 'knight', position: { x: 0, y: 0 }, cost: 5, name: 'Knight', role: 'tank' },
      { unitId: 'guardian', position: { x: 1, y: 0 }, cost: 6, name: 'Guardian', role: 'tank' },
      { unitId: 'archer', position: { x: 2, y: 0 }, cost: 4, name: 'Archer', role: 'ranged_dps' },
      { unitId: 'mage', position: { x: 3, y: 0 }, cost: 5, name: 'Mage', role: 'mage' },
      { unitId: 'priest', position: { x: 4, y: 0 }, cost: 4, name: 'Priest', role: 'support' },
      { unitId: 'rogue', position: { x: 0, y: 1 }, cost: 4, name: 'Rogue', role: 'melee_dps' },
    ],
    isActive: false,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'DPS Rush',
    totalCost: 30,
    units: [
      { unitId: 'assassin', position: { x: 0, y: 0 }, cost: 6, name: 'Assassin', role: 'melee_dps' },
      { unitId: 'duelist', position: { x: 1, y: 0 }, cost: 5, name: 'Duelist', role: 'melee_dps' },
      { unitId: 'archer', position: { x: 2, y: 0 }, cost: 4, name: 'Archer', role: 'ranged_dps' },
      { unitId: 'crossbowman', position: { x: 3, y: 0 }, cost: 5, name: 'Crossbowman', role: 'ranged_dps' },
      { unitId: 'warlock', position: { x: 4, y: 0 }, cost: 6, name: 'Warlock', role: 'mage' },
      { unitId: 'rogue', position: { x: 0, y: 1 }, cost: 4, name: 'Rogue', role: 'melee_dps' },
    ],
    isActive: true,
    createdAt: '2024-01-14T15:45:00Z',
    updatedAt: '2024-01-14T15:45:00Z',
  },
  {
    id: '3',
    name: 'Magic Control',
    totalCost: 25,
    units: [
      { unitId: 'enchanter', position: { x: 0, y: 0 }, cost: 7, name: 'Enchanter', role: 'control' },
      { unitId: 'mage', position: { x: 1, y: 0 }, cost: 5, name: 'Mage', role: 'mage' },
      { unitId: 'elementalist', position: { x: 2, y: 0 }, cost: 6, name: 'Elementalist', role: 'mage' },
      { unitId: 'priest', position: { x: 3, y: 0 }, cost: 4, name: 'Priest', role: 'support' },
      { unitId: 'knight', position: { x: 0, y: 1 }, cost: 3, name: 'Knight', role: 'tank' },
    ],
    isActive: false,
    createdAt: '2024-01-13T09:20:00Z',
    updatedAt: '2024-01-13T09:20:00Z',
  },
];

/**
 * SavedTeamsPanel Test Page component.
 * Provides interactive testing for both variants.
 * 
 * @returns SavedTeamsPanel test page component
 */
export default function SavedTeamsPanelTestPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamResponse | null>(null);

  // Mock the teamStore for testing
  useEffect(() => {
    // Use Zustand's setState to directly set mock data for testing
    useTeamStore.setState({
      teams: mockTeams,
      activeTeam: mockTeams.find(t => t.isActive) || null,
      loading: false,
      error: null,
    });
  }, []);

  const handleLoadTeam = (team: TeamResponse) => {
    setSelectedTeam(team);
    console.log('Team loaded:', team.name);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">📋 SavedTeamsPanel Test Suite</h1>
          <p className="text-gray-400">
            Test both modal and sidebar variants with enhanced functionality
          </p>
        </div>

        {/* Controls */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">🎛️ Controls</h2>
          
          <div className="flex gap-4">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              Open Modal Variant
            </button>
            
            <button
              onClick={() => setSelectedTeam(null)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
            >
              Clear Selection
            </button>
          </div>
          
          {selectedTeam && (
            <div className="mt-4 p-3 bg-green-900/30 border border-green-500 rounded-lg">
              <div className="text-green-300">
                <div className="font-medium">Selected Team: {selectedTeam.name}</div>
                <div className="text-sm opacity-80">
                  Cost: {selectedTeam.totalCost}/30 | Units: {selectedTeam.units.length}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Layout Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sidebar Variant */}
          <div>
            <h2 className="text-xl font-bold mb-4">📱 Sidebar Variant</h2>
            <div className="bg-gray-800/30 p-4 rounded-lg">
              <SavedTeamsPanel
                variant="sidebar"
                onLoadTeam={handleLoadTeam}
                className="max-h-[600px]"
              />
            </div>
          </div>

          {/* Features List */}
          <div>
            <h2 className="text-xl font-bold mb-4">✨ Features</h2>
            
            <div className="space-y-4">
              {/* Variant Features */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">Variants</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• <strong>Modal:</strong> Full-screen overlay with close button</li>
                  <li>• <strong>Sidebar:</strong> Compact panel for integration</li>
                </ul>
              </div>

              {/* Team Display Features */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">Team Display</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• <strong>Editable Name:</strong> Click to edit inline</li>
                  <li>• <strong>Budget Indicator:</strong> Compact with color coding</li>
                  <li>• <strong>Role Icons:</strong> Visual role composition (🛡️⚔️🏹)</li>
                  <li>• <strong>Mini Grid:</strong> 8×2 preview of unit positions</li>
                </ul>
              </div>

              {/* Actions Features */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">Actions</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• <strong>Star Favorite:</strong> ⭐ for quick access</li>
                  <li>• <strong>Load Team:</strong> 📝 into editor</li>
                  <li>• <strong>Activate:</strong> ✅ for matchmaking</li>
                  <li>• <strong>Delete:</strong> 🗑️ with confirmation</li>
                </ul>
              </div>

              {/* Interaction Features */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">Interactions</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• <strong>Double-click:</strong> Quick load team</li>
                  <li>• <strong>Swipe left:</strong> Delete on mobile</li>
                  <li>• <strong>Favorites first:</strong> Auto-sorting</li>
                  <li>• <strong>Team limit:</strong> Warning at 5 teams</li>
                </ul>
              </div>

              {/* Empty State */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">States</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• <strong>Empty:</strong> "No saved teams. Save your first team!"</li>
                  <li>• <strong>Loading:</strong> Skeleton placeholders</li>
                  <li>• <strong>Error:</strong> Retry functionality</li>
                  <li>• <strong>Limit:</strong> Warning when ≥5 teams</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Mock Data Info */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">📊 Mock Data</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {mockTeams.map((team) => (
              <div key={team.id} className="bg-gray-700/50 rounded p-3">
                <div className="font-medium text-white mb-1">{team.name}</div>
                <div className="text-gray-400">
                  <div>Cost: {team.totalCost}/30</div>
                  <div>Units: {team.units.length}</div>
                  <div>Created: {new Date(team.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Notes */}
        <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">🔧 Integration Notes</h2>
          
          <div className="space-y-2 text-sm text-blue-200">
            <p><strong>teamStore Integration:</strong> Uses selectTeams, selectTeamLoading, etc.</p>
            <p><strong>Responsive Design:</strong> Sidebar variant adapts to container size</p>
            <p><strong>Accessibility:</strong> Proper ARIA labels and keyboard navigation</p>
            <p><strong>Performance:</strong> Optimized with useCallback and useMemo</p>
            <p><strong>Error Handling:</strong> Graceful fallbacks and user feedback</p>
          </div>
        </div>
      </div>

      {/* Modal Variant */}
      <SavedTeamsPanel
        variant="modal"
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onLoadTeam={handleLoadTeam}
      />
    </div>
  );
}