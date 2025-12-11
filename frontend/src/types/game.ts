/**
 * Frontend type definitions for Fantasy Autobattler game.
 * Synchronized with backend API types for consistency.
 * 
 * @fileoverview Complete type system matching backend API responses.
 */

// =============================================================================
// BASIC TYPES
// =============================================================================

/**
 * 2D position on the battlefield grid.
 * Uses zero-based indexing (0,0) to (7,9) for 8×10 grid.
 */
export interface Position {
  /** X coordinate (0-7) */
  x: number;
  /** Y coordinate (0-9) */
  y: number;
}

/**
 * Unit role enumeration matching backend constants.
 */
export type UnitRole = 'tank' | 'melee_dps' | 'ranged_dps' | 'mage' | 'support' | 'control';

/**
 * Team identifier for battle participants.
 */
export type TeamType = 'player' | 'bot';

/**
 * Battle outcome possibilities.
 */
export type BattleWinner = 'player' | 'bot' | 'draw';

// =============================================================================
// UNIT SYSTEM TYPES
// =============================================================================

/**
 * All available unit IDs in the game (15 units total).
 */
export type UnitId = 
  // Tanks (3)
  | 'knight' | 'guardian' | 'berserker'
  // Melee DPS (3)  
  | 'rogue' | 'duelist' | 'assassin'
  // Ranged DPS (3)
  | 'archer' | 'crossbowman' | 'hunter'
  // Mages (3)
  | 'mage' | 'warlock' | 'elementalist'
  // Support (2)
  | 'priest' | 'bard'
  // Control (1)
  | 'enchanter';

/**
 * Core unit statistics interface matching backend.
 */
export interface UnitStats {
  /** Hit points - unit dies when reaching 0 */
  hp: number;
  /** Attack damage per hit */
  atk: number;
  /** Number of attacks per turn */
  atkCount: number;
  /** Armor - reduces incoming physical damage */
  armor: number;
  /** Movement speed - cells per turn */
  speed: number;
  /** Initiative - determines turn order (higher = first) */
  initiative: number;
  /** Dodge chance percentage (0-100) */
  dodge: number;
}

/**
 * Unit template definition from API.
 */
export interface UnitTemplate {
  /** Unique unit identifier */
  id: UnitId;
  /** Display name */
  name: string;
  /** Unit role classification */
  role: UnitRole;
  /** Team budget cost (3-8 points) */
  cost: number;
  /** Base statistics */
  stats: UnitStats;
  /** Attack range in cells */
  range: number;
  /** Available ability IDs */
  abilities: string[];
}

/**
 * Active unit instance in battle.
 */
export interface BattleUnit extends UnitTemplate {
  /** Current position on battlefield */
  position: Position;
  /** Current hit points (can be less than stats.hp) */
  currentHp: number;
  /** Maximum hit points (equals stats.hp) */
  maxHp: number;
  /** Team affiliation */
  team: TeamType;
  /** Whether unit is alive and can act */
  alive: boolean;
  /** Unique instance identifier for battle */
  instanceId: string;
}

// =============================================================================
// BATTLE EVENT TYPES
// =============================================================================

/**
 * Battle event type classification.
 */
export type BattleEventType = 
  | 'move' 
  | 'attack' 
  | 'heal' 
  | 'ability' 
  | 'damage' 
  | 'death' 
  | 'buff' 
  | 'debuff'
  | 'round_start'
  | 'battle_end';

/**
 * Individual battle event record matching backend.
 */
