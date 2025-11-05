"use client";

import { useEffect } from "react";

interface RipplePosition {
  x: number;
  y: number;
  isDark: boolean;
}

interface ThemeRippleProps {
  ripple: RipplePosition | null;
  onComplete: () => void;
}

export function ThemeRipple({ ripple, onComplete }: ThemeRippleProps) {
  useEffect(() => {
    // Ripple effect removed - call onComplete immediately
    onComplete();
  }, [onComplete]);
  
  return null;
}
