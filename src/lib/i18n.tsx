"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { LOCALES, dict, type Dict, type Locale } from "./dict";

type I18n = { locale: Locale; setLocale: (l: Locale) => void; t: Dict };

const Ctx = createContext<I18n | null>(null);
const KEY = "aterna-lang";
const listeners = new Set<() => void>();

function read(): Locale {
  try {
    const v = localStorage.getItem(KEY);
    if ((LOCALES as readonly string[]).includes(v ?? "")) return v as Locale;
  } catch {}
  return "es";
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // En el servidor (export estático) siempre se renderiza en español.
  const locale = useSyncExternalStore(subscribe, read, () => "es" as const);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    try {
      localStorage.setItem(KEY, l);
    } catch {}
    listeners.forEach((cb) => cb());
  }, []);

  return (
    <Ctx.Provider value={{ locale, setLocale, t: dict[locale] }}>
      {children}
    </Ctx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n debe usarse dentro de <LanguageProvider>");
  return ctx;
}
