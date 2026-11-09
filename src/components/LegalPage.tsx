import { readFileSync } from "node:fs";
import path from "node:path";
import { basePath } from "@/lib/base";
import { LegalToc, type TocItem } from "./LegalToc";

const slug = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Da un id a cada apartado (h2) que no lo tenga y devuelve el índice. */
function withToc(html: string) {
  const toc: TocItem[] = [];
  const out = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (_, attrs: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    let id = /\bid="([^"]+)"/.exec(attrs)?.[1];
    if (!id) {
      id = slug(text);
      attrs += ` id="${id}"`;
    }
    toc.push({ id, text });
    return `<h2${attrs}>${inner}</h2>`;
  });
  return { html: out, toc };
}

// Las páginas legales se publican tal cual las redactó el titular (en
// src/content/legal/*.html). Se leen en build: no viajan en el JS.
export function LegalPage({ file, title, lang }: { file: string; title: string; lang: "es" | "de" }) {
  const raw = readFileSync(path.join(process.cwd(), "src/content/legal", `${file}.html`), "utf8").replaceAll('href="/', `href="${basePath}/`);
  const { html, toc } = withToc(raw);
  return (
    <section className="container page-head page-head--lit legal" lang={lang}>
      <p className="t-label dim eyebrow page-head__eyebrow">Legal</p>
      <h1 className="t-display">{title}</h1>
      <div className="legal__layout">
        <div className="prose legal__body" dangerouslySetInnerHTML={{ __html: html }} />
        <LegalToc items={toc} title={lang === "de" ? "Inhalt" : "Índice"} />
      </div>
    </section>
  );
}
