/**
 * BattleAnimations component for Fantasy Autobattler.
 * Provides smooth CSS animations for battle events.
 * 
 * @fileoverview Animation components for unit movement, attacks, damage, death, and healing.
 */

'use client';

import { useEffect, useState } from 'react';
import { Position } from '@/types/game';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Animation configuration interface.
 */
interface AnimationConfig {
  /** Animation duration in milliseconds */
  duration: number;
  /** Animation easing function */
  easing: string;
  /** Animation delay in milliseconds */
  delay?: number;
}

/**
 * Move animation props.
 */
interface MoveAnimationProps {
  /** Starting position */
  fromPosition: Position;
  /** Target position */
  toPosition: Position;
  /** Animation configuration */
  config?: AnimationConfig;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * Attack animation props.
 */
interface AttackAnimationProps {
  /** Attacker position */
  attackerPosition: Position;
  /** Target position */
  targetPosition: Position;
  /** Animation configuration */
  config?: AnimationConfig;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * Damage number animation props.
 */
interface DamageNumberProps {
  /** Damage amount */
  damage: number;
  /** Position to display damage */
  position: Position;
  /** Animation configuration */
  config?: AnimationConfig;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * Death animation props.
 */
interface DeathAnimationProps {
  /** Unit position */
  position: Position;
  /** Animation configuration */
  config?: AnimationConfig;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * Heal animation props.
 */
interface HealAnimationProps {
  /** Healing amount */
  healing: number;
  /** Position to display healing */
  position: Position;
  /** Animation configuration */
  config?: AnimationConfig;
  /** Callback when animation completes */
  onComplete?: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default animation configuration */
const DEFAULT_CONFIG: AnimationConfig = {
  duration: 800,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  delay: 0,
};

/** Cell size in pixels for position calculations
 * Grid width: 3.25rem per column = 52px
 * Cell: w-12 = 48px, gap-1 = 4px between cells
 * For 8 columns: 8 * 48px + 7 * 4px = 412px total
 * Per column with gap: 412 / 8 = 51.5px ≈ 52px
 */
const CELL_SIZE = 52;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert grid position to pixel coordinates.
 * 
 * @param position - Grid position
 * @returns Pixel coordinates
 * @example
 * const coords = positionToPixels({ x: 2, y: 3 });
 */
function positionToPixels(position: Position): { x: number; y: number } {
  return {
    x: position.x * CELL_SIZE,
    y: position.y * CELL_SIZE,
  };
}

/**
 * Calculate distance between two positions.
 * 
 * @param from - Starting position
 * @param to - Target position
 * @returns Distance in pixels
 * @example
 * const distance = calculateDistance(pos1, pos2);
 */
function calculateDistance(from: Position, to: Position): number {
  const fromPixels = positionToPixels(from);
  const toPixels = positionToPixels(to);
  
  return Math.sqrt(
    Math.pow(toPixels.x - fromPixels.x, 2) + 
    Math.pow(toPixels.y - fromPixels.y, 2)
  );
}

/**
 * Calculate angle between two positions in degrees.
 * 
 * @param from - Starting position
 * @param to - Target position
 * @returns Angle in degrees
 * @example
 * const angle = calculateAngle(attackerPos, targetPos);
 */
function calculateAngle(from: Position, to: Position): number {
  const fromPixels = positionToPixels(from);
  const toPixels = positionToPixels(to);
  
  const deltaX = toPixels.x - fromPixels.x;
  const deltaY = toPixels.y - fromPixels.y;
  
  return Math.atan2(deltaY, deltaX) * (180 / Math.PI);
}

// =============================================================================
// ANIMATION COMPONENTS
// =============================================================================

/**
 * Move animation component.
 * Smoothly animates unit movement from one position to another.
 * 
 * @param props - Move animation props
 * @returns Move animation component
 * @example
 * <MoveAnimation 
 *   fromPosition={{ x: 0, y: 0 }} 
 *   toPosition={{ x: 2, y: 1 }} 
 *   onComplete={() => console.log('Move complete')} 
 * />
 */
export function MoveAnimation({ 
  fromPosition, 
  toPosition, 
  config = DEFAULT_CONFIG,
  onComplete 
}: MoveAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  
  const fromPixels = positionToPixels(fromPosition);
  const toPixels = positionToPixels(toPosition);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      onComplete?.();
    }, config.duration + (config.delay || 0));
    
