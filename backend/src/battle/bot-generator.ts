/**
 * Re-export bot generator from game module for backward compatibility.
 * @fileoverview All bot generation logic has been moved to game/battle/bot-generator.ts
 */

export {
  BotDifficulty,
  generateBotTeam,
  generateBotPositions,
  validateBotTeam,
} from '../game/battle/bot-generator';
