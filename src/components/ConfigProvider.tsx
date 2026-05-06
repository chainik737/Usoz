
import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, translations } from "../lib/translations";

type Theme = "light" | "dark" | "system";
type FontSize = "Small" | "Medium" | "Large";

interface ConfigContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  t: (key: keyof typeof translations.English) => string;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(
    (localStorage.getItem("language") as Language) || "English"
  );
  const [theme, setThemeState] = useState<Theme>(
    (localStorage.getItem("theme") as Theme) || "system"
  );
  const [fontSize, setFontSizeState] = useState<FontSize>(
    (localStorage.getItem("fontSize") as FontSize) || "Medium"
  );

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
    applyTheme(t);
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem("fontSize", size);
    applyFontSize(size);
  };

  const applyTheme = (t: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (t === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(t);
    }
  };

  const applyFontSize = (size: FontSize) => {
    const root = window.document.documentElement;
    root.classList.remove("font-size-small", "font-size-medium", "font-size-large");
    root.classList.add(`font-size-${size.toLowerCase()}`);
  };

  useEffect(() => {
    applyTheme(theme);
    applyFontSize(fontSize);
  }, []);

  const t = (key: keyof typeof translations.English) => {
    return translations[language][key] || translations.English[key];
  };

  return (
    <ConfigContext.Provider value={{ 
      language, setLanguage, 
      theme, setTheme, 
      fontSize, setFontSize,
      t 
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
}
