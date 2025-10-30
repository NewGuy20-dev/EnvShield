"use client";

import { motion, AnimatePresence } from "framer-motion";

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
  if (typeof window === "undefined" || !ripple) return null;

  // Calculate the maximum distance from the click point to any corner
  const maxDistance = Math.hypot(
    Math.max(ripple.x, window.innerWidth - ripple.x),
    Math.max(ripple.y, window.innerHeight - ripple.y)
  );

  const scale = (maxDistance * 2) / 100; // Convert to scale factor

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 pointer-events-none z-[9999]"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, delay: 0.6 }}
        onAnimationComplete={onComplete}
      >
        <motion.div
          className={ripple.isDark ? "bg-background-dark" : "bg-background-light"}
          style={{
            position: "absolute",
            left: ripple.x,
            top: ripple.y,
            width: 100,
            height: 100,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
          }}
          initial={{
            scale: 0,
            opacity: 1,
          }}
          animate={{
            scale: scale,
            opacity: 1,
          }}
          transition={{
            duration: 0.6,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
