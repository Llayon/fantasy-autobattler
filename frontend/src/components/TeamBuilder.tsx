'use client';

import { UnitType } from '@/types/game';
import { UnitCard } from './UnitCard';
import { useGameStore } from '@/store/gameStore';

const ALL_UNITS: UnitType[] = ['Warrior', 'Mage', 'Healer'];

export function TeamBuilder() {
  const { selectedTeam, setSelectedTeam, player, loading, startBattle } = useGameStore();

  const handleSlotClick = (slotIndex: number, unitType: UnitType) => {
    const newTeam = [...selectedTeam];
    newTeam[slotIndex] = unitType;
    setSelectedTeam(newTeam);
  };

  const handleBattle = async () => {
    try {
      const battleId = await startBattle();
      window.location.href = `/battle/${battleId}`;
    } catch {
      // Error handled in store
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">⚔️ Fantasy Autobattler</h1>
        {player && (
          <p className="text-gray-300">
            {player.name} | Wins: {player.wins} | Losses: {player.losses}
          </p>
        )}
      </div>

      <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-center">Your Team</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {selectedTeam.map((unit, index) => (
            <div key={index} className="text-center">
              <div className="text-sm text-gray-400 mb-2">Slot {index + 1}</div>
              <UnitCard type={unit} selected />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-center">Select Units</h2>
        <p className="text-gray-400 text-sm text-center mb-4">
          Click a unit, then click a slot above to place it
        </p>
        
        {[0, 1, 2].map((slotIndex) => (
          <div key={slotIndex} className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Choose for Slot {slotIndex + 1}:</div>
            <div className="grid grid-cols-3 gap-3">
              {ALL_UNITS.map((unitType) => (
                <UnitCard
                  key={unitType}
                  type={unitType}
                  selected={selectedTeam[slotIndex] === unitType}
                  onClick={() => handleSlotClick(slotIndex, unitType)}
                  showStats={false}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleBattle}
        disabled={loading}
        className={`
          w-full py-4 rounded-xl text-xl font-bold
          bg-gradient-to-r from-yellow-500 to-orange-500
          hover:from-yellow-400 hover:to-orange-400
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 transform hover:scale-[1.02]
        `}
      >
        {loading ? '⏳ Loading...' : '⚔️ Start Battle!'}
      </button>
    </div>
  );
}
