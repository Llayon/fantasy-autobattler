/**
 * Ability Animations Component for Fantasy Autobattler.
 * Provides visual effects for different ability types during battle replay.
 * 
 * @fileoverview CSS-based animations for abilities including projectiles, particles, and effects.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Position } from '@/types/game';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Base animation props interface.
 */
interface BaseAnimationProps {
  /** Position where animation occurs */
  position: Position;
  /** Callback when animation completes */
  onComplete: () => void;
  /** Animation duration in milliseconds */
  duration?: number;
}

/**
 * Projectile animation props for abilities like Fireball.
 */
interface ProjectileAnimationProps {
  /** Starting position of projectile */
  fromPosition: Position;
  /** Target position of projectile */
  toPosition: Position;
  /** Callback when animation completes */
  onComplete: () => void;
  /** Projectile type */
  type: 'fireball' | 'arrow' | 'lightning' | 'magic_missile';
  /** Animation duration in milliseconds */
  duration?: number;
}

/**
 * Area effect animation props for AoE abilities.
 */
interface AreaEffectAnimationProps {
  /** Center position of effect */
  position: Position;
  /** Radius of effect in grid cells */
  radius: number;
  /** Effect type */
  type: 'explosion' | 'heal_aura' | 'buff_aura' | 'debuff_aura';
  /** Callback when animation completes */
  onComplete: () => void;
  /** Animation duration in milliseconds */
  duration?: number;
}


// =============================================================================
// CONSTANTS
// =============================================================================

/** Grid cell size in pixels for positioning calculations (48px cell + 4px gap) */
const CELL_SIZE = 52; // 3rem (48px) + gap-1 (4px)

/** Default animation duration */
const DEFAULT_DURATION = 1000;

