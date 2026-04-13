"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // Get saved theme or system preference
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.dataset.theme = saved;
    } else {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme: Theme = isDark ? "dark" : "light";
      setTheme(initialTheme);
      document.documentElement.dataset.theme = initialTheme;
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", newTheme);
      document.documentElement.dataset.theme = newTheme;
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
