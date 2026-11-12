import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Worker } from "@playwright/test";

// El asistente con su modelo (lib/semantic.ts y public/semantic/worker.js)
// bajo la política de contenido del .htaccess. El modelo solo se carga al
// acercarse al asistente en un ordenador, así que las demás pruebas no lo
// tocan. Solo corre si out/ lleva el modelo (npm run build con conexión);
// el CI compila sin él y la salta. Hay que pasarla antes de cada entrega.
//
// El motor (onnxruntime, dentro de transformers.js) carga parte de su código
// desde una URL blob: en cualquier navegador. Si la política no lo permite,
// el motor falla, lib/semantic.ts cierra el worker y el asistente responde
// solo por palabras: no se ve ningún error, pero el modelo no funciona. Por
// eso se comprueba que el worker sigue vivo y que puede cargar desde un blob.

const withModel = existsSync(join(__dirname, "..", "out", "semantic", "manifest.json"));

test("el modelo del asistente se carga y funciona con la política de contenido", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "El modelo solo se usa en ordenador.");
  test.skip(!withModel, "out/ no lleva el modelo del asistente.");
  test.setTimeout(90_000);

  let worker: Worker | null = null;
  page.on("worker", (w) => {
    worker = w;
  });

  const loaded = (ending: string) =>
    page.waitForResponse((res) => res.url().includes("/semantic/") && res.url().endsWith(ending) && res.ok(), { timeout: 60_000 });
  const model = loaded(".onnx");
  const engine = loaded(".wasm");

  await page.goto("/servicios");
  await page.getByRole("button", { name: "Abrir el asistente de Aterna" }).click();
  await Promise.all([model, engine]);

  // Una pregunta: el asistente la pasa por el modelo.
  const dialog = page.getByRole("dialog", { name: "Asistente de Aterna" });
  const before = await dialog.innerText();
  const input = page.getByPlaceholder("Pregunta lo que quieras…");
  await input.fill("un robot que coja el telefono");
  await input.press("Enter");
  await expect.poll(async () => (await dialog.innerText()).length, { timeout: 30_000 }).toBeGreaterThan(before.length + 40);

  // El worker sigue vivo (si el motor falla, se cierra) y la política le deja
  // cargar código desde un blob, como hace el motor.
  expect(worker, "no se creó el worker del modelo").not.toBeNull();
  const canImportBlob = await worker!
    .evaluate(async () => {
      try {
        const url = URL.createObjectURL(new Blob(["export default 1"], { type: "text/javascript" }));
        return (await import(url)).default === 1;
      } catch {
        return false;
      }
    })
    .catch(() => false);
  expect(canImportBlob, "el worker se cerró o la política no le deja cargar desde un blob").toBe(true);
});
