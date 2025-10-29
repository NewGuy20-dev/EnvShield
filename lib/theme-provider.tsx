"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Load theme from localStorage
    const stored = localStorage.getItem("envshield-theme") as Theme;
    if (stored) {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
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
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
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
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("envshield-theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
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
