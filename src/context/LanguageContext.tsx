"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Lang = "kk" | "ru";

type LanguageContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "kk",
  setLang: () => {},
});

const LANG_STORAGE_KEY = "kafedra_site_lang_v1";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("kk");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === "kk" || saved === "ru") {
        setLangState(saved);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  function setLang(nextLang: Lang) {
    setLangState(nextLang);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, nextLang);
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