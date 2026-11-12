import { defineConfig, devices } from "@playwright/test";

// Pruebas de la web exportada (out/), servida como en Hostinger por
// scripts/serve-out.mjs. Antes hay que compilar: `npm run build`.
//
//   npm run test:e2e      humo, enlaces, accesibilidad e interacción (también en CI)
//   npm run test:visual   capturas comparadas con las de referencia (solo en local)
//
// Las capturas de referencia dependen del sistema (fuentes, suavizado), por
// eso solo se comparan en la misma máquina en la que se tomaron. Para
// renovarlas tras un cambio visual buscado: `npm run test:visual -- --update-snapshots`.

const PORT = 4173;
const desktop = { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } };
const mobile = { ...devices["Pixel 7"] };

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled", caret: "hide" },
  },
  projects: [
    { name: "desktop", use: desktop, testIgnore: /visual\.spec/ },
    { name: "mobile", use: mobile, testIgnore: /visual\.spec/ },
    { name: "visual-desktop", use: { ...desktop, reducedMotion: "reduce" }, testMatch: /visual\.spec/ },
    { name: "visual-mobile", use: { ...mobile, reducedMotion: "reduce" }, testMatch: /visual\.spec/ },
  ],
  webServer: {
    command: `node scripts/serve-out.mjs ${PORT}`,
    url: `http://localhost:${PORT}/robots.txt`,
    reuseExistingServer: !process.env.CI,
  },
});
