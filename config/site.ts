export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Smart Calendar",
  description: "A full-page calendar application built with HeroUI.",
  themes: [
    { key: "light", label: "Light", type: "light" },
    { key: "dark", label: "Dark", type: "dark" },
    { key: "ocean", label: "Ocean", type: "dark" },
    { key: "forest", label: "Forest", type: "dark" },
    { key: "sunset", label: "Sunset", type: "light" },
    { key: "purple-dark", label: "Purple", type: "dark" },
    { key: "rose", label: "Rose", type: "light" },
    { key: "midnight", label: "Midnight", type: "dark" },
  ] as const,
};