    return () => clearTimeout(timer);
  }, [config.duration, config.delay, onComplete]);
  
  if (!isAnimating) return null;
  
  return (
    <div
      className="absolute pointer-events-none z-20"
      style={{
        left: `${fromPixels.x}px`,
        top: `${fromPixels.y}px`,
        width: `${CELL_SIZE}px`,
        height: `${CELL_SIZE}px`,
        transform: `translate(${toPixels.x - fromPixels.x}px, ${toPixels.y - fromPixels.y}px)`,
        transition: `transform ${config.duration}ms ${config.easing}`,
        transitionDelay: `${config.delay || 0}ms`,
      }}
    >
      <div className="w-full h-full bg-yellow-400/30 border-2 border-yellow-400 rounded animate-pulse">
        <div className="w-full h-full flex items-center justify-center text-2xl">
          🏃
        </div>
      </div>
    </div>
  );
}

/**
 * Attack animation component.
 * Shows attack direction and impact effect.
 * 
 * @param props - Attack animation props
 * @returns Attack animation component
 * @example
 * <AttackAnimation 
 *   attackerPosition={{ x: 0, y: 0 }} 
 *   targetPosition={{ x: 1, y: 0 }} 
 *   onComplete={() => console.log('Attack complete')} 
 * />
 */
export function AttackAnimation({ 
  attackerPosition, 
  targetPosition, 
  config = DEFAULT_CONFIG,
  onComplete 
}: AttackAnimationProps) {
  const [phase, setPhase] = useState<'windup' | 'strike' | 'complete'>('windup');
  
  const attackerPixels = positionToPixels(attackerPosition);
  const targetPixels = positionToPixels(targetPosition);
  const angle = calculateAngle(attackerPosition, targetPosition);
  
  useEffect(() => {
    const windupTimer = setTimeout(() => {
      setPhase('strike');
    }, config.duration * 0.3);
    
    const strikeTimer = setTimeout(() => {
      setPhase('complete');
      onComplete?.();
    }, config.duration);
    
    return () => {
      clearTimeout(windupTimer);
      clearTimeout(strikeTimer);
    };
  }, [config.duration, onComplete]);
  
  if (phase === 'complete') return null;
  
  return (
    <>
      {/* Attack line/projectile */}
      <div
        className="absolute pointer-events-none z-20"
        style={{
          left: `${attackerPixels.x + CELL_SIZE / 2}px`,
          top: `${attackerPixels.y + CELL_SIZE / 2}px`,
          width: `${calculateDistance(attackerPosition, targetPosition)}px`,
          height: '4px',
          background: phase === 'windup' 
            ? 'linear-gradient(90deg, transparent, orange, transparent)' 
            : 'linear-gradient(90deg, transparent, red, orange, red, transparent)',
          transform: `rotate(${angle}deg)`,
          transformOrigin: '0 50%',
          opacity: phase === 'windup' ? 0.6 : 1,
          animation: phase === 'strike' ? 'attackFlash 200ms ease-in-out' : undefined,
        }}
      />
      
      {/* Impact effect at target */}
      {phase === 'strike' && (
        <div
          className="absolute pointer-events-none z-30"
          style={{
            left: `${targetPixels.x}px`,
            top: `${targetPixels.y}px`,
            width: `${CELL_SIZE}px`,
            height: `${CELL_SIZE}px`,
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-4xl animate-ping">💥</div>
          </div>
        </div>
      )}
      
      {/* Attacker highlight */}
      <div
        className="absolute pointer-events-none z-10"
        style={{
          left: `${attackerPixels.x}px`,
          top: `${attackerPixels.y}px`,
          width: `${CELL_SIZE}px`,
          height: `${CELL_SIZE}px`,
        }}
      >
        <div className={`
          w-full h-full border-4 rounded transition-all duration-300
          ${phase === 'windup' 
            ? 'border-orange-400 bg-orange-400/20 scale-110' 
            : 'border-red-500 bg-red-500/30 scale-105'
          }
        `} />
      </div>
    </>
  );
}

/**
 * Damage number animation component.
 * Shows floating damage numbers with fade-out effect.
 * 
 * @param props - Damage number props
 * @returns Damage number component
 * @example
 * <DamageNumber 
 *   damage={15} 
 *   position={{ x: 2, y: 3 }} 
 *   onComplete={() => console.log('Damage shown')} 
 * />
 */
export function DamageNumber({ 
  damage, 
  position, 
  config = DEFAULT_CONFIG,
  onComplete 
}: DamageNumberProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  const pixels = positionToPixels(position);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, config.duration);
    
    return () => clearTimeout(timer);
  }, [config.duration, onComplete]);
  
