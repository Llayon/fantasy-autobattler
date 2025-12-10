# 📐 Engineering Guide

This document defines coding standards, patterns, and best practices for the Fantasy Autobattler project.

## Table of Contents
1. [General Principles](#general-principles)
2. [TypeScript Standards](#typescript-standards)
3. [JSDoc Documentation](#jsdoc-documentation)
4. [Logging Standards](#logging-standards)
5. [Backend Patterns (NestJS)](#backend-patterns-nestjs)
6. [Frontend Patterns (Next.js)](#frontend-patterns-nextjs)
7. [File Naming Conventions](#file-naming-conventions)
8. [Error Handling](#error-handling)
9. [Testing Standards](#testing-standards)

---

## General Principles

### SOLID in Practice
- **Single Responsibility**: One file = one purpose. Services don't render UI. Components don't fetch data directly.
- **Open/Closed**: Extend via composition, not modification. Add new unit types without changing simulator core.
- **Dependency Inversion**: Depend on abstractions. Services receive repositories via DI.

### Code Organization Rules
1. **Colocation**: Keep related files together (service + controller + module in same folder)
2. **Flat over nested**: Avoid deep folder hierarchies (max 3 levels)
3. **Explicit over implicit**: Name files by what they do, not where they're used

---

## TypeScript Standards

### Type Definitions

```typescript
// ✅ GOOD: Explicit types, descriptive names
interface BattleEvent {
  round: number;
  actor: string;
  action: 'attack' | 'heal' | 'splash';
  target?: string;
  damage?: number;
}

// ❌ BAD: Vague types, any usage
interface Event {
  data: any;
  type: string;
}
```

### Prefer Interfaces for Objects
```typescript
// ✅ GOOD: Interface for object shapes
interface Player {
  id: string;
  name: string;
}

// ✅ GOOD: Type for unions/primitives
type UnitType = 'Warrior' | 'Mage' | 'Healer';
type Winner = 'player' | 'bot' | 'draw';
```

### Avoid Type Assertions
```typescript
// ✅ GOOD: Type guard
function isPlayer(obj: unknown): obj is Player {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}

// ❌ BAD: Force casting
const player = data as Player;
```

---

## JSDoc Documentation

### Requirements
ALL public functions, classes, interfaces, and types MUST have JSDoc documentation.

### Function Documentation
```typescript
/**
 * Calculates physical damage dealt by attacker to target.
 * Uses formula: max(1, (ATK - armor) * atkCount)
 * 
 * @param attacker - The unit dealing damage
 * @param target - The unit receiving damage
 * @returns Calculated damage value (minimum 1)
 * @throws {Error} If attacker or target is null
 * 
 * @example
 * const damage = calculatePhysicalDamage(warrior, goblin);
 * // Returns: 12 (if warrior.atk=15, goblin.armor=3)
 */
export function calculatePhysicalDamage(
  attacker: BattleUnit,
  target: BattleUnit
): number {
  return Math.max(1, (attacker.atk - target.armor) * attacker.atkCount);
}
```

### Interface Documentation
```typescript
/**
 * Represents a unit's combat statistics.
 * All values are base stats before buffs/debuffs.
 */
interface UnitStats {
  /** Health points. Unit dies when HP reaches 0. */
  hp: number;
  
  /** Attack power. Used in damage calculation. */
  atk: number;
  
  /** Number of attacks per turn. Multiplies damage. */
  atkCount: number;
  
  /** Armor rating. Reduces incoming physical damage. */
  armor: number;
  
  /** Movement speed. Cells per turn. */
  speed: number;
  
  /** Initiative. Determines turn order (higher = first). */
  initiative: number;
  
  /** Dodge chance as percentage (0-100). */
  dodge: number;
}
```

### Class Documentation
```typescript
/**
 * Service responsible for battle simulation and persistence.
 * Handles PvP and PvE battle creation, simulation, and result storage.
 * 
 * @example
 * const battleService = new BattleService(battleRepo, playerRepo);
 * const result = await battleService.startPvPBattle(player1Id, player2Id);
 */
@Injectable()
export class BattleService {
  // ...
}
```

### When to Add Inline Comments
```typescript
// ✅ GOOD: Explain WHY, not WHAT
// Using Manhattan distance because diagonal movement is not allowed
const distance = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

// Taunt overrides normal targeting - tanks must be attacked first
if (hasTaunt(enemy)) {
  return enemy;
}

// ❌ BAD: Obvious comments
// Add 1 to counter
counter += 1;
```

---

## Logging Standards

### Log Levels
| Level | Usage | Example |
|-------|-------|---------|
| `error` | Bugs, crashes, unrecoverable errors | Failed DB connection, unhandled exception |
| `warn` | Issues that don't break functionality | Deprecated API usage, slow query |
| `log` | Important business events | Battle started, team saved, user registered |
| `debug` | Development/troubleshooting info | Function inputs/outputs, state changes |

### Backend Logging (NestJS)
```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class BattleService {
  private readonly logger = new Logger(BattleService.name);

  async startBattle(playerId: string): Promise<BattleResult> {
    // Log business event
    this.logger.log(`Starting battle`, { playerId });

    try {
      const result = await this.simulateAndSave(playerId);
      
      // Log success with context
      this.logger.log(`Battle completed`, {
        battleId: result.id,
        playerId,
        winner: result.winner,
        rounds: result.events.length,
      });
      
      return result;
    } catch (error) {
      // Log error with full context for debugging
      this.logger.error(`Battle simulation failed`, {
        playerId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }
}
```

### What to Log

**ALWAYS log:**
- Errors with stack traces and context
- Authentication events (login, logout, token refresh)
- Important business events (battle start/end, team changes)
- External API calls (request/response time)
- Database errors

**NEVER log:**
- Passwords or tokens
- Full request/response bodies in production
- Personal identifiable information (PII)
- High-frequency events without sampling

### Correlation ID
```typescript
// Add correlation ID for request tracing
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const correlationId = request.headers['x-correlation-id'] || uuidv4();
    
    // Attach to all logs in this request
    return next.handle().pipe(
      tap({
        next: () => this.logger.log('Request completed', { correlationId }),
        error: (err) => this.logger.error('Request failed', { correlationId, error: err.message }),
      }),
    );
  }
}
```

### Frontend Logging
```typescript
// Use a logging service, not console.log
class LogService {
  private context: Record<string, unknown> = {};

  setContext(ctx: Record<string, unknown>) {
    this.context = { ...this.context, ...ctx };
  }

  error(message: string, data?: Record<string, unknown>) {
    // Send to error tracking service (Sentry, etc.)
    console.error(message, { ...this.context, ...data });
  }

  info(message: string, data?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development') {
      console.info(message, { ...this.context, ...data });
    }
  }
}

export const logger = new LogService();

// Usage
logger.setContext({ playerId: player.id });
logger.error('Failed to save team', { teamId, error: err.message });
```

---

## Backend Patterns (NestJS)

### Module Structure
Each feature module follows this structure:
```
feature/
├── feature.module.ts      # Module definition
├── feature.controller.ts  # HTTP endpoints
├── feature.service.ts     # Business logic
└── feature.guard.ts       # Auth/validation (if needed)
```

### Controller Pattern (Reference Implementation)
```typescript
// ✅ REFERENCE: battle.controller.ts
@Controller('battle')
@UseGuards(GuestGuard)  // Auth at controller level
export class BattleController {
  constructor(private battleService: BattleService) {}

  @Post('start')
  async startBattle(@Req() req: any) {
    // Controller only: extract data, call service, return response
    return this.battleService.startBattle(req.player.id);
  }

  @Get(':id')
  async getBattle(@Param('id') id: string) {
    // Validation via decorators, logic in service
    return this.battleService.getBattle(id);
  }
}
```

### Service Pattern (Reference Implementation)
```typescript
// ✅ REFERENCE: battle.service.ts
@Injectable()
export class BattleService {
  constructor(
    @InjectRepository(BattleLog)
    private battleRepo: Repository<BattleLog>,
    @InjectRepository(Player)
    private playerRepo: Repository<Player>,
  ) {}

  async startBattle(playerId: string) {
    // 1. Load data
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) {
      throw new NotFoundException('Player not found');
    }

    // 2. Business logic (delegate to pure functions)
    const result = simulateBattle(player.team, getRandomTeam());

    // 3. Persist results
    const battleLog = this.battleRepo.create({ ...result, playerId });
    await this.battleRepo.save(battleLog);

    // 4. Return minimal response
    return { battleId: battleLog.id };
  }
}
```

### Pure Functions for Complex Logic
```typescript
// ✅ REFERENCE: battle.simulator.ts
// Pure function: no side effects, deterministic output
export function simulateBattle(
  playerTypes: UnitType[],
  botTypes: UnitType[]
): BattleResult {
  // All state is local
  const units = createUnits(playerTypes, botTypes);
  const events: BattleEvent[] = [];
  
  // Computation only, no DB/API calls
  while (!isGameOver(units)) {
    events.push(...simulateRound(units));
  }
  
  return { events, winner: determineWinner(units) };
}
```

### Entity Pattern (Reference Implementation)
```typescript
// ✅ REFERENCE: player.entity.ts
@Entity()
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  guestId: string;

  @Column({ default: 'Guest' })
  name: string;

  @Column('json', { default: [] })
  team: string[];

  @Column({ default: 0 })
  wins: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations defined explicitly
  @OneToMany(() => BattleLog, (battle) => battle.player)
  battles: BattleLog[];
}
```

---

## Frontend Patterns (Next.js)

### Component Structure
```typescript
// ✅ REFERENCE: UnitCard.tsx
'use client';

import { UnitType, UNIT_INFO } from '@/types/game';

// Props interface at top
interface UnitCardProps {
  type: UnitType;
  selected?: boolean;
  onClick?: () => void;
}

// Component is a pure function of props
export function UnitCard({ type, selected, onClick }: UnitCardProps) {
  const info = UNIT_INFO[type];
  
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg ${info.color} ${selected ? 'ring-2' : ''}`}
    >
      <div className="text-4xl">{info.emoji}</div>
      <div className="font-bold">{type}</div>
    </button>
  );
}
```

### State Management Pattern
```typescript
// ✅ REFERENCE: gameStore.ts
import { create } from 'zustand';

interface GameState {
  // State
  player: Player | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  initPlayer: () => Promise<void>;
  startBattle: () => Promise<string>;
}

export const useGameStore = create<GameState>((set, get) => ({
  player: null,
  loading: false,
  error: null,

  initPlayer: async () => {
    set({ loading: true, error: null });
    try {
      const player = await api.getPlayer();
      set({ player, loading: false });
    } catch {
      set({ error: 'Failed to load', loading: false });
    }
  },

  startBattle: async () => {
    const { player } = get();
    // Use current state, call API, update state
    const { battleId } = await api.startBattle();
    return battleId;
  },
}));
```

### API Client Pattern
```typescript
// ✅ REFERENCE: lib/api.ts
const API_URL = 'http://localhost:3001';

// Centralized fetch with auth
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('guestToken');
  
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'x-guest-token': token }),
      ...options.headers,
    },
  });
  
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

// Typed API methods
export const api = {
  getPlayer: () => fetchApi<Player>('/player/me'),
  updateTeam: (team: UnitType[]) => fetchApi<Player>('/player/team', {
    method: 'PUT',
    body: JSON.stringify({ team }),
  }),
};
```

---

## File Naming Conventions

### Backend (NestJS)
| Type | Pattern | Example |
|------|---------|---------|
| Module | `feature.module.ts` | `battle.module.ts` |
| Controller | `feature.controller.ts` | `battle.controller.ts` |
| Service | `feature.service.ts` | `battle.service.ts` |
| Entity | `feature.entity.ts` | `player.entity.ts` |
| Guard | `feature.guard.ts` | `guest.guard.ts` |
| Pure Logic | `feature.purpose.ts` | `battle.simulator.ts` |

### Frontend (Next.js)
| Type | Pattern | Example |
|------|---------|---------|
| Page | `page.tsx` | `app/battle/[id]/page.tsx` |
| Component | `PascalCase.tsx` | `TeamBuilder.tsx` |
| Store | `featureStore.ts` | `gameStore.ts` |
| Types | `feature.ts` | `types/game.ts` |
| Utility | `camelCase.ts` | `lib/api.ts` |

---

## Error Handling

### Backend Errors
```typescript
// ✅ GOOD: Use NestJS exceptions
throw new NotFoundException('Player not found');
throw new BadRequestException('Team must have 3 units');

// ❌ BAD: Generic errors
throw new Error('Not found');
```

### Frontend Errors
```typescript
// ✅ GOOD: Graceful degradation with user feedback
try {
  await api.startBattle();
} catch {
  set({ error: 'Failed to start battle. Please try again.' });
}

// ❌ BAD: Silent failures
try {
  await api.startBattle();
} catch {
  // nothing
}
```

---

## Testing Standards

### Unit Test Structure
```typescript
describe('BattleSimulator', () => {
  describe('simulateBattle', () => {
    it('should return player as winner when bot team is eliminated', () => {
      const result = simulateBattle(['Warrior', 'Mage', 'Healer'], ['Healer']);
      expect(result.winner).toBe('player');
    });

    it('should be deterministic - same input produces same output', () => {
      const input = [['Warrior'], ['Mage']] as const;
      const result1 = simulateBattle(...input);
      const result2 = simulateBattle(...input);
      expect(result1).toEqual(result2);
    });
  });
});
```

### What to Test
| Layer | Test Focus |
|-------|------------|
| Pure Functions | All edge cases, determinism |
| Services | Business logic, error cases |
| Controllers | Request/response mapping |
| Components | User interactions, rendering |
| Store | State transitions |
