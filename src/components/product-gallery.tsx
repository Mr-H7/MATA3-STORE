"use client";

import Image from "next/image";
import { useState } from "react";
import type { Locale, PublicMedia } from "@/lib/commerce";
import { ProductImageFallback } from "./product-image-fallback";

export function ProductGallery({ media, name, locale }: { media: PublicMedia[]; name: string; locale: Locale }) {
  const [selected, setSelected] = useState(0);
  const active = media[selected] ?? media[0];
  const label = locale === "ar" ? "عرض الوسائط" : locale === "fr" ? "Voir le média" : "View media";
  return <section className="product-gallery" aria-label={name}>
    <div className="gallery-stage">
      {!active ? <ProductImageFallback locale={locale}/> : active.type === "VIDEO"
        ? <video key={active.url} src={active.url} controls preload="metadata" aria-label={active.alt || name}/>
        : <Image unoptimized priority src={active.url} alt={active.alt || name} width={1000} height={1000} sizes="(max-width: 760px) 100vw, 55vw"/>}
      {media.length > 1 && <span className="gallery-count" dir="ltr" aria-live="polite">{selected + 1} / {media.length}</span>}
    </div>
    {media.length > 1 && <div className="gallery-thumbnails">{media.map((item, index) => <button key={item.url + index} type="button" aria-label={`${label} ${index + 1}`} aria-pressed={selected === index} onClick={() => setSelected(index)}>
      {item.type === "IMAGE" ? <Image unoptimized src={item.url} alt="" width={100} height={100}/> : <span aria-hidden="true">▷</span>}
    </button>)}</div>}
  </section>;
}
