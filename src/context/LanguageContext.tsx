"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Lang = "kk" | "ru" | "en";

type LanguageContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "kk",
  setLang: () => {},
});

const LANG_STORAGE_KEY = "kafedra_site_lang_v1";

function isValidLang(value: string | null): value is Lang {
  return value === "kk" || value === "ru" || value === "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("kk");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (isValidLang(saved)) {
        setLangState(saved);
        document.documentElement.lang = saved;
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  function setLang(nextLang: Lang) {
    setLangState(nextLang);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, nextLang);
      document.documentElement.lang = nextLang;
    } catch {
      // ignore storage errors
    }
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}