/**
 * ZoomableGrid wrapper for mobile pinch-to-zoom functionality.
 * Provides touch gestures and zoom controls for BattleGrid component.
 * 
 * @fileoverview Mobile-optimized zoom wrapper with gesture support.
 */

'use client';

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Transform state for zoom and pan.
 */
interface TransformState {
  /** Zoom scale factor */
  scale: number;
  /** X translation in pixels */
  translateX: number;
  /** Y translation in pixels */
  translateY: number;
}

/**
 * Touch point for gesture tracking.
 */
interface TouchPoint {
  /** Touch identifier */
  id: number;
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
}

/**
 * ZoomableGrid component props.
 */
interface ZoomableGridProps {
  /** Child content to make zoomable */
  children: ReactNode;
  /** Minimum zoom scale */
  minScale?: number;
  /** Maximum zoom scale */
  maxScale?: number;
  /** Initial zoom scale */
  initialScale?: number;
  /** Whether zoom is enabled */
  enabled?: boolean;
  /** Custom CSS classes */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default zoom limits */
const DEFAULT_MIN_SCALE = 0.5;
const DEFAULT_MAX_SCALE = 3.0;
const DEFAULT_INITIAL_SCALE = 1.0;

/** Zoom step for buttons */
const ZOOM_STEP = 0.25;

/** Animation duration for smooth transitions */
const ANIMATION_DURATION = 200;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Clamp value between min and max.
 * 
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate distance between two points.
 * 
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Distance in pixels
 */
function getDistance(p1: TouchPoint, p2: TouchPoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get center point between two touches.
 * 
 * @param p1 - First touch point
 * @param p2 - Second touch point
 * @returns Center point
 */
function getCenter(p1: TouchPoint, p2: TouchPoint): { x: number; y: number } {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

/**
 * Convert touch to point.
 * 
 * @param touch - Touch object
 * @returns Touch point
 */
function touchToPoint(touch: Touch): TouchPoint {
  return {
    id: touch.identifier,
    x: touch.clientX,
    y: touch.clientY,
  };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * ZoomableGrid component with pinch-to-zoom and pan support.
 * Wraps content with touch gesture handling for mobile devices.
 * 
 * @example
 * <ZoomableGrid minScale={0.5} maxScale={2.0}>
 *   <BattleGrid units={units} onCellClick={handleClick} />
 * </ZoomableGrid>
 */
export function ZoomableGrid({
  children,
  minScale = DEFAULT_MIN_SCALE,
  maxScale = DEFAULT_MAX_SCALE,
  initialScale = DEFAULT_INITIAL_SCALE,
  enabled = true,
  className = '',
}: ZoomableGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [transform, setTransform] = useState<TransformState>({
    scale: initialScale,
    translateX: 0,
    translateY: 0,
  });
  
  const [isGesturing, setIsGesturing] = useState(false);
  const [lastTouches, setLastTouches] = useState<TouchPoint[]>([]);
  const [lastDistance, setLastDistance] = useState(0);
  const [lastCenter, setLastCenter] = useState({ x: 0, y: 0 });

  /**
   * Reset transform to initial state.
   */
  const resetTransform = useCallback(() => {
    setTransform({
      scale: initialScale,
      translateX: 0,
      translateY: 0,
    });
  }, [initialScale]);

  /**
   * Zoom in by step amount.
   */
  const zoomIn = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: clamp(prev.scale + ZOOM_STEP, minScale, maxScale),
    }));
  }, [minScale, maxScale]);

  /**
   * Zoom out by step amount.
   */
  const zoomOut = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: clamp(prev.scale - ZOOM_STEP, minScale, maxScale),
    }));
  }, [minScale, maxScale]);

  /**
   * Handle touch start event.
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    
    e.preventDefault();
    
    const touches = Array.from(e.touches).map(touchToPoint);
    setLastTouches(touches);
    
    if (touches.length === 2) {
      setIsGesturing(true);
      const distance = getDistance(touches[0], touches[1]);
      const center = getCenter(touches[0], touches[1]);
      setLastDistance(distance);
      setLastCenter(center);
    }
  }, [enabled]);

  /**
   * Handle touch move event.
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || !isGesturing) return;
    
    e.preventDefault();
    
    const touches = Array.from(e.touches).map(touchToPoint);
    
    if (touches.length === 2 && lastTouches.length === 2) {
      const distance = getDistance(touches[0], touches[1]);
      const center = getCenter(touches[0], touches[1]);
      
      // Calculate scale change
      const scaleChange = distance / lastDistance;
      const newScale = clamp(transform.scale * scaleChange, minScale, maxScale);
      
      // Calculate translation change
      const deltaX = center.x - lastCenter.x;
      const deltaY = center.y - lastCenter.y;
      
      setTransform(prev => ({
        scale: newScale,
        translateX: prev.translateX + deltaX,
        translateY: prev.translateY + deltaY,
      }));
      
      setLastDistance(distance);
      setLastCenter(center);
    } else if (touches.length === 1 && lastTouches.length === 1) {
      // Single finger pan
      const deltaX = touches[0].x - lastTouches[0].x;
      const deltaY = touches[0].y - lastTouches[0].y;
      
      setTransform(prev => ({
        ...prev,
        translateX: prev.translateX + deltaX,
        translateY: prev.translateY + deltaY,
      }));
    }
    
    setLastTouches(touches);
  }, [enabled, isGesturing, lastTouches, lastDistance, lastCenter, transform.scale, minScale, maxScale]);

  /**
   * Handle touch end event.
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    
    const touches = Array.from(e.touches).map(touchToPoint);
    setLastTouches(touches);
    
    if (touches.length < 2) {
      setIsGesturing(false);
    }
  }, [enabled]);

  /**
   * Handle wheel event for desktop zoom.
   */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!enabled) return;
    
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newScale = clamp(transform.scale + delta, minScale, maxScale);
    
    setTransform(prev => ({
      ...prev,
      scale: newScale,
    }));
  }, [enabled, transform.scale, minScale, maxScale]);

  // Transform style
  const transformStyle = {
    transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
    transformOrigin: 'center center',
    transition: isGesturing ? 'none' : `transform ${ANIMATION_DURATION}ms ease-out`,
  };

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`} ref={containerRef}>
      {/* Zoomable content */}
      <div
        ref={contentRef}
        className="w-full h-full touch-none select-none"
        style={transformStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {children}
      </div>
      
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={zoomIn}
          disabled={transform.scale >= maxScale}
          className="w-10 h-10 bg-gray-800/80 hover:bg-gray-700/80 disabled:opacity-50 rounded-lg flex items-center justify-center text-white border border-gray-600"
          aria-label="Zoom in"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        
        <button
          onClick={zoomOut}
          disabled={transform.scale <= minScale}
          className="w-10 h-10 bg-gray-800/80 hover:bg-gray-700/80 disabled:opacity-50 rounded-lg flex items-center justify-center text-white border border-gray-600"
          aria-label="Zoom out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
        
        <button
          onClick={resetTransform}
          className="w-10 h-10 bg-gray-800/80 hover:bg-gray-700/80 rounded-lg flex items-center justify-center text-white border border-gray-600"
          aria-label="Reset zoom"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 bg-gray-800/80 text-white text-sm px-3 py-1 rounded-lg border border-gray-600">
        {Math.round(transform.scale * 100)}%
      </div>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { ZoomableGridProps, TransformState };