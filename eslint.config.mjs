import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Reglas de Next.js (Core Web Vitals) y de TypeScript. `npm run lint`.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Reglas del compilador de React. Señalan patrones que funcionan hoy
      // pero conviene rehacer (refs escritas al pintar, setState dentro de un
      // efecto…), en Assistant, Chrome, WordReveal y el formulario. Avisos
      // hasta la reorganización de esos componentes; luego, errores.
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      // Exportación estática con images.unoptimized: next/image no aporta
      // nada aquí y el símbolo de la cortina tiene que ir en el HTML.
      "@next/next/no-img-element": "off",
    },
  },
  {
    // Scripts de Node en CommonJS (se ejecutan a mano, no van a la web).
    files: ["scripts/**/*.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Código de terceros o generado que se sirve tal cual.
    "public/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
