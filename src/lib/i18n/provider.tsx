"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { translations, Language, getTranslation } from "@/lib/i18n/translations";

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children, initialLang = "pt" }: { children: ReactNode; initialLang?: Language }) {
  const [lang, setLang] = useState<Language>(initialLang);

  const t = (key: string) => getTranslation(lang, key);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

export function LanguageSelector() {
  const { lang, setLang } = useI18n();

  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as Language)}
      className="bg-transparent border rounded px-2 py-1 text-sm"
    >
      <option value="pt">PT</option>
      <option value="en">EN</option>
      <option value="es">ES</option>
    </select>
  );
}
