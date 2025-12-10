# 🚫 Antipatterns & Forbidden Practices

This document lists practices that are **explicitly forbidden** in this codebase. AI assistants and developers must avoid these patterns.

---

## ❌ Architecture Violations

### 1. Business Logic in Controllers
Controllers handle HTTP only. All logic goes in services.

```typescript
// ❌ FORBIDDEN: Logic in controller
@Post('start')
async startBattle(@Req() req: any) {
  const player = await this.playerRepo.findOne({ where: { id: req.player.id } });
  const botTeam = ['Warrior', 'Mage', 'Healer']; // Logic here!
  const result = simulateBattle(player.team, botTeam);
  // ... more logic
}

// ✅ CORRECT: Controller delegates to service
@Post('start')
async startBattle(@Req() req: any) {
  return this.battleService.startBattle(req.player.id);
}
```

### 2. Direct Database Access in Controllers
Controllers never import repositories or entities directly.

```typescript
// ❌ FORBIDDEN
@Controller('player')
export class PlayerController {
  constructor(
    @InjectRepository(Player) private repo: Repository<Player> // NO!
  ) {}
}

// ✅ CORRECT
@Controller('player')
export class PlayerController {
  constructor(private playerService: PlayerService) {}
}
```

### 3. API Calls in Components
Components render UI. Data fetching happens in stores or pages.

```typescript
// ❌ FORBIDDEN: Fetch in component
function TeamBuilder() {
  useEffect(() => {
    fetch('/api/player').then(r => r.json()).then(setPlayer);
  }, []);
}

// ✅ CORRECT: Use store
function TeamBuilder() {
  const { player, initPlayer } = useGameStore();
  useEffect(() => { initPlayer(); }, []);
}
```

---

## ❌ TypeScript Violations

### 4. Using `any` Type
Never use `any`. Use `unknown` and type guards if type is truly unknown.

```typescript
// ❌ FORBIDDEN
function process(data: any) {
  return data.value;
}

// ✅ CORRECT
function process(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String((data as { value: unknown }).value);
  }
  throw new Error('Invalid data');
}
```

### 5. Type Assertions Without Validation
Don't cast types without runtime checks.

```typescript
// ❌ FORBIDDEN
const player = response.data as Player;

// ✅ CORRECT
function isPlayer(data: unknown): data is Player {
  return typeof data === 'object' && data !== null && 'id' in data && 'name' in data;
}
const data = response.data;
if (!isPlayer(data)) throw new Error('Invalid response');
```

### 6. Non-Null Assertions (`!`)
Avoid `!` operator. Handle null cases explicitly.

```typescript
// ❌ FORBIDDEN
const name = player!.name;

// ✅ CORRECT
if (!player) throw new Error('Player not found');
const name = player.name;
```

---

## ❌ Database Violations

### 7. Raw SQL Queries
Always use TypeORM query builder or repository methods.

```typescript
// ❌ FORBIDDEN
await this.dataSource.query('SELECT * FROM player WHERE id = $1', [id]);

// ✅ CORRECT
await this.playerRepo.findOne({ where: { id } });
```

### 8. N+1 Queries
Load relations in single query, not in loops.

```typescript
// ❌ FORBIDDEN
const players = await this.playerRepo.find();
for (const player of players) {
  player.battles = await this.battleRepo.find({ where: { playerId: player.id } });
}

// ✅ CORRECT
const players = await this.playerRepo.find({ relations: ['battles'] });
```

### 9. Missing Database Transactions
Multi-step operations must be atomic.

```typescript
// ❌ FORBIDDEN: Non-atomic operations
await this.playerRepo.update(id, { wins: player.wins + 1 });
await this.battleRepo.save(battleLog);
// If second fails, first is already committed!

// ✅ CORRECT: Use transaction
await this.dataSource.transaction(async (manager) => {
  await manager.increment(Player, { id }, 'wins', 1);
  await manager.save(BattleLog, battleLog);
});
```

---

## ❌ State Management Violations

### 10. Direct State Mutation
Never mutate state directly. Always use set().

```typescript
// ❌ FORBIDDEN
const store = useGameStore();
store.player.name = 'New Name'; // Direct mutation!

// ✅ CORRECT
set((state) => ({ 
  player: state.player ? { ...state.player, name: 'New Name' } : null 
}));
```

