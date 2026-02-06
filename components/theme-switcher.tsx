"use client";

import { FC, useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { useIsSSR } from "@react-aria/ssr";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { PaletteIcon } from "@/components/icons";

const THEME_COLORS: Record<string, string> = {
  light: "#0072F5",
  dark: "#7C7C7C",
  ocean: "#0072F5",
  forest: "#17C964",
  sunset: "#FF9700",
  "purple-dark": "#7828C8",
  rose: "#FF4D70",
  midnight: "#06B6D4",
};

export const ThemeSwitcher: FC = () => {
  const { theme, setTheme } = useTheme();
  const isSSR = useIsSSR();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentTheme = isSSR ? "dark" : theme || "dark";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const lightThemes = siteConfig.themes.filter((t) => t.type === "light");
  const darkThemes = siteConfig.themes.filter((t) => t.type === "dark");

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Switch theme"
        className="p-1.5 rounded-lg hover:bg-default-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <PaletteIcon size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-content1 border border-default-200 shadow-lg z-50 py-1 overflow-hidden">
          <div className="px-3 py-1.5 text-xs font-semibold text-default-500">
            Light
          </div>
          {lightThemes.map((t) => (
            <button
              key={t.key}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-default-100 transition-colors",
                currentTheme === t.key && "bg-default-100 font-semibold",
              )}
              onClick={() => {
                setTheme(t.key);
                setIsOpen(false);
              }}
            >
              <div
                className="w-4 h-4 rounded-full border border-default-300 shrink-0"
                style={{ backgroundColor: THEME_COLORS[t.key] }}
              />
              {t.label}
            </button>
          ))}
          <div className="px-3 py-1.5 text-xs font-semibold text-default-500 border-t border-default-200 mt-1">
            Dark
          </div>
          {darkThemes.map((t) => (
            <button
              key={t.key}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-default-100 transition-colors",
                currentTheme === t.key && "bg-default-100 font-semibold",
              )}
              onClick={() => {
                setTheme(t.key);
                setIsOpen(false);
              }}
            >
              <div
                className="w-4 h-4 rounded-full border border-default-300 shrink-0"
                style={{ backgroundColor: THEME_COLORS[t.key] }}
              />
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
