"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

/** Email grande: al pulsarlo se copia (si hay portapapeles) o abre el correo. */
export function CopyEmail({ email }: { email: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function onClick(e: React.MouseEvent) {
    if (!navigator.clipboard) return;
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  }

  const [user, domain] = email.split("@");
  return (
    <a href={`mailto:${email}`} onClick={onClick} className="copy-email t-title">
      {/* <wbr> permite partir la dirección tras la @ en pantallas estrechas. */}
      <span className="link-underline">
        {user}@<wbr />
        {domain}
      </span>
      <span className="t-label copy-email__hint" aria-live="polite">
        {copied ? t.copyEmail.copied : t.copyEmail.copy}
      </span>
    </a>
  );
}