### 11. Storing Derived State
Don't store values that can be computed.

```typescript
// ❌ FORBIDDEN
interface State {
  player: Player;
  winRate: number; // Derived from wins/losses!
}

// ✅ CORRECT: Compute in selector
const winRate = useMemo(() => {
  if (!player) return 0;
  const total = player.wins + player.losses;
  return total > 0 ? player.wins / total : 0;
}, [player]);
```

---

## ❌ Security Violations

### 12. Exposing Sensitive Data
Never return internal IDs or tokens in responses.

```typescript
// ❌ FORBIDDEN
return { player, guestToken: player.guestId }; // Exposes token!

// ✅ CORRECT
return { playerId: player.id, name: player.name };
```

### 13. Missing Input Validation
Always validate user input.

```typescript
// ❌ FORBIDDEN
async updateTeam(playerId: string, team: string[]) {
  return this.playerRepo.update(playerId, { team });
}

// ✅ CORRECT
async updateTeam(playerId: string, team: UnitType[]) {
  if (team.length !== 3) {
    throw new BadRequestException('Team must have 3 units');
  }
  const validTypes = ['Warrior', 'Mage', 'Healer'];
  if (!team.every(t => validTypes.includes(t))) {
    throw new BadRequestException('Invalid unit type');
  }
  return this.playerRepo.update(playerId, { team });
}
```

---

## ❌ Code Style Violations

### 14. Magic Numbers/Strings
Use named constants.

```typescript
// ❌ FORBIDDEN
if (team.length !== 3) { ... }
if (rounds > 50) { ... }

// ✅ CORRECT
const TEAM_SIZE = 3;
const MAX_ROUNDS = 50;

if (team.length !== TEAM_SIZE) { ... }
if (rounds > MAX_ROUNDS) { ... }
```

### 15. Inline Styles in React
Use Tailwind classes, not inline styles.

```typescript
// ❌ FORBIDDEN
<div style={{ backgroundColor: 'red', padding: '16px' }}>

// ✅ CORRECT
<div className="bg-red-500 p-4">
```

### 16. Console.log in Production Code
Use proper logging or remove debug statements.

```typescript
// ❌ FORBIDDEN
console.log('Player:', player);

// ✅ CORRECT: Use NestJS Logger
this.logger.debug(`Player loaded: ${player.id}`);
```

### 17. Commented-Out Code
Delete unused code. Git has history.

```typescript
// ❌ FORBIDDEN
// const oldLogic = () => { ... };
// if (featureFlag) { ... }

// ✅ CORRECT: Just delete it
```

---

## ❌ Async Violations

### 18. Missing Error Handling in Async
Always handle promise rejections.

```typescript
// ❌ FORBIDDEN
async function loadData() {
  const data = await api.getData(); // Unhandled rejection!
  return data;
}

// ✅ CORRECT
async function loadData() {
  try {
    return await api.getData();
  } catch (error) {
    throw new Error('Failed to load data');
  }
}
```

### 19. Fire-and-Forget Promises
Don't ignore promise results.

```typescript
// ❌ FORBIDDEN
saveAnalytics(event); // Promise ignored!

// ✅ CORRECT
await saveAnalytics(event);
// OR if truly fire-and-forget:
saveAnalytics(event).catch(err => logger.error(err));
```

---

## ❌ Testing Violations

### 20. Testing Implementation Details
Test behavior, not internals.

```typescript
// ❌ FORBIDDEN: Testing private method
expect(service['privateMethod']()).toBe(true);

// ✅ CORRECT: Test public interface
expect(await service.startBattle(playerId)).toHaveProperty('battleId');
```

### 21. Mocking Everything
Don't mock what you're testing.

```typescript
// ❌ FORBIDDEN: Mocking the thing under test
jest.mock('./battle.simulator');
const result = simulateBattle(team1, team2); // Testing a mock!

// ✅ CORRECT: Test real implementation
const result = simulateBattle(team1, team2);
expect(result.winner).toBeDefined();
```

---

## Summary Checklist

Before committing code, verify:

- [ ] No business logic in controllers
- [ ] No direct DB access outside services
- [ ] No `any` types
- [ ] No raw SQL queries
- [ ] No magic numbers
- [ ] No inline styles
- [ ] No console.log
- [ ] No commented-out code
- [ ] All promises handled
- [ ] Input validated
