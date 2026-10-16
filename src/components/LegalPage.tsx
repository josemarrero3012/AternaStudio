import { readFileSync } from "node:fs";
import path from "node:path";

// Las páginas legales se publican tal cual las redactó el titular (en
// src/content/legal/*.html). Se leen en build: no viajan en el JS.
export function LegalPage({ file, title, lang }: { file: string; title: string; lang: "es" | "de" }) {
  const html = readFileSync(path.join(process.cwd(), "src/content/legal", `${file}.html`), "utf8");
  return (
    <section className="container page-head legal" lang={lang}>
      <p className="t-label dim page-head__eyebrow">Legal</p>
      <h1 className="t-display">{title}</h1>
      <div className="prose legal__body" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}