  if (!isVisible) return null;
  
  return (
    <div
      className="absolute pointer-events-none z-40 flex items-center justify-center"
      style={{
        left: `${pixels.x}px`,
        top: `${pixels.y - 20}px`,
        width: `${CELL_SIZE}px`,
        height: '40px',
        animation: `damageFloat ${config.duration}ms ${config.easing} forwards`,
      }}
    >
      <div className="bg-red-600 text-white font-bold px-2 py-1 rounded shadow-lg border-2 border-red-400">
        -{damage}
      </div>
    </div>
  );
}

/**
 * Death animation component.
 * Shows unit death with fade and scale effects.
 * 
 * @param props - Death animation props
 * @returns Death animation component
 * @example
 * <DeathAnimation 
 *   position={{ x: 2, y: 3 }} 
 *   onComplete={() => console.log('Death complete')} 
 * />
 */
export function DeathAnimation({ 
  position, 
  config = DEFAULT_CONFIG,
  onComplete 
}: DeathAnimationProps) {
  const [phase, setPhase] = useState<'collapse' | 'fade' | 'complete'>('collapse');
  
  const pixels = positionToPixels(position);
  
  useEffect(() => {
    const collapseTimer = setTimeout(() => {
      setPhase('fade');
    }, config.duration * 0.6);
    
    const fadeTimer = setTimeout(() => {
      setPhase('complete');
      onComplete?.();
    }, config.duration);
    
    return () => {
      clearTimeout(collapseTimer);
      clearTimeout(fadeTimer);
    };
  }, [config.duration, onComplete]);
  
  if (phase === 'complete') return null;
  
  return (
    <div
      className="absolute pointer-events-none z-30"
      style={{
        left: `${pixels.x}px`,
        top: `${pixels.y}px`,
        width: `${CELL_SIZE}px`,
        height: `${CELL_SIZE}px`,
      }}
    >
      <div className={`
        w-full h-full flex items-center justify-center transition-all duration-500
        ${phase === 'collapse' 
          ? 'scale-110 opacity-100' 
          : 'scale-50 opacity-0'
        }
      `}>
        <div className="text-3xl">💀</div>
      </div>
      
      {/* Death particles */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-red-500 rounded-full"
            style={{
              left: '50%',
              top: '50%',
              animation: `deathParticle${i} ${config.duration}ms ease-out forwards`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Heal animation component.
 * Shows green healing particles and numbers.
 * 
 * @param props - Heal animation props
 * @returns Heal animation component
 * @example
 * <HealAnimation 
 *   healing={10} 
 *   position={{ x: 2, y: 3 }} 
 *   onComplete={() => console.log('Heal complete')} 
 * />
 */
export function HealAnimation({ 
  healing, 
  position, 
  config = DEFAULT_CONFIG,
  onComplete 
}: HealAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  const pixels = positionToPixels(position);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, config.duration);
    
    return () => clearTimeout(timer);
  }, [config.duration, onComplete]);
  
  if (!isVisible) return null;
  
  return (
    <div
      className="absolute pointer-events-none z-40"
      style={{
        left: `${pixels.x}px`,
        top: `${pixels.y}px`,
        width: `${CELL_SIZE}px`,
        height: `${CELL_SIZE}px`,
      }}
    >
      {/* Healing number */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: '0',
          top: '-20px',
          width: `${CELL_SIZE}px`,
          height: '40px',
          animation: `healFloat ${config.duration}ms ${config.easing} forwards`,
        }}
      >
        <div className="bg-green-600 text-white font-bold px-2 py-1 rounded shadow-lg border-2 border-green-400">
          +{healing}
        </div>
      </div>
      
      {/* Healing particles */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-green-400 rounded-full opacity-80"
            style={{
              left: '50%',
              top: '50%',
              animation: `healParticle${i} ${config.duration}ms ease-out forwards`,
            }}
          />
        ))}
      </div>
      
      {/* Healing glow */}
      <div className="absolute inset-0 bg-green-400/20 rounded-full animate-pulse" />
    </div>
  );
}

