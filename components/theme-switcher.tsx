"use client";

import { FC, useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { useIsSSR } from "@react-aria/ssr";
import clsx from "clsx";

import { siteConfig } from "@/config/site";

const THEME_COLORS: Record<string, { bg: string; accent: string }> = {
  light: { bg: "#FAFAFA", accent: "#6366F1" },
  dark: { bg: "#09090B", accent: "#818CF8" },
  ocean: { bg: "#09090B", accent: "#60A5FA" },
  forest: { bg: "#09090B", accent: "#34D399" },
  sunset: { bg: "#FAFAFA", accent: "#F97316" },
  "purple-dark": { bg: "#09090B", accent: "#C084FC" },
  rose: { bg: "#FAFAFA", accent: "#F43F5E" },
  midnight: { bg: "#09090B", accent: "#22D3EE" },
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

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Switch theme"
        className={clsx(
          "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
          "hover:bg-default-100 active:scale-95",
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div
          className="w-4 h-4 rounded-full ring-2 ring-default-300"
          style={{
            background: `linear-gradient(135deg, ${THEME_COLORS[currentTheme]?.bg || "#09090B"} 50%, ${THEME_COLORS[currentTheme]?.accent || "#818CF8"} 50%)`,
          }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 rounded-2xl bg-content1 border border-default-200/60 shadow-2xl z-50 p-3 w-[220px] backdrop-blur-xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-default-400 mb-2 px-1">
            Theme
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {siteConfig.themes.map((t) => {
              const colors = THEME_COLORS[t.key];
              const isActive = currentTheme === t.key;

              return (
                <button
                  key={t.key}
                  className={clsx(
                    "flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-all",
                    isActive
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "hover:bg-default-100 text-default-600",
                  )}
                  onClick={() => {
                    setTheme(t.key);
                    setIsOpen(false);
                  }}
                >
                  <div
                    className={clsx(
                      "w-4 h-4 rounded-full shrink-0 ring-1",
                      isActive ? "ring-primary" : "ring-default-300",
                    )}
                    style={{
                      background: `linear-gradient(135deg, ${colors.bg} 50%, ${colors.accent} 50%)`,
                    }}
                  />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