export interface BattleEvent {
  /** Battle round number (1-based) */
  round: number;
  /** Event type classification */
  type: BattleEventType;
  /** ID of the acting unit */
  actorId: string;
  /** ID of the target unit (if applicable) */
  targetId?: string;
  /** Multiple target IDs (for AoE abilities) */
  targetIds?: string[];
  /** Damage dealt */
  damage?: number;
  /** Multiple damage values (for multi-target) */
  damages?: number[];
  /** Healing amount */
  healing?: number;
  /** Movement from position */
  fromPosition?: Position;
  /** Movement to position */
  toPosition?: Position;
  /** Ability used */
  abilityId?: string;
  /** Units killed by this event */
  killedUnits?: string[];
  /** Additional event metadata */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// BATTLE RESULT TYPES
// =============================================================================

/**
 * Final unit state after battle completion.
 */
export interface FinalUnitState {
  /** Unit instance ID */
  instanceId: string;
  /** Final hit points */
  currentHp: number;
  /** Final position */
  position: Position;
  /** Survival status */
  alive: boolean;
}

/**
 * Complete battle simulation result.
 */
export interface BattleResult {
  /** Chronological list of all battle events */
  events: BattleEvent[];
  /** Battle outcome */
  winner: BattleWinner;
  /** Final state of all units */
  finalState: {
    /** Player team final states */
    playerUnits: FinalUnitState[];
    /** Bot team final states */
    botUnits: FinalUnitState[];
  };
  /** Battle metadata */
  metadata: {
    /** Total rounds fought */
    totalRounds: number;
    /** Battle duration in milliseconds */
    durationMs: number;
    /** Random seed used (for deterministic replay) */
    seed?: number;
  };
}

// =============================================================================
// TEAM COMPOSITION TYPES
// =============================================================================

/**
 * Unit selection for team composition.
 */
export interface UnitSelection {
  /** Unit identifier */
  unitId: UnitId;
  /** Unit position on battlefield */
  position: Position;
}

/**
 * Team setup for battle.
 */
export interface TeamSetup {
  /** Team name */
  name: string;
  /** Array of units with positions */
  units: UnitSelection[];
}

/**
 * Create team request DTO.
 */
export interface CreateTeamDto {
  /** Team name for identification */
  name: string;
  /** Array of units with their positions (1-10 units) */
  units: UnitSelection[];
}

/**
 * Enriched unit with additional information.
 */
export interface EnrichedUnit extends UnitSelection {
  /** Unit display name */
  name: string;
  /** Unit cost in team budget */
  cost: number;
  /** Unit role */
  role: UnitRole;
}

/**
 * Team response from API.
 */
export interface TeamResponse {
  /** Unique team identifier */
  id: string;
  /** Team name */
  name: string;
  /** Team units with enriched information */
  units: EnrichedUnit[];
  /** Total team cost within budget (max 30) */
  totalCost: number;
  /** Whether this team is active for matchmaking */
  isActive: boolean;
  /** Team creation timestamp */
  createdAt: string;
  /** Team last update timestamp */
  updatedAt: string;
}

/**
 * Team validation result.
 */
export interface TeamValidationResult {
  /** Whether team is valid */
  isValid: boolean;
  /** Validation error messages */
  errors: string[];
  /** Total team cost */
  totalCost: number;
  /** Budget remaining */
  budgetRemaining: number;
}

// =============================================================================
// MATCHMAKING TYPES
// =============================================================================

/**
 * Matchmaking status enumeration.
 */
export type MatchmakingStatus = 'queued' | 'matched' | 'not_in_queue';

/**
 * Matchmaking queue entry.
 */
export interface MatchmakingEntry {
  /** Player identifier */
  playerId: string;
  /** Team identifier */
  teamId: string;
  /** Queue entry timestamp */
  queuedAt: string;
  /** Current status */
  status: MatchmakingStatus;
}

// =============================================================================
// PLAYER TYPES
// =============================================================================

/**
 * Player profile information.
 */
export interface Player {
  /** Unique player identifier */
  id: string;
  /** Guest token identifier */
  guestId: string;
  /** Player display name */
  name: string;
  /** Player statistics */
  stats: {
    /** Total wins */
    wins: number;
    /** Total losses */
    losses: number;
    /** Win rate percentage */
    winRate: number;
  };
  /** Player creation timestamp */
  createdAt: string;
  /** Last activity timestamp */
  lastActiveAt: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Units list API response.
 */
export interface UnitsListResponse {
  /** Array of all available unit templates */
  units: UnitTemplate[];
  /** Total number of units available */
  total: number;
  /** Units grouped by role for easy filtering */
  byRole: Record<UnitRole, UnitTemplate[]>;
}

/**
 * Battle log from API.
 */
export interface BattleLog {
  /** Unique battle identifier */
  id: string;
  /** Player 1 identifier */
  player1Id: string;
  /** Player 2 identifier (or bot) */
  player2Id: string;
  /** Battle winner identifier */
  winnerId: string;
  /** Player 1 team snapshot */
  player1Team: object;
  /** Player 2 team snapshot */
  player2Team: object;
  /** Complete battle events for replay */
  events: BattleEvent[];
  /** Random seed used for battle simulation */
  seed: number;
  /** Battle status */
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  /** Battle creation timestamp */
  createdAt: string;
  /** Battle completion timestamp */
  updatedAt: string;
}

// =============================================================================
// LEGACY COMPATIBILITY (for backward compatibility)
// =============================================================================

/**
 * Legacy unit type for backward compatibility.
 * @deprecated Use UnitId instead for new code.
 */
export type UnitType = 'Warrior' | 'Mage' | 'Healer';

// =============================================================================
// UI HELPER TYPES
// =============================================================================

/**
 * Unit display information for UI components.
 */
export interface UnitDisplayInfo {
  /** Unit emoji icon */
  emoji: string;
  /** Background color class */
  color: string;
  /** Unit description */
  description: string;
}

/**
 * Unit information mapping for UI display.
 */
export const UNIT_INFO: Record<UnitId, UnitDisplayInfo> = {
  // Tanks
  knight: { emoji: '🛡️', color: 'bg-blue-600', description: 'Защитник с высокой броней' },
  guardian: { emoji: '🏰', color: 'bg-gray-600', description: 'Непробиваемый танк' },
  berserker: { emoji: '⚔️', color: 'bg-red-600', description: 'Агрессивный воин' },
  
  // Melee DPS
  rogue: { emoji: '🗡️', color: 'bg-purple-600', description: 'Быстрый убийца' },
  duelist: { emoji: '⚔️', color: 'bg-orange-600', description: 'Мастер клинка' },
  assassin: { emoji: '🔪', color: 'bg-black', description: 'Смертельный удар' },
  
  // Ranged DPS
  archer: { emoji: '🏹', color: 'bg-green-600', description: 'Меткий стрелок' },
  crossbowman: { emoji: '🎯', color: 'bg-brown-600', description: 'Пробивающий выстрел' },
  hunter: { emoji: '🎯', color: 'bg-forest-600', description: 'Охотник с ловушками' },
  
  // Mages
  mage: { emoji: '🔮', color: 'bg-blue-500', description: 'Огненная магия' },
  warlock: { emoji: '🌙', color: 'bg-purple-800', description: 'Темная магия' },
  elementalist: { emoji: '⚡', color: 'bg-yellow-500', description: 'Стихийная магия' },
  
  // Support
  priest: { emoji: '💚', color: 'bg-green-500', description: 'Целитель команды' },
  bard: { emoji: '🎵', color: 'bg-pink-500', description: 'Поддержка союзников' },
  
  // Control
  enchanter: { emoji: '✨', color: 'bg-indigo-500', description: 'Контроль противника' },
};

/**
 * Legacy unit info for backward compatibility.
 * @deprecated Use UNIT_INFO instead for new code.
 */
export const LEGACY_UNIT_INFO: Record<UnitType, UnitDisplayInfo> = {
  Warrior: { emoji: '⚔️', color: 'bg-red-600', description: 'High HP & DEF. Taunts enemies.' },
  Mage: { emoji: '🔮', color: 'bg-purple-600', description: 'High ATK. Hits 2 enemies.' },
  Healer: { emoji: '💚', color: 'bg-green-600', description: 'Heals lowest HP ally.' },
};
