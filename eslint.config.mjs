import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Reglas de Next.js (Core Web Vitals) y de TypeScript. `npm run lint`.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Reglas del compilador de React: refs escritas al pintar, funciones
      // impuras, setState dentro de un efecto, valores usados antes de
      // declararse. Errores: el código queda listo para el compilador.
      "react-hooks/refs": "error",
      "react-hooks/purity": "error",
      "react-hooks/set-state-in-effect": "error",
      "react-hooks/immutability": "error",
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
