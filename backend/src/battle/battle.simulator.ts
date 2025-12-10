import { UnitStats, UnitType, createUnit } from '../unit/unit.data';
import { BATTLE_LIMITS, GAMEPLAY_VALUES } from '../config/game.constants';

export interface BattleUnit extends UnitStats {
  id: string;
  team: 'player' | 'bot';
  alive: boolean;
}

export interface BattleEvent {
  round: number;
  actor: string;
  action: 'attack' | 'heal' | 'splash';
  target?: string;
  targets?: string[];
  damage?: number;
  damages?: number[];
  value?: number;
  killed?: string[];
}

export interface BattleResult {
  playerTeam: UnitStats[];
  botTeam: UnitStats[];
  events: BattleEvent[];
  winner: 'player' | 'bot' | 'draw';
}

function createBattleUnit(type: UnitType, team: 'player' | 'bot', index: number): BattleUnit {
  const stats = createUnit(type);
  return {
    ...stats,
    id: `${team}-${type}-${index}`,
    team,
    alive: true,
  };
}

/**
 * Calculate damage dealt by attacker to defender.
 * Formula: max(MIN_DAMAGE, ATK - DEF)
 * 
 * @param attacker - The attacking unit
 * @param defender - The defending unit
 * @returns Calculated damage value (minimum 1)
 */
function calculateDamage(attacker: BattleUnit, defender: BattleUnit): number {
  return Math.max(BATTLE_LIMITS.MIN_DAMAGE, attacker.atk - defender.def);
}

function getAliveUnits(units: BattleUnit[], team?: 'player' | 'bot'): BattleUnit[] {
  return units.filter(u => u.alive && (team === undefined || u.team === team));
}

function getLowestHpAlly(units: BattleUnit[], team: 'player' | 'bot'): BattleUnit | null {
  const allies = getAliveUnits(units, team).filter(u => u.hp < u.maxHp);
  if (allies.length === 0) return null;
  return allies.reduce((lowest, u) => (u.hp < lowest.hp ? u : lowest));
}

function getEnemyTarget(units: BattleUnit[], attackerTeam: 'player' | 'bot'): BattleUnit | null {
  const enemyTeam = attackerTeam === 'player' ? 'bot' : 'player';
  const enemies = getAliveUnits(units, enemyTeam);
  if (enemies.length === 0) return null;
  
  // Prioritize Warriors (taunt)
  const warriors = enemies.filter(e => e.type === 'Warrior');
  if (warriors.length > 0) return warriors[0] || null;
  
  return enemies[0] || null;
}

function getSplashTargets(units: BattleUnit[], attackerTeam: 'player' | 'bot'): BattleUnit[] {
  const enemyTeam = attackerTeam === 'player' ? 'bot' : 'player';
  const enemies = getAliveUnits(units, enemyTeam);
  return enemies.slice(0, 2);
}

export function simulateBattle(playerTypes: UnitType[], botTypes: UnitType[]): BattleResult {
  const playerTeamStats = playerTypes.map(t => createUnit(t));
  const botTeamStats = botTypes.map(t => createUnit(t));
  
  const units: BattleUnit[] = [
    ...playerTypes.map((t, i) => createBattleUnit(t, 'player', i)),
    ...botTypes.map((t, i) => createBattleUnit(t, 'bot', i)),
  ];

  const events: BattleEvent[] = [];
  let round = 0;
  const maxRounds = BATTLE_LIMITS.MAX_ROUNDS;

  while (round < maxRounds) {
    round++;
    
    // Sort by speed (descending)
    const turnOrder = getAliveUnits(units).sort((a, b) => b.spd - a.spd);
    
    for (const actor of turnOrder) {
      if (!actor.alive) continue;
      
      const event: BattleEvent = { round, actor: actor.id, action: 'attack' };
      
      if (actor.type === 'Healer') {
        const healTarget = getLowestHpAlly(units, actor.team);
        if (healTarget) {
          event.action = 'heal';
          event.target = healTarget.id;
          event.value = GAMEPLAY_VALUES.HEAL_AMOUNT;
          healTarget.hp = Math.min(healTarget.maxHp, healTarget.hp + GAMEPLAY_VALUES.HEAL_AMOUNT);
          events.push(event);
          continue;
        }
      }
      
      if (actor.type === 'Mage') {
        const targets = getSplashTargets(units, actor.team);
        if (targets.length > 0) {
          event.action = 'splash';
          event.targets = targets.map(t => t.id);
          event.damages = [];
          event.killed = [];
          
          for (const target of targets) {
            const dmg = calculateDamage(actor, target);
            target.hp -= dmg;
            event.damages.push(dmg);
            if (target.hp <= 0) {
              target.alive = false;
              event.killed.push(target.id);
            }
          }
          events.push(event);
          continue;
        }
      }
      
      // Default attack (Warrior or fallback)
      const target = getEnemyTarget(units, actor.team);
      if (target) {
        event.target = target.id;
        event.damage = calculateDamage(actor, target);
        target.hp -= event.damage;
        if (target.hp <= 0) {
          target.alive = false;
          event.killed = [target.id];
        }
        events.push(event);
      }
    }
    
    // Check win condition
    const playerAlive = getAliveUnits(units, 'player').length > 0;
    const botAlive = getAliveUnits(units, 'bot').length > 0;
    
    if (!playerAlive || !botAlive) {
      const winner = playerAlive ? 'player' : botAlive ? 'bot' : 'draw';
      return { playerTeam: playerTeamStats, botTeam: botTeamStats, events, winner };
    }
  }

  return { playerTeam: playerTeamStats, botTeam: botTeamStats, events, winner: 'draw' };
}
