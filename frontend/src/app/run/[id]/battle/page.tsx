/**
 * Battle page for Roguelike mode.
 * Hand/Field placement → Spell timing → Find opponent → Battle.
 *
 * @fileoverview Battle preparation with hand/field mechanics.
 */

'use client';

import { useEffect, useCallback, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { Navigation, NavigationWrapper } from '@/components/Navigation';
import { FullPageLoader } from '@/components/LoadingStates';
import { ErrorMessage } from '@/components/ErrorStates';
import { RunStatusBar, SpellTimingPanel } from '@/components/roguelike';
import type { SpellTimingConfig, SpellTiming, SpellTimingInfo } from '@/components/roguelike';
import { useRunStore, FieldUnit, DeckCard } from '@/store/runStore';
import { usePlayerStore } from '@/store/playerStore';
import { api, RoguelikePlacedUnit, RoguelikeSpellTiming, RoguelikeUnitData } from '@/lib/api';

// =============================================================================
// TYPES
// =============================================================================

type BattleStep = 'placement' | 'spells' | 'finding' | 'battle' | 'result';

/** Drag data for hand cards */
interface HandCardDragData {
  type: 'hand-card';
  instanceId: string;
  unitId: string;
  tier: 1 | 2 | 3;
}

/** Drag data for field units */
interface FieldUnitDragData {
  type: 'field-unit';
  instanceId: string;
  unitId: string;
  tier: 1 | 2 | 3;
  position: { x: number; y: number };
}

type DragData = HandCardDragData | FieldUnitDragData;

interface OpponentDisplay {
  id: string;
  playerId: string;
  playerName: string;
  faction: string;
  leaderId: string;
  wins: number;
  rating: number;
  isBot: boolean;
}

interface BattleResultDisplay {
  battleId: string;
  result: 'win' | 'lose';
  replayAvailable: boolean;
  goldEarned: number;
  newGold: number;
  wins: number;
  losses: number;
  ratingChange: number;
  newRating: number;
  runComplete: boolean;
  runStatus: 'active' | 'won' | 'lost';
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Field grid dimensions */
const FIELD_WIDTH = 8;
const FIELD_HEIGHT = 2;

/** Upgrade costs by tier */
const UPGRADE_COSTS: Record<1 | 2, number> = {
  1: 3, // T1 → T2
  2: 5, // T2 → T3
};

const LABELS = {
  ru: {
    loading: 'Загрузка...',
    loadingRun: 'Загрузка забега...',
    findingOpponent: 'Поиск противника...',
    runNotFound: 'Забег не найден',
    runNotFoundDesc: 'Запрашиваемый забег не существует.',
    backToMenu: 'В главное меню',
    placement: 'Расставьте юнитов',
    placementDesc: 'Перетащите юнитов из руки на поле. Размещение стоит золото.',
    spells: 'Настройте заклинания',
    spellsDesc: 'Выберите, когда заклинания активируются в бою.',
    findOpponent: 'Найти противника',
    startBattle: 'Начать бой',
    back: 'Назад',
    noUnits: 'Нет юнитов в руке',
    noUnitsDesc: 'Сначала пройдите драфт.',
    goToDraft: 'Перейти к драфту',
    runComplete: 'Забег завершён',
    runCompleteDesc: 'Этот забег уже закончился.',
    viewResults: 'Посмотреть результаты',
    hand: 'Рука',
    field: 'Поле боя',
    gold: 'Золото',
    cost: 'Стоимость',
    notEnoughGold: 'Недостаточно золота',
    clickToPlace: 'Нажмите на карту, затем на клетку поля',
    clickToRemove: 'Нажмите на юнита на поле, чтобы вернуть в руку',
    emptyField: 'Разместите хотя бы одного юнита',
  },
};

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

/**
 * Hand card component for displaying a card in hand.
 * Supports both click selection and drag & drop.
 */
interface HandCardProps {
  card: DeckCard;
  unitName: string;
  cost: number;
  isSelected: boolean;
  canAfford: boolean;
  onClick: () => void;
}

function HandCard({ card, unitName, cost, isSelected, canAfford, onClick }: HandCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `hand-${card.instanceId}`,
    data: {
      type: 'hand-card',
      instanceId: card.instanceId,
      unitId: card.unitId,
      tier: card.tier,
    } as HandCardDragData,
    disabled: !canAfford,
  });

  const tierColors = {
    1: 'border-gray-500 bg-gray-800',
    2: 'border-blue-500 bg-blue-900/30',
    3: 'border-purple-500 bg-purple-900/30',
  };

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      disabled={!canAfford}
      {...attributes}
      {...listeners}
      className={`
        relative p-3 rounded-lg border-2 transition-all min-w-[100px] touch-none
        ${tierColors[card.tier]}
        ${isSelected ? 'ring-2 ring-yellow-400 scale-105' : ''}
        ${canAfford ? 'hover:scale-105 cursor-grab active:cursor-grabbing' : 'opacity-50 cursor-not-allowed'}
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      <div className="text-sm font-medium truncate">{unitName}</div>
      <div className="text-xs text-gray-400">T{card.tier}</div>
      <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold
        ${canAfford ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'}
      `}>
        {cost}🪙
      </div>
    </button>
  );
}

