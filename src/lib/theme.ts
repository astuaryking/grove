"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const t = document.documentElement.classList.contains("light") ? "light" : "dark";
    setTheme(t);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const html = document.documentElement;
    html.classList.remove("dark", "light");
    html.classList.add(next);
    try { localStorage.setItem("grove-theme", next); } catch {}
    setTheme(next);
  }

  return { theme, toggle };
}
