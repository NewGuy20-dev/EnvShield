"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === "system") {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    } else {
      setTheme(theme === "dark" ? "light" : "dark");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl glass glass-hover transition-all duration-200 hover:shadow-glow-primary"
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="w-5 h-5 text-yellow-500 transition-transform duration-300 rotate-0 hover:rotate-180" />
      ) : (
        <Moon className="w-5 h-5 text-primary transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
}
