"use client";
export default function StoreError({ reset }: { reset: () => void }) {
  return <main className="narrow-page"><p className="eyebrow">MATA3</p><h1>Catalogue unavailable</h1><p>Please try again.</p><button className="button gold" onClick={reset}>Retry</button></main>;
}
