"use client";

import NextLink from "next/link";
import { createContext, useContext, useEffect, type ComponentProps, type ReactNode } from "react";
import { DEFAULT_LOCALE, dict, localePath, type Dict, type Locale } from "./dict";

type I18n = { locale: Locale; t: Dict; href: (path: string) => string; lost: boolean };

const Ctx = createContext<I18n | null>(null);

/**
 * El idioma lo da la URL: español en la raíz, el resto bajo /en, /nl y /de.
 * Cada versión se exporta ya traducida, así que Google indexa las cuatro.
 */
export function LanguageProvider({
  locale = DEFAULT_LOCALE,
  lost = false,
  children,
}: {
  locale?: Locale;
  /** En la 404: el selector de idioma lleva a la portada de cada idioma. */
  lost?: boolean;
  children: ReactNode;
}) {
  // Entre /en, /nl y /de se navega sin recargar y el layout es el mismo:
  // el atributo lang del documento sigue al idioma de la página.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <Ctx.Provider value={{ locale, t: dict[locale], href: (path) => localePath(path, locale), lost }}>
      {children}
    </Ctx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n debe usarse dentro de <LanguageProvider>");
  return ctx;
}

/** next/link que mantiene el idioma actual: href="/contacto" lleva a /en/contacto en inglés. */
export function Link({ href, ...props }: Omit<ComponentProps<typeof NextLink>, "href"> & { href: string }) {
  const { href: localize } = useI18n();
  return <NextLink href={localize(href)} {...props} />;
}
