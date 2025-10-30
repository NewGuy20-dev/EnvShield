"use client";

import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { cn } from "@/lib/utils";
import { useRef } from "react";

interface AnimatedThemeTogglerProps {
  className?: string;
  duration?: number;
}

export function AnimatedThemeToggler({
  className,
  duration = 400,
}: AnimatedThemeTogglerProps) {
  const { theme, setThemeWithRipple, resolvedTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleTheme = () => {
    // Get the button's position for ripple effect
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      const newTheme = theme === "system" 
        ? (resolvedTheme === "dark" ? "light" : "dark")
        : (theme === "dark" ? "light" : "dark");

      setThemeWithRipple(newTheme, { x, y });
    }
  };

  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-xl",
        "glass glass-hover transition-all duration-200",
        "hover:shadow-glow-primary focus:outline-none focus:ring-2 focus:ring-primary/50",
        className
      )}
      aria-label="Toggle theme"
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: duration / 1000 }}
    >
      <div className="relative h-6 w-6">
        {/* Sun Icon */}
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 0 : 1,
            rotate: isDark ? 90 : 0,
            opacity: isDark ? 0 : 1,
          }}
          transition={{
            duration: duration / 1000,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sun className="h-5 w-5 text-yellow-500" />
        </motion.div>

        {/* Moon Icon */}
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 1 : 0,
            rotate: isDark ? 0 : -90,
            opacity: isDark ? 1 : 0,
          }}
          transition={{
            duration: duration / 1000,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Moon className="h-5 w-5 text-primary" />
        </motion.div>

        {/* Background glow effect */}
        <motion.div
          initial={false}
          animate={{
            opacity: isDark ? 0.2 : 0.15,
            scale: isDark ? 1.5 : 1.3,
          }}
          transition={{
            duration: duration / 1000,
            ease: [0.4, 0, 0.2, 1],
          }}
          className={cn(
            "absolute inset-0 -z-10 rounded-full blur-xl",
            isDark ? "bg-primary/40" : "bg-yellow-400/40"
          )}
        />
      </div>
    </motion.button>
  );
}
