"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Market } from "@/lib/commerce";

type Media = { url: string; alt: string; type: "IMAGE" };
export function CartMedia({ market, kind, slug, name }: { market: Market; kind?: "product" | "bundle"; slug?: string; name: string }) {
  const [media, setMedia] = useState<Media | null>(null);
  useEffect(() => {
    if (!kind || !slug) return;
    const controller = new AbortController();
    void fetch("/api/catalogue/media?" + new URLSearchParams({ market, kind, slug }), { signal: controller.signal })
      .then(response => response.ok ? response.json() as Promise<{ media: Media[] }> : null)
      .then(value => { if (!controller.signal.aborted) setMedia(value?.media?.[0] ?? null); })
      .catch(() => {});
    return () => controller.abort();
  }, [market, kind, slug]);
  return <div className="cart-image">{media ? <Image unoptimized src={media.url} alt={media.alt || name} width={160} height={160} sizes="(max-width: 760px) 75px, 110px" /> : <span aria-hidden="true">م</span>}</div>;
}
