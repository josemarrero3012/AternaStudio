import { expect, test } from "@playwright/test";

// Si el navegador deja de animar a mitad de la entrada (en WebKit pasaba),
// el velo de la transición no puede quedarse tapando la página.
test("el velo se levanta aunque la animación de entrada no termine", async ({ page }) => {
  await page.addInitScript(() => {
    // En cuanto empieza la entrada, ningún fotograma más: GSAP no avanza.
    const raf = window.requestAnimationFrame.bind(window);
    let frozen = false;
    window.requestAnimationFrame = (cb) => raf((t) => (frozen ? undefined : cb(t)));
    new MutationObserver(() => {
      if (document.querySelector('.page-veil[data-state="reveal"]')) frozen = true;
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-state"] });
  });
  await page.goto("/servicios");
  await expect(page.locator("html")).toHaveAttribute("data-intro", "on");
  await page.locator('main a.svc-card[href="/servicios/web"]').click();
  await expect(page).toHaveURL(/\/servicios\/web$/);
  const veil = page.locator(".page-veil");
  await expect(veil).toHaveAttribute("data-state", "idle", { timeout: 4000 });
  await expect(veil).toHaveCSS("pointer-events", "none");
  // La página que entra queda visible y en su sitio.
  const content = veil.locator("xpath=preceding-sibling::div[1]");
  await expect(content).toHaveCSS("opacity", "1");
  await expect(content).toHaveCSS("transform", "none");
});