/** Animation timing functions */
const EASING = {
  easeOut: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeInOut: 'cubic-bezier(0.445, 0.05, 0.55, 0.95)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert grid position to pixel coordinates.
 * 
 * @param position - Grid position
 * @returns Pixel coordinates
 */
function gridToPixels(position: Position): { x: number; y: number } {
  return {
    x: position.x * CELL_SIZE + CELL_SIZE / 2,
    y: position.y * CELL_SIZE + CELL_SIZE / 2,
  };
}



/**
 * Calculate angle between two positions.
 * 
 * @param from - Starting position
 * @param to - Target position
 * @returns Angle in degrees
 */
function calculateAngle(from: Position, to: Position): number {
  const fromPixels = gridToPixels(from);
  const toPixels = gridToPixels(to);
  return Math.atan2(toPixels.y - fromPixels.y, toPixels.x - fromPixels.x) * 180 / Math.PI;
}

// =============================================================================
// PROJECTILE ANIMATIONS
// =============================================================================

/**
 * Fireball projectile animation.
 * Shows a fireball traveling from caster to target, then explodes.
 * 
 * @param props - Animation props
 * @returns JSX element
 */
export function FireballAnimation({
  fromPosition,
  toPosition,
  onComplete,
  duration = DEFAULT_DURATION,
}: ProjectileAnimationProps): JSX.Element {
  const [phase, setPhase] = useState<'travel' | 'explosion'>('travel');

  const fromPixels = gridToPixels(fromPosition);
  const toPixels = gridToPixels(toPosition);
  const angle = calculateAngle(fromPosition, toPosition);

  useEffect(() => {
    // Travel phase
    const travelTimer = setTimeout(() => {
      setPhase('explosion');
    }, duration * 0.7); // 70% of duration for travel

    // Complete animation
    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(travelTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Fireball projectile */}
      {phase === 'travel' && (
        <div
          className="absolute w-6 h-6 rounded-full bg-gradient-to-r from-red-500 to-orange-400 shadow-lg"
          style={{
            left: fromPixels.x - 12,
            top: fromPixels.y - 12,
            transform: `rotate(${angle}deg)`,
            animation: `fireballTravel ${duration * 0.7}ms ${EASING.easeOut} forwards`,
            '--target-x': `${toPixels.x - fromPixels.x}px`,
            '--target-y': `${toPixels.y - fromPixels.y}px`,
          } as React.CSSProperties}
        >
          {/* Fire trail */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-red-500 animate-pulse" />
          <div className="absolute inset-1 rounded-full bg-gradient-to-r from-white to-yellow-300 opacity-75" />

          {/* Flame particles */}
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-orange-400 rounded-full animate-bounce opacity-60" />
          <div className="absolute -bottom-1 -right-1 w-1 h-1 bg-red-500 rounded-full animate-pulse opacity-80" />
        </div>
      )}

      {/* Explosion effect */}
      {phase === 'explosion' && (
        <div
          className="absolute"
          style={{
            left: toPixels.x - 32,
            top: toPixels.y - 32,
          }}
        >
          {/* Main explosion */}
          <div
            className="w-16 h-16 rounded-full bg-gradient-radial from-white via-yellow-400 to-red-500 opacity-90"
            style={{
              animation: `fireballExplosion ${duration * 0.3}ms ${EASING.easeOut} forwards`,
            }}
          />

          {/* Explosion particles */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-orange-400 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-20px)`,
                animation: `explosionParticle ${duration * 0.3}ms ${EASING.easeOut} forwards`,
                animationDelay: `${i * 20}ms`,
              }}
            />
          ))}

          {/* Shockwave */}
          <div
            className="absolute inset-0 rounded-full border-2 border-orange-300 opacity-50"
            style={{
              animation: `shockwave ${duration * 0.3}ms ${EASING.easeOut} forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Lightning bolt animation for chain lightning ability.
 * 
 * @param props - Animation props
 * @returns JSX element
 */
export function LightningAnimation({
  fromPosition,
  toPosition,
  onComplete,
  duration = 800,
}: ProjectileAnimationProps): JSX.Element {
  const fromPixels = gridToPixels(fromPosition);
  const toPixels = gridToPixels(toPosition);

  useEffect(() => {
    const timer = setTimeout(onComplete, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Lightning bolt */}
      <svg
        className="absolute"
        style={{
          left: Math.min(fromPixels.x, toPixels.x) - 10,
          top: Math.min(fromPixels.y, toPixels.y) - 10,
          width: Math.abs(toPixels.x - fromPixels.x) + 20,
          height: Math.abs(toPixels.y - fromPixels.y) + 20,
        }}
      >
        <path
          d={`M ${fromPixels.x - Math.min(fromPixels.x, toPixels.x) + 10} ${fromPixels.y - Math.min(fromPixels.y, toPixels.y) + 10} L ${toPixels.x - Math.min(fromPixels.x, toPixels.x) + 10} ${toPixels.y - Math.min(fromPixels.y, toPixels.y) + 10}`}
          stroke="url(#lightningGradient)"
          strokeWidth="3"
          fill="none"
          className="animate-pulse"
          style={{
            animation: `lightningFlash ${duration}ms ${EASING.easeOut} forwards`,
          }}
        />

        <defs>
          <linearGradient id="lightningGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
        </defs>
      </svg>

      {/* Lightning impact */}
      <div
        className="absolute w-8 h-8 rounded-full bg-blue-300 opacity-75"
        style={{
          left: toPixels.x - 16,
          top: toPixels.y - 16,
          animation: `lightningImpact ${duration}ms ${EASING.easeOut} forwards`,
        }}
      />
    </div>
  );
}

// =============================================================================
// AREA EFFECT ANIMATIONS
// =============================================================================

/**
 * Healing aura animation for heal abilities.
 * Shows green particles and glowing effect.
 * 
 * @param props - Animation props
 * @returns JSX element
 */
export function HealAuraAnimation({
  position,
  radius,
  onComplete,
  duration = DEFAULT_DURATION,
}: AreaEffectAnimationProps): JSX.Element {
  const pixels = gridToPixels(position);
  const auraSize = radius * CELL_SIZE * 2;

  useEffect(() => {
    const timer = setTimeout(onComplete, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Healing aura */}
      <div
        className="absolute rounded-full bg-gradient-radial from-green-300/40 via-green-400/20 to-transparent"
        style={{
          left: pixels.x - auraSize / 2,
          top: pixels.y - auraSize / 2,
          width: auraSize,
          height: auraSize,
          animation: `healAura ${duration}ms ${EASING.easeOut} forwards`,
        }}
      />

      {/* Healing particles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full bg-green-400 opacity-80"
          style={{
            left: pixels.x - 6,
            top: pixels.y - 6,
            transform: `rotate(${i * 30}deg) translateY(-${20 + i * 5}px)`,
            animation: `healParticle ${duration}ms ${EASING.easeOut} forwards`,
            animationDelay: `${i * 50}ms`,
          }}
        >
          {/* Particle glow */}
          <div className="absolute inset-0 rounded-full bg-green-300 animate-pulse" />
          <div className="absolute inset-1 rounded-full bg-white opacity-60" />
        </div>
      ))}

      {/* Healing cross symbol */}
      <div
        className="absolute text-2xl text-green-400 font-bold"
        style={{
          left: pixels.x - 12,
          top: pixels.y - 12,
          animation: `healSymbol ${duration}ms ${EASING.bounce} forwards`,
        }}
      >
        ✚
      </div>
    </div>
  );
}

/**
 * Buff aura animation for positive effects.
 * Shows golden glow and sparkles.
 * 
 * @param props - Animation props
 * @returns JSX element
 */
export function BuffAuraAnimation({
  position,
  radius,
  onComplete,
  duration = DEFAULT_DURATION,
}: AreaEffectAnimationProps): JSX.Element {
  const pixels = gridToPixels(position);
  const auraSize = radius * CELL_SIZE * 2;

  useEffect(() => {
    const timer = setTimeout(onComplete, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Golden aura */}
      <div
        className="absolute rounded-full bg-gradient-radial from-yellow-300/50 via-yellow-400/30 to-transparent"
        style={{
          left: pixels.x - auraSize / 2,
          top: pixels.y - auraSize / 2,
          width: auraSize,
          height: auraSize,
          animation: `buffAura ${duration}ms ${EASING.easeOut} forwards`,
        }}
      />

      {/* Golden sparkles */}
      {[...Array(16)].map((_, i) => (
        <div
          key={i}
          className="absolute text-yellow-400 text-sm"
          style={{
            left: pixels.x - 8,
            top: pixels.y - 8,
            transform: `rotate(${i * 22.5}deg) translateY(-${15 + (i % 3) * 10}px)`,
            animation: `buffSparkle ${duration}ms ${EASING.easeOut} forwards`,
            animationDelay: `${i * 30}ms`,
          }}
        >
          ✨
        </div>
      ))}

      {/* Buff symbol */}
      <div
        className="absolute text-2xl text-yellow-400 font-bold"
        style={{
          left: pixels.x - 12,
          top: pixels.y - 12,
          animation: `buffSymbol ${duration}ms ${EASING.bounce} forwards`,
        }}
      >
        ⬆️
      </div>
    </div>
  );
}

/**
 * Debuff aura animation for negative effects.
 * Shows purple/dark energy and negative symbols.
 * 
 * @param props - Animation props
 * @returns JSX element
 */
export function DebuffAuraAnimation({
  position,
  radius,
  onComplete,
  duration = DEFAULT_DURATION,
}: AreaEffectAnimationProps): JSX.Element {
  const pixels = gridToPixels(position);
  const auraSize = radius * CELL_SIZE * 2;

  useEffect(() => {
    const timer = setTimeout(onComplete, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Dark aura */}
      <div
        className="absolute rounded-full bg-gradient-radial from-purple-500/50 via-purple-600/30 to-transparent"
        style={{
          left: pixels.x - auraSize / 2,
          top: pixels.y - auraSize / 2,
          width: auraSize,
          height: auraSize,
          animation: `debuffAura ${duration}ms ${EASING.easeOut} forwards`,
        }}
      />

      {/* Dark particles */}
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-purple-600 opacity-70"
          style={{
            left: pixels.x - 4,
            top: pixels.y - 4,
            transform: `rotate(${i * 36}deg) translateY(-${25 + i * 3}px)`,
            animation: `debuffParticle ${duration}ms ${EASING.easeOut} forwards`,
            animationDelay: `${i * 60}ms`,
          }}
        />
      ))}

      {/* Debuff symbol */}
      <div
        className="absolute text-2xl text-purple-400 font-bold"
        style={{
          left: pixels.x - 12,
          top: pixels.y - 12,
          animation: `debuffSymbol ${duration}ms ${EASING.bounce} forwards`,
        }}
      >
        ⬇️
      </div>
    </div>
  );
}

// =============================================================================
// STATUS EFFECT ANIMATIONS
// =============================================================================

/**
 * Stun animation showing stars circling around the target.
 * 
 * @param props - Animation props
 * @returns JSX element
 */
export function StunAnimation({
  position,
  onComplete,
  duration = DEFAULT_DURATION,
}: BaseAnimationProps): JSX.Element {
  const pixels = gridToPixels(position);

  useEffect(() => {
    const timer = setTimeout(onComplete, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Circling stars */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute text-yellow-300 text-lg"
          style={{
            left: pixels.x - 10,
            top: pixels.y - 30,
            transformOrigin: '10px 30px',
            animation: `stunStars ${duration}ms linear infinite`,
            animationDelay: `${i * 200}ms`,
          }}
        >
          ⭐
        </div>
      ))}

      {/* Dizzy effect */}
      <div
        className="absolute text-3xl text-yellow-400"
        style={{
          left: pixels.x - 15,
          top: pixels.y - 40,
          animation: `stunDizzy ${duration}ms ${EASING.easeInOut} infinite`,
        }}
      >
        💫
      </div>
    </div>
  );
}

/**
 * Shield animation showing protective barrier.
 * 
 * @param props - Animation props
 * @returns JSX element
 */
export function ShieldAnimation({
  position,
  onComplete,
  duration = DEFAULT_DURATION,
}: BaseAnimationProps): JSX.Element {
  const pixels = gridToPixels(position);

  useEffect(() => {
    const timer = setTimeout(onComplete, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Shield barrier */}
      <div
        className="absolute w-12 h-12 rounded-full border-4 border-blue-400 bg-blue-300/20"
        style={{
          left: pixels.x - 24,
          top: pixels.y - 24,
          animation: `shieldBarrier ${duration}ms ${EASING.easeOut} forwards`,
        }}
      />

      {/* Shield sparkles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-blue-300 rounded-full"
          style={{
            left: pixels.x - 2,
            top: pixels.y - 2,
            transform: `rotate(${i * 45}deg) translateY(-20px)`,
            animation: `shieldSparkle ${duration}ms ${EASING.easeOut} forwards`,
            animationDelay: `${i * 50}ms`,
          }}
        />
      ))}

      {/* Shield symbol */}
      <div
        className="absolute text-2xl text-blue-400"
        style={{
          left: pixels.x - 12,
          top: pixels.y - 12,
          animation: `shieldSymbol ${duration}ms ${EASING.bounce} forwards`,
        }}
      >
        🛡️
      </div>
    </div>
  );
}

// =============================================================================
// MAIN ABILITY ANIMATION COMPONENT
// =============================================================================

/**
 * Main ability animation component that renders appropriate animation based on ability type.
 * 
 * @param props - Animation configuration
 * @returns JSX element
 */
export interface AbilityAnimationProps {
  /** Type of ability animation */
  abilityType: 'fireball' | 'heal' | 'stun' | 'buff' | 'debuff' | 'shield' | 'lightning' | 'explosion';
  /** Animation configuration */
  config: {
    /** Source position (for projectiles) */
    fromPosition?: Position;
    /** Target position */
    toPosition: Position;
    /** Effect radius (for AoE) */
    radius?: number;
    /** Effect value */
    value?: number;
  };
  /** Callback when animation completes */
  onComplete: () => void;
  /** Animation duration in milliseconds */
  duration?: number;
}

/**
 * Renders the appropriate ability animation based on type.
 * 
 * @param props - Component props
 * @returns JSX element
 */
export function AbilityAnimation({
  abilityType,
  config,
  onComplete,
  duration = DEFAULT_DURATION,
}: AbilityAnimationProps): JSX.Element {
  switch (abilityType) {
    case 'fireball':
      return (
        <FireballAnimation
          fromPosition={config.fromPosition || { x: 0, y: 0 }}
          toPosition={config.toPosition}
          onComplete={onComplete}
          duration={duration}
          type="fireball"
        />
      );

    case 'lightning':
      return (
        <LightningAnimation
          fromPosition={config.fromPosition || { x: 0, y: 0 }}
          toPosition={config.toPosition}
          onComplete={onComplete}
          duration={duration}
          type="lightning"
        />
      );

    case 'heal':
      return (
        <HealAuraAnimation
          position={config.toPosition}
          radius={config.radius || 1}
          onComplete={onComplete}
          duration={duration}
          type="heal_aura"
        />
      );

    case 'buff':
      return (
        <BuffAuraAnimation
          position={config.toPosition}
          radius={config.radius || 1}
          onComplete={onComplete}
          duration={duration}
          type="buff_aura"
        />
      );

    case 'debuff':
      return (
        <DebuffAuraAnimation
          position={config.toPosition}
          radius={config.radius || 1}
          onComplete={onComplete}
          duration={duration}
          type="debuff_aura"
        />
      );

    case 'stun':
      return (
        <StunAnimation
          position={config.toPosition}
          onComplete={onComplete}
          duration={duration}
        />
      );

    case 'shield':
      return (
        <ShieldAnimation
          position={config.toPosition}
          onComplete={onComplete}
          duration={duration}
        />
      );

    default:
      // Fallback: simple flash effect
      return (
        <div
          className="absolute w-8 h-8 rounded-full bg-white opacity-75"
          style={{
            left: gridToPixels(config.toPosition).x - 16,
            top: gridToPixels(config.toPosition).y - 16,
            animation: `genericFlash ${duration}ms ${EASING.easeOut} forwards`,
          }}
          onAnimationEnd={onComplete}
        />
      );
  }
}

export default AbilityAnimation;