/**
 * Field grid cell component.
 * Supports both click selection and drag & drop.
 */
interface FieldCellProps {
  x: number;
  y: number;
  unit: FieldUnit | null;
  unitName: string | null;
  isValidDrop: boolean;
  isSelected: boolean;
  isDragOver: boolean;
  onClick: () => void;
}

function FieldCell({ x, y, unit, unitName, isValidDrop, isSelected, isDragOver, onClick }: FieldCellProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `field-${x}-${y}`,
    data: {
      type: 'field-cell',
      x,
      y,
    },
  });

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `field-unit-${unit?.instanceId || 'empty'}`,
    data: unit ? {
      type: 'field-unit',
      instanceId: unit.instanceId,
      unitId: unit.unitId,
      tier: unit.tier,
      position: { x, y },
    } as FieldUnitDragData : undefined,
    disabled: !unit,
  });

  const tierColors = {
    1: 'bg-gray-700 border-gray-500',
    2: 'bg-blue-900/50 border-blue-500',
    3: 'bg-purple-900/50 border-purple-500',
  };

  const showDropHighlight = (isOver || isDragOver) && !unit;

  return (
    <div
      ref={setDropRef}
      className="aspect-square"
    >
      <button
        ref={unit ? setDragRef : undefined}
        onClick={onClick}
        {...(unit ? attributes : {})}
        {...(unit ? listeners : {})}
        className={`
          w-full h-full rounded border-2 transition-all flex items-center justify-center touch-none
          ${unit ? tierColors[unit.tier] : 'bg-gray-800/50 border-gray-600'}
          ${showDropHighlight ? 'border-green-400 bg-green-900/30' : ''}
          ${isSelected ? 'ring-2 ring-yellow-400 border-yellow-400' : ''}
          ${unit && !isSelected ? 'hover:border-yellow-400 cursor-grab active:cursor-grabbing' : ''}
          ${!unit && isValidDrop ? 'hover:bg-green-800/50' : ''}
          ${isDragging ? 'opacity-50' : ''}
        `}
      >
        {unit && !isDragging && (
          <div className="text-center">
            <div className="text-xs font-medium truncate px-1">{unitName}</div>
            <div className="text-[10px] text-gray-400">T{unit.tier}</div>
          </div>
        )}
      </button>
    </div>
  );
}

/**
 * Droppable hand area for returning units from field.
 */
interface HandAreaDropZoneProps {
  isActive: boolean;
  children: React.ReactNode;
}

