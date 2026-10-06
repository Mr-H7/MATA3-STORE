"use client";
import { useParams } from "next/navigation";
export default function StoreError({ reset }: { reset: () => void }) {
  const params = useParams<{ locale?: string }>();
  const locale = params.locale;
  return <main className="narrow-page" role="alert"><p className="eyebrow">MATA3</p><h1>{locale === "ar" ? "المتجر غير متاح الآن" : locale === "fr" ? "Boutique indisponible" : "Store unavailable"}</h1><p>{locale === "ar" ? "حاول مجددًا." : locale === "fr" ? "Veuillez réessayer." : "Please try again."}</p><button className="button gold" onClick={reset}>{locale === "ar" ? "إعادة المحاولة" : locale === "fr" ? "Réessayer" : "Retry"}</button></main>;
}
