"use client";
import { useEffect, useRef, type ReactNode } from "react";

const focusable = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]';

export function StoreDialog({ label, className, onClose, children, initialFocus }: { label: string; className: string; onClose: () => void; children: ReactNode; initialFocus?: string }) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controls = () => [...(panel.current?.querySelectorAll<HTMLElement>(focusable) ?? [])].filter(element => element.getClientRects().length > 0);
    (initialFocus ? panel.current?.querySelector<HTMLElement>(initialFocus) : controls()[0] ?? panel.current)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close.current(); }
      if (event.key !== "Tab") return;
      const items = controls(), first = items[0], last = items.at(-1);
      if (!first) { event.preventDefault(); panel.current?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, [initialFocus]);
  return <div className={`store-dialog-backdrop ${className}`} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={panel} className="store-dialog-panel" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>{children}</div>
  </div>;
}