function HandAreaDropZone({ isActive, children }: HandAreaDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'hand-area',
    data: {
      type: 'hand-area',
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        bg-gray-800/50 rounded-xl p-4 mb-4 transition-all
        ${isActive && isOver ? 'ring-2 ring-red-400 bg-red-900/20' : ''}
        ${isActive && !isOver ? 'ring-1 ring-dashed ring-gray-500' : ''}
      `}
    >
      {children}
      {isActive && (
        <p className="text-center text-red-400 text-xs mt-2">
          Отпустите здесь, чтобы вернуть в руку
        </p>
      )}
    </div>
  );
}

/**
 * Drag overlay component for visual feedback during drag.
 */
interface DragOverlayContentProps {
  dragData: DragData;
  getUnitName: (unitId: string) => string;
}

function DragOverlayContent({ dragData, getUnitName }: DragOverlayContentProps) {
  const tierColors = {
    1: 'border-gray-500 bg-gray-800',
    2: 'border-blue-500 bg-blue-900/30',
    3: 'border-purple-500 bg-purple-900/30',
  };

  return (
    <div
      className={`
        p-3 rounded-lg border-2 min-w-[80px] transform rotate-3 scale-105 shadow-2xl
        ${tierColors[dragData.tier]}
      `}
    >
      <div className="text-sm font-medium truncate">{getUnitName(dragData.unitId)}</div>
      <div className="text-xs text-gray-400">T{dragData.tier}</div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Battle page component.
 * Handles unit placement from hand to field, spell timing, and battle execution.
 */
export default function BattlePage() {
  const router = useRouter();
  const params = useParams();
  const runId = params?.id as string;

  const labels = LABELS.ru;

  // Local state
  const [step, setStep] = useState<BattleStep>('placement');
  const [selectedHandCard, setSelectedHandCard] = useState<string | null>(null);
  const [spellInfos, setSpellInfos] = useState<SpellTimingInfo[]>([]);
  const [spellTimings, setSpellTimings] = useState<SpellTimingConfig[]>([]);
  const [opponent, setOpponent] = useState<OpponentDisplay | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResultDisplay | null>(null);
  const [battleLoading, setBattleLoading] = useState(false);
  const [battleError, setBattleError] = useState<string | null>(null);

  // Unit data from API (names and costs)
  const [unitData, setUnitData] = useState<Record<string, RoguelikeUnitData>>({});
  const [unitDataLoading, setUnitDataLoading] = useState(true);
  
  // Selected field unit for repositioning (click-based)
  const [selectedFieldUnit, setSelectedFieldUnit] = useState<string | null>(null);
  
  // Drag state
  const [activeDragData, setActiveDragData] = useState<DragData | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ x: number; y: number } | null>(null);

  // Configure sensors for both mouse and touch
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  });
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 150,
      tolerance: 8,
    },
  });
  
  const sensors = useSensors(pointerSensor, touchSensor);

  // Store state
  const { 
    currentRun, 
    loading: runLoading, 
    error: runError, 
    loadRun, 
    updateSpellTiming,
    placeUnit,
    repositionUnit,
    removeFromField,
    upgradeUnit,
  } = useRunStore();
  const { initPlayer } = usePlayerStore();

  // Initialize - force reload to get fresh hand/field data
  useEffect(() => {
    const init = async () => {
      await initPlayer();
      if (runId) {
        // Force reload to ensure we have fresh hand/field data
        await loadRun(runId, true);
      }
      // Load unit data from API
      try {
        setUnitDataLoading(true);
        const units = await api.getRoguelikeUnits();
        const unitMap: Record<string, RoguelikeUnitData> = {};
        for (const unit of units) {
          unitMap[unit.id] = unit;
        }
        setUnitData(unitMap);
      } catch {
        // Fallback: unit data will be empty, costs will default to 0
      } finally {
        setUnitDataLoading(false);
      }
    };
    init();
  }, [runId, initPlayer, loadRun]);

  // Initialize spell timings from run
  useEffect(() => {
    if (currentRun?.spells) {
      setSpellInfos(
        currentRun.spells.map(s => ({
          id: s.spellId,
          name: s.spellId,
          nameRu: s.spellId,
          description: '',
          descriptionRu: '',
          recommendedTiming: (s.timing || 'mid') as SpellTiming,
        }))
      );
      setSpellTimings(
        currentRun.spells.map(s => ({
          spellId: s.spellId,
          timing: (s.timing || 'mid') as SpellTiming,
        }))
      );
    }
  }, [currentRun?.spells]);

  // Computed values - memoized to prevent unnecessary re-renders
  const hand = useMemo(() => currentRun?.hand ?? [], [currentRun?.hand]);
  const field = useMemo(() => currentRun?.field ?? [], [currentRun?.field]);
  const gold = currentRun?.gold ?? 0;

  // Get unit name helper
  const getUnitName = useCallback((unitId: string) => {
    const unit = unitData[unitId];
    return unit?.nameRu || unit?.name || unitId;
  }, [unitData]);

  // Get unit cost helper
  const getUnitCost = useCallback((unitId: string) => {
    const unit = unitData[unitId];
    return unit?.cost ?? 0;
  }, [unitData]);

  // Get upgrade cost helper
  const getUpgradeCost = useCallback((tier: 1 | 2 | 3): number | null => {
    if (tier >= 3) return null; // Max tier
    return UPGRADE_COSTS[tier as 1 | 2];
  }, []);

  // Check if can afford upgrade
  const canAffordUpgrade = useCallback((tier: 1 | 2 | 3): boolean => {
    const cost = getUpgradeCost(tier);
    if (cost === null) return false;
    return gold >= cost;
  }, [gold, getUpgradeCost]);

  // Handle upgrade unit
  const handleUpgradeUnit = useCallback(async (instanceId: string) => {
    const success = await upgradeUnit(instanceId);
    if (success) {
      setSelectedFieldUnit(null);
    }
  }, [upgradeUnit]);

  // Handle hand card click
  const handleHandCardClick = useCallback((instanceId: string) => {
    // Deselect field unit when selecting hand card
    setSelectedFieldUnit(null);
    setSelectedHandCard(prev => prev === instanceId ? null : instanceId);
  }, []);

  // Handle field cell click
  const handleFieldCellClick = useCallback(async (x: number, y: number) => {
    // Check if there's a unit at this position
    const unitAtPosition = field.find(u => u.position.x === x && u.position.y === y);
    
    if (selectedFieldUnit) {
      // We have a field unit selected - try to reposition it
      if (unitAtPosition) {
        // Clicked on another unit - select it instead
        if (unitAtPosition.instanceId === selectedFieldUnit) {
          // Clicked on same unit - deselect
          setSelectedFieldUnit(null);
        } else {
          // Select the new unit
          setSelectedFieldUnit(unitAtPosition.instanceId);
        }
      } else {
        // Empty cell - reposition the selected unit
        await repositionUnit(selectedFieldUnit, { x, y });
        setSelectedFieldUnit(null);
      }
    } else if (selectedHandCard) {
      // We have a hand card selected - try to place it
      if (unitAtPosition) {
        // Position occupied - select the field unit instead
        setSelectedHandCard(null);
        setSelectedFieldUnit(unitAtPosition.instanceId);
      } else {
        // Place selected card at this position
        const success = await placeUnit(selectedHandCard, { x, y });
        if (success) {
          setSelectedHandCard(null);
        }
      }
    } else if (unitAtPosition) {
      // No selection - select the field unit for repositioning or removal
      setSelectedFieldUnit(unitAtPosition.instanceId);
    }
  }, [field, selectedHandCard, selectedFieldUnit, placeUnit, repositionUnit]);

  // Drag & Drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as DragData;
    setActiveDragData(data);
    // Clear click-based selections when starting drag
    setSelectedHandCard(null);
    setSelectedFieldUnit(null);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (over?.data.current?.type === 'field-cell') {
      setDragOverCell({ x: over.data.current.x, y: over.data.current.y });
    } else {
      setDragOverCell(null);
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    const dragData = active.data.current as DragData;
    
    setActiveDragData(null);
    setDragOverCell(null);

    if (!over) return;

    const dropType = over.data.current?.type;

    if (dragData.type === 'hand-card') {
      // Dragging from hand
      if (dropType === 'field-cell') {
        const { x, y } = over.data.current as { x: number; y: number };
        // Check if cell is empty
        const unitAtPosition = field.find(u => u.position.x === x && u.position.y === y);
        if (!unitAtPosition) {
          await placeUnit(dragData.instanceId, { x, y });
        }
      }
    } else if (dragData.type === 'field-unit') {
      // Dragging from field
      if (dropType === 'field-cell') {
        const { x, y } = over.data.current as { x: number; y: number };
        // Check if cell is empty (and not the same position)
        const unitAtPosition = field.find(u => u.position.x === x && u.position.y === y);
        if (!unitAtPosition && (x !== dragData.position.x || y !== dragData.position.y)) {
          await repositionUnit(dragData.instanceId, { x, y });
        }
      } else if (dropType === 'hand-area') {
        // Return to hand
        await removeFromField(dragData.instanceId);
      }
    }
  }, [field, placeUnit, repositionUnit, removeFromField]);

  // Handle spell timing change
  const handleSpellTimingChange = useCallback(
    (spellId: string, timing: SpellTiming) => {
      setSpellTimings(prev =>
        prev.map(s => (s.spellId === spellId ? { ...s, timing } : s))
      );
      updateSpellTiming(spellId, timing);
    },
    [updateSpellTiming]
  );

  // Handle find opponent
  const handleFindOpponent = useCallback(async () => {
    setStep('finding');
    setBattleError(null);

    try {
      const response = await api.findRoguelikeOpponent(runId);
      const opp: OpponentDisplay = {
        id: response.opponent.id,
        playerId: response.opponent.playerId,
        playerName: response.opponent.isBot 
          ? `Bot_${response.opponent.id.slice(-4)}` 
          : `Player_${response.opponent.playerId.slice(0, 8)}`,
        faction: response.opponent.faction,
        leaderId: response.opponent.leaderId,
        wins: response.opponent.wins,
        rating: response.opponent.rating,
        isBot: response.opponent.isBot,
      };
      setOpponent(opp);
      setStep('battle');
    } catch {
      setBattleError('Не удалось найти противника');
      setStep('spells');
    }
  }, [runId]);

  // Handle start battle
  const handleStartBattle = useCallback(async () => {
    if (!opponent) return;

    setBattleLoading(true);
    setBattleError(null);

    try {
      // Convert field units to battle format
      const team: RoguelikePlacedUnit[] = field.map(u => ({
        instanceId: u.instanceId,
        unitId: u.unitId,
        tier: u.tier,
        position: u.position,
      }));

      const timings: RoguelikeSpellTiming[] = spellTimings.map(s => ({
        spellId: s.spellId,
        timing: s.timing,
      }));

      const result = await api.submitRoguelikeBattle(runId, team, timings);

      setBattleResult({
        battleId: result.battleId,
        result: result.result,
        replayAvailable: result.replayAvailable,
        goldEarned: result.goldEarned,
        newGold: result.newGold,
        wins: result.wins,
        losses: result.losses,
        ratingChange: result.ratingChange,
        newRating: result.newRating,
        runComplete: result.runComplete,
        runStatus: result.runStatus,
      });
      setStep('result');
    } catch {
      setBattleError('Не удалось провести бой');
    } finally {
      setBattleLoading(false);
    }
  }, [runId, opponent, field, spellTimings]);

  // Navigation handlers
  const handleBack = useCallback(() => {
    if (step === 'spells') {
      setStep('placement');
    } else if (step === 'battle') {
      setStep('spells');
      setOpponent(null);
    }
  }, [step]);

  const handleGoToDraft = useCallback(() => {
    router.push(`/run/${runId}/draft`);
  }, [runId, router]);

  const handleViewResults = useCallback(() => {
    router.replace(`/run/${runId}/result`);
  }, [runId, router]);

  const handleBackToMenu = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleContinueAfterBattle = useCallback(() => {
    if (!battleResult) return;
    
    if (battleResult.runStatus === 'active') {
      router.replace(`/run/${runId}/shop`);
    } else {
      router.replace(`/run/${runId}/result`);
    }
  }, [battleResult, runId, router]);

  // Check if can proceed to spells
  const canProceedToSpells = field.length > 0;

  // Loading state
  if (runLoading || unitDataLoading) {
    return <FullPageLoader message={labels.loadingRun} icon="⚔️" />;
  }

  // Run not found
  if (!currentRun && !runLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navigation />
        <NavigationWrapper>
          <div className="max-w-2xl mx-auto p-6 text-center py-16">
            <div className="text-6xl mb-4">❓</div>
            <h1 className="text-2xl font-bold text-red-400 mb-2">{labels.runNotFound}</h1>
            <p className="text-gray-400 mb-6">{labels.runNotFoundDesc}</p>
            <button
              onClick={handleBackToMenu}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              {labels.backToMenu}
            </button>
          </div>
        </NavigationWrapper>
      </div>
    );
  }

  // Run complete
  if (currentRun && currentRun.status !== 'active') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navigation />
        <NavigationWrapper>
          <div className="max-w-2xl mx-auto p-6 text-center py-16">
            <div className="text-6xl mb-4">🏁</div>
            <h1 className="text-2xl font-bold text-yellow-400 mb-2">{labels.runComplete}</h1>
            <p className="text-gray-400 mb-6">{labels.runCompleteDesc}</p>
            <button
              onClick={handleViewResults}
              className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              {labels.viewResults}
            </button>
          </div>
        </NavigationWrapper>
      </div>
    );
  }

  // No units in hand AND no units on field - need draft
  if (currentRun && hand.length === 0 && field.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navigation />
        <NavigationWrapper>
          <div className="max-w-2xl mx-auto p-6 text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h1 className="text-2xl font-bold text-gray-400 mb-2">{labels.noUnits}</h1>
            <p className="text-gray-500 mb-6">{labels.noUnitsDesc}</p>
            <button
              onClick={handleGoToDraft}
              className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              {labels.goToDraft}
            </button>
          </div>
        </NavigationWrapper>
      </div>
    );
  }

  // Finding opponent
  if (step === 'finding') {
    return <FullPageLoader message={labels.findingOpponent} icon="🔍" />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      <NavigationWrapper>
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          {/* Run status bar */}
          {currentRun && (
            <RunStatusBar
              wins={currentRun.wins}
              losses={currentRun.losses}
              gold={gold}
              leader={{
                id: currentRun.leaderId,
                name: currentRun.leaderId,
                portrait: `leader-${currentRun.leaderId}`,
                faction: currentRun.faction,
              }}
              consecutiveWins={currentRun.consecutiveWins}
              useRussian={true}
              className="mb-4"
            />
          )}

          {/* Error display */}
          {(runError || battleError) && (
            <div className="mb-4">
              <ErrorMessage message={runError || battleError || ''} severity="error" />
            </div>
          )}

          {/* Step: Placement */}
          {step === 'placement' && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div>
                <h2 className="text-xl font-bold text-center mb-2">{labels.placement}</h2>
                <p className="text-gray-400 text-center mb-4 text-sm">{labels.placementDesc}</p>

                {/* Field (8×2 grid) */}
                <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-300">{labels.field}</h3>
                    <span className="text-sm text-gray-500">{field.length} юнитов</span>
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {Array.from({ length: FIELD_WIDTH * FIELD_HEIGHT }).map((_, i) => {
                      const x = i % FIELD_WIDTH;
                      const y = Math.floor(i / FIELD_WIDTH);
                      const unit = field.find(u => u.position.x === x && u.position.y === y);
                      const isValidDrop = (selectedHandCard !== null || selectedFieldUnit !== null || activeDragData !== null) && !unit;
                      const isSelected = unit?.instanceId === selectedFieldUnit;
                      const isDragOver = dragOverCell?.x === x && dragOverCell?.y === y;

                      return (
                        <FieldCell
                          key={`${x}-${y}`}
                          x={x}
                          y={y}
                          unit={unit || null}
                          unitName={unit ? getUnitName(unit.unitId) : null}
                          isValidDrop={isValidDrop}
                          isSelected={isSelected}
                          isDragOver={isDragOver}
                          onClick={() => handleFieldCellClick(x, y)}
                        />
                      );
                    })}
                  </div>
                  <p className="text-center text-gray-500 text-xs mt-2">
                    {activeDragData
                      ? 'Перетащите на пустую клетку'
                      : selectedFieldUnit 
                        ? 'Нажмите на пустую клетку для перемещения или кнопку ниже для возврата в руку'
                        : selectedHandCard 
                          ? labels.clickToPlace 
                          : 'Перетащите или нажмите на юнита для выбора'}
                  </p>
                  {/* Remove from field button */}
                  {selectedFieldUnit && (
                    <div className="text-center mt-2 flex gap-2 justify-center flex-wrap">
                      {/* Upgrade button */}
                      {(() => {
                        const selectedUnit = field.find(u => u.instanceId === selectedFieldUnit);
                        if (!selectedUnit || selectedUnit.tier >= 3) return null;
                        const upgradeCost = getUpgradeCost(selectedUnit.tier);
                        const canUpgrade = canAffordUpgrade(selectedUnit.tier);
                        return (
                          <button
                            onClick={() => handleUpgradeUnit(selectedFieldUnit)}
                            disabled={!canUpgrade}
                            className={`px-4 py-2 text-sm rounded transition-colors flex items-center gap-1 ${
                              canUpgrade
                                ? 'bg-green-600 text-white hover:bg-green-500'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            ⬆️ Улучшить до T{selectedUnit.tier + 1}
                            <span className={canUpgrade ? 'text-yellow-300' : 'text-gray-500'}>
                              ({upgradeCost}🪙)
                            </span>
                          </button>
                        );
                      })()}
                      {/* Remove button */}
                      <button
                        onClick={async () => {
                          const success = await removeFromField(selectedFieldUnit);
                          if (success) {
                            setSelectedFieldUnit(null);
                          }
                        }}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-500 transition-colors"
                      >
                        Вернуть в руку
                      </button>
                    </div>
                  )}
                </div>

                {/* Hand - wrapped in droppable zone for returning units */}
                <HandAreaDropZone isActive={activeDragData?.type === 'field-unit'}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-300">{labels.hand}</h3>
                    <span className="text-yellow-400 font-bold">{gold} 🪙</span>
                  </div>
                  {hand.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Рука пуста</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {hand.map(card => {
                        const cost = getUnitCost(card.unitId);
                        const canAfford = gold >= cost;
                        return (
                          <HandCard
                            key={card.instanceId}
                            card={card}
                            unitName={getUnitName(card.unitId)}
                            cost={cost}
                            isSelected={selectedHandCard === card.instanceId}
                            canAfford={canAfford}
                            onClick={() => handleHandCardClick(card.instanceId)}
                          />
                        );
                      })}
                    </div>
                  )}
                </HandAreaDropZone>

                {/* Action buttons */}
                <div className="text-center">
                  {!canProceedToSpells && (
                    <p className="text-red-400 text-sm mb-2">{labels.emptyField}</p>
                  )}
                  <button
                    onClick={() => setStep('spells')}
                    disabled={!canProceedToSpells}
                    className={`px-6 py-3 font-bold rounded-lg transition-colors ${
                      !canProceedToSpells
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-yellow-500 text-black hover:bg-yellow-400'
                    }`}
                  >
                    Далее →
                  </button>
                </div>
              </div>

              {/* Drag Overlay */}
              <DragOverlay>
                {activeDragData && (
                  <DragOverlayContent dragData={activeDragData} getUnitName={getUnitName} />
                )}
              </DragOverlay>
            </DndContext>
          )}

          {/* Step: Spell Timings */}
          {step === 'spells' && (
            <div>
              <h2 className="text-xl font-bold text-center mb-2">{labels.spells}</h2>
              <p className="text-gray-400 text-center mb-6">{labels.spellsDesc}</p>

              <SpellTimingPanel
                spells={spellInfos}
                timings={spellTimings}
                onTimingChange={handleSpellTimingChange}
                useRussian={true}
                className="mb-6"
              />

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ← {labels.back}
                </button>
                <button
                  onClick={handleFindOpponent}
                  className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  {labels.findOpponent}
                </button>
              </div>
            </div>
          )}

          {/* Step: Battle */}
          {step === 'battle' && opponent && (
            <div>
              <h2 className="text-xl font-bold text-center mb-6">Противник найден!</h2>

              <div className="bg-gray-800/50 rounded-xl p-6 mb-6 text-center">
                <div className="text-4xl mb-2">⚔️</div>
                <div className="text-lg font-bold">{opponent.playerName}</div>
                <div className="text-gray-400">
                  {opponent.faction} • {opponent.wins} побед • Рейтинг: {opponent.rating}
                </div>
                {opponent.isBot && (
                  <div className="text-yellow-500 text-sm mt-2">🤖 Бот</div>
                )}
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ← {labels.back}
                </button>
                <button
                  onClick={handleStartBattle}
                  disabled={battleLoading}
                  className={`px-6 py-3 font-bold rounded-lg transition-colors ${
                    battleLoading
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-400'
                  }`}
                >
                  {battleLoading ? 'Бой...' : labels.startBattle}
                </button>
              </div>
            </div>
          )}

          {/* Step: Result */}
          {step === 'result' && battleResult && (
            <div className="text-center">
              <div className="text-8xl mb-4">
                {battleResult.result === 'win' ? '🏆' : '💀'}
              </div>
              <h2 className={`text-3xl font-bold mb-2 ${
                battleResult.result === 'win' ? 'text-green-400' : 'text-red-400'
              }`}>
                {battleResult.result === 'win' ? 'Победа!' : 'Поражение'}
              </h2>

              <div className="bg-gray-800/50 rounded-xl p-6 mb-6 max-w-md mx-auto">
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">Золото заработано:</span>
                  <span className="text-2xl font-bold text-yellow-400">
                    +{battleResult.goldEarned} 🪙
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">Всего золота:</span>
                  <span className="text-xl font-bold text-yellow-300">
                    {battleResult.newGold} 🪙
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">Рейтинг:</span>
                  <span className={`text-lg font-bold ${
                    battleResult.ratingChange >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {battleResult.ratingChange >= 0 ? '+' : ''}{battleResult.ratingChange} ({battleResult.newRating})
                  </span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-400">Счёт:</span>
                  <span className="text-lg font-bold">
                    <span className="text-green-400">{battleResult.wins}</span>
                    {' / '}
                    <span className="text-red-400">{battleResult.losses}</span>
                  </span>
                </div>
              </div>

              {battleResult.runComplete && (
                <div className={`mb-6 p-4 rounded-lg ${
                  battleResult.runStatus === 'won' 
                    ? 'bg-green-900/30 border border-green-500' 
                    : 'bg-red-900/30 border border-red-500'
                }`}>
                  <div className="text-2xl mb-2">
                    {battleResult.runStatus === 'won' ? '🎉' : '😢'}
                  </div>
                  <div className="font-bold">
                    {battleResult.runStatus === 'won' 
                      ? 'Забег завершён победой!' 
                      : 'Забег завершён'}
                  </div>
                </div>
              )}

              <button
                onClick={handleContinueAfterBattle}
                className="px-8 py-4 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors text-lg"
              >
                {battleResult.runComplete 
                  ? 'Посмотреть результаты' 
                  : 'Продолжить →'}
              </button>

              {/* Watch Replay button */}
              {battleResult.replayAvailable && (
                <button
                  onClick={() => router.push(`/battle/${battleResult.battleId}`)}
                  className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                >
                  🎬 Смотреть реплей
                </button>
              )}
            </div>
          )}
        </div>
      </NavigationWrapper>
    </div>
  );
}
