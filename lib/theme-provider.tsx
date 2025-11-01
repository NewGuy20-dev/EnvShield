"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ThemeRipple } from "@/components/effects/theme-ripple";

type Theme = "light" | "dark" | "system";

interface RipplePosition {
  x: number;
  y: number;
  isDark: boolean;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  setThemeWithRipple: (theme: Theme, position: { x: number; y: number }) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [ripple, setRipple] = useState<RipplePosition | null>(null);
  const [pendingTheme, setPendingTheme] = useState<Theme | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load theme from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem("envshield-theme") as Theme;
      if (stored) {
        setThemeState(stored);
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    
    const root = document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove("light", "dark");
    root.removeAttribute("data-theme");

    // Determine resolved theme
    let resolved: "light" | "dark" = "light";
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      resolved = systemTheme;
    } else {
      resolved = theme;
    }

    // Apply theme
    root.classList.add(resolved);
    root.setAttribute("data-theme", resolved);
    setResolvedTheme(resolved);
  }, [theme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {
      if (theme === "system") {
        const resolved = mediaQuery.matches ? "dark" : "light";
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(resolved);
        document.documentElement.setAttribute("data-theme", resolved);
        setResolvedTheme(resolved);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem("envshield-theme", newTheme);
    }
  };

  const setThemeWithRipple = (newTheme: Theme, position: { x: number; y: number }) => {
    if (typeof window === 'undefined') {
      setTheme(newTheme);
      return;
    }
    
    // Determine the target theme
    let targetTheme: "light" | "dark";
    if (newTheme === "system") {
      targetTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      targetTheme = newTheme;
    }

    // Start ripple animation
    setRipple({
      x: position.x,
      y: position.y,
      isDark: targetTheme === "dark",
    });

    // Store the pending theme change
    setPendingTheme(newTheme);
  };

  const handleRippleComplete = () => {
    if (pendingTheme) {
      setTheme(pendingTheme);
      setPendingTheme(null);
    }
    setRipple(null);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, setThemeWithRipple, resolvedTheme }}>
      {children}
      <ThemeRipple ripple={ripple} onComplete={handleRippleComplete} />
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