// =============================================================================
// CSS ANIMATIONS (to be added to global styles)
// =============================================================================

/**
 * CSS keyframes for animations.
 * Add these to your global CSS file or use a CSS-in-JS solution.
 */
export const ANIMATION_STYLES = `
  @keyframes attackFlash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  
  @keyframes damageFloat {
    0% { 
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    50% {
      transform: translateY(-20px) scale(1.2);
      opacity: 1;
    }
    100% { 
      transform: translateY(-40px) scale(0.8);
      opacity: 0;
    }
  }
  
  @keyframes healFloat {
    0% { 
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    50% {
      transform: translateY(-15px) scale(1.1);
      opacity: 1;
    }
    100% { 
      transform: translateY(-30px) scale(0.9);
      opacity: 0;
    }
  }
  
  @keyframes deathParticle0 {
    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    100% { transform: translate(-70px, -70px) scale(0); opacity: 0; }
  }
  
  @keyframes deathParticle1 {
    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    100% { transform: translate(70px, -70px) scale(0); opacity: 0; }
  }
  
  @keyframes deathParticle2 {
    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    100% { transform: translate(-70px, 70px) scale(0); opacity: 0; }
  }
  
  @keyframes deathParticle3 {
    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    100% { transform: translate(70px, 70px) scale(0); opacity: 0; }
  }
  
  @keyframes deathParticle4 {
    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    100% { transform: translate(0, -80px) scale(0); opacity: 0; }
  }
  
  @keyframes deathParticle5 {
    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    100% { transform: translate(0, 80px) scale(0); opacity: 0; }
  }
  
  @keyframes healParticle0 {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
    50% { transform: translate(-30px, -40px) scale(1); opacity: 0.8; }
    100% { transform: translate(-50px, -80px) scale(0); opacity: 0; }
  }
  
  @keyframes healParticle1 {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
    50% { transform: translate(30px, -40px) scale(1); opacity: 0.8; }
    100% { transform: translate(50px, -80px) scale(0); opacity: 0; }
  }
  
  @keyframes healParticle2 {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
    50% { transform: translate(-40px, -20px) scale(1); opacity: 0.8; }
    100% { transform: translate(-60px, -60px) scale(0); opacity: 0; }
  }
  
  @keyframes healParticle3 {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
    50% { transform: translate(40px, -20px) scale(1); opacity: 0.8; }
    100% { transform: translate(60px, -60px) scale(0); opacity: 0; }
  }
  
  @keyframes healParticle4 {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
    50% { transform: translate(-20px, -50px) scale(1); opacity: 0.8; }
    100% { transform: translate(-40px, -100px) scale(0); opacity: 0; }
  }
  
  @keyframes healParticle5 {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
    50% { transform: translate(20px, -50px) scale(1); opacity: 0.8; }
    100% { transform: translate(40px, -100px) scale(0); opacity: 0; }
  }
  
  @keyframes healParticle6 {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
    50% { transform: translate(0px, -45px) scale(1); opacity: 0.8; }
    100% { transform: translate(0px, -90px) scale(0); opacity: 0; }
  }
  
  @keyframes healParticle7 {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
    50% { transform: translate(-10px, -30px) scale(1); opacity: 0.8; }
    100% { transform: translate(-20px, -70px) scale(0); opacity: 0; }
  }
`;