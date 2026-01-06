/**
 * Демонстрационный тест для проверки работы механик 2.0
 * 
 * Запуск: npx jest --testPathPattern="mechanics-demo" --verbose --forceExit
 */

import { simulateBattle, TeamSetup } from '../../battle/battle.simulator';
import { getUnitTemplate, UnitId } from '../../unit/unit.data';
import { Position } from '../../types/game.types';
import {
  createMechanicsProcessor,
  ROGUELIKE_PRESET,
} from './index';

/**
 * Создает команду из юнитов
 */
const createTeam = (unitIds: UnitId[], positions: Position[]): TeamSetup => {
  const units = unitIds.map((id) => {
    const template = getUnitTemplate(id);
    if (!template) throw new Error(`Unit not found: ${id}`);
    return template;
  });
  return { units, positions };
};

describe('Демонстрация механик 2.0', () => {
  const seed = 12345;

  // Команды для теста
  const playerTeam = createTeam(
    ['knight', 'archer'],
    [{ x: 2, y: 0 }, { x: 4, y: 1 }],
  );

  const enemyTeam = createTeam(
    ['rogue', 'mage'],
    [{ x: 2, y: 9 }, { x: 4, y: 8 }],
  );

  it('MVP пресет (без механик) vs Roguelike пресет (все механики)', () => {
    // Бой без механик
    const mvpResult = simulateBattle(playerTeam, enemyTeam, seed);

    // Бой со всеми механиками
    const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
    const roguelikeResult = simulateBattle(playerTeam, enemyTeam, seed, processor);

    // Вывод результатов для сравнения
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('СРАВНЕНИЕ РЕЗУЛЬТАТОВ БОЯ');
    console.log('═══════════════════════════════════════════════════════');
    
    console.log('\n📊 MVP PRESET (без механик):');
    console.log(`   Победитель: ${mvpResult.winner}`);
    console.log(`   Раундов: ${mvpResult.metadata.totalRounds}`);
    console.log(`   Событий: ${mvpResult.events.length}`);
    
    console.log('\n📊 ROGUELIKE PRESET (все 14 механик):');
    console.log(`   Победитель: ${roguelikeResult.winner}`);
    console.log(`   Раундов: ${roguelikeResult.metadata.totalRounds}`);
    console.log(`   Событий: ${roguelikeResult.events.length}`);

    // Проверяем финальное состояние юнитов
    console.log('\n📋 Финальное состояние (MVP):');
    mvpResult.finalState.playerUnits.forEach(u => {
      console.log(`   ${u.instanceId}: HP=${u.currentHp}, alive=${u.alive}`);
    });
    mvpResult.finalState.botUnits.forEach(u => {
      console.log(`   ${u.instanceId}: HP=${u.currentHp}, alive=${u.alive}`);
    });

    console.log('\n📋 Финальное состояние (Roguelike):');
    roguelikeResult.finalState.playerUnits.forEach(u => {
      console.log(`   ${u.instanceId}: HP=${u.currentHp}, alive=${u.alive}`);
    });
    roguelikeResult.finalState.botUnits.forEach(u => {
      console.log(`   ${u.instanceId}: HP=${u.currentHp}, alive=${u.alive}`);
    });

    console.log('\n═══════════════════════════════════════════════════════\n');

    // Тест проходит если оба боя завершились
    expect(mvpResult.winner).toBeDefined();
    expect(roguelikeResult.winner).toBeDefined();
  });

  it('Проверка Armor Shred механики', () => {
    // Создаем процессор только с Armor Shred
    const shredProcessor = createMechanicsProcessor({
      armorShred: {
        shredPerAttack: 2,
        maxShredPercent: 0.5,
        decayPerTurn: 0,
      },
    });

    const result = simulateBattle(playerTeam, enemyTeam, seed, shredProcessor);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('ТЕСТ ARMOR SHRED');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Победитель: ${result.winner}`);
    console.log(`Раундов: ${result.metadata.totalRounds}`);
    
    // Ищем события атаки
    const attackEvents = result.events.filter(e => e.type === 'attack');
    console.log(`Атак: ${attackEvents.length}`);
    console.log('═══════════════════════════════════════════════════════\n');

    expect(result.winner).toBeDefined();
  });
});
