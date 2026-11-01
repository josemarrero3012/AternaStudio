// Acto 5, la semilla: el único punto cálido del recorrido. Asoma en la copa
// del Sello, se desprende con el scroll y cae balanceándose hasta posarse
// junto al botón de contacto, que entonces se enciende en oro pálido.
//
// Como los objetos de servicio, vive en el espacio de la cámara y se coloca
// en píxeles de la ventana: sale de un punto de la escena (la copa, que se
// proyecta) y llega a uno de la página (el botón).

import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, SphereGeometry, type PerspectiveCamera } from "three";
import { C, glowMaterial } from "./look";

const DEPTH = 2.6;

export function buildSeed() {
  const group = new Group();
  const coreGeo = new SphereGeometry(0.5, 24, 16);
  const coreBase = C.gold.clone().multiplyScalar(2.2);
  const coreMat = new MeshBasicMaterial({ color: coreBase.clone(), transparent: true, opacity: 0 });
  const core = new Mesh(coreGeo, coreMat);
  const glowGeo = new PlaneGeometry(1, 1);
  const glowMat = glowMaterial(C.gold, 0);
  const glow = new Mesh(glowGeo, glowMat);
  glow.position.z = -0.01;
  group.add(glow, core);
  group.visible = false;

  const ease = (t: number) => t * t * (3 - 2 * t);

  return {
    group,
    /**
     * from: la copa en la ventana (px); to: junto al botón (px); p: cuánto
     * ha caído (0 en la copa, 1 posada); presence: cuánto se ve (0…1).
     */
    update(camera: PerspectiveCamera, w: number, h: number, time: number, from: { x: number; y: number }, to: { x: number; y: number }, p: number, presence: number) {
      group.visible = presence > 0.004;
      if (!group.visible) return;
      const e = camera.projectionMatrix.elements;
      const perPx = (2 * DEPTH) / (e[5] * h);
      // Cae como una semilla: acelera al principio y se mece de lado a lado
      // cada vez menos; al final se frena para posarse.
      const t = Math.min(1, Math.max(0, p));
      const fall = ease(t);
      const sway = Math.sin(t * Math.PI * 3) * 26 * Math.sin(Math.PI * t);
      const x = from.x + (to.x - from.x) * fall + sway;
      const y = from.y + (to.y - from.y) * (0.55 * t * t + 0.45 * fall);
      const nx = (x / w) * 2 - 1;
      const ny = -((y / h) * 2 - 1);
      group.position.set(((nx + e[8]) * DEPTH) / e[0], ((ny + e[9]) * DEPTH) / e[5], -DEPTH);
      // Brote en la copa: late despacio; posada, respira junto al botón.
      const breathe = 0.82 + 0.18 * Math.sin(time * (t >= 1 ? 1.6 : 2.4));
      core.scale.setScalar(9 * perPx);
      glow.scale.setScalar((52 + 14 * (t >= 1 ? 1 : 0)) * perPx);
      coreMat.opacity = presence;
      coreMat.color.copy(coreBase);
      glowMat.uniforms.uIntensity.value = presence * breathe * 0.95;
    },
    dispose() {
      coreGeo.dispose();
      coreMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
    },
  };
}

export type Seed = ReturnType<typeof buildSeed>;
