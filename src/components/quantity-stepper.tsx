"use client";
export function QuantityStepper({ value, onChange, label, max = 99 }: { value: number; onChange: (value: number) => void; label: string; max?: number }) {
  const limit = Math.min(99, Math.max(1, max));
  return <span className="quantity-stepper" role="group" aria-label={label}>
    <button type="button" aria-label={label + " −"} disabled={value <= 1} onClick={() => onChange(value - 1)}>−</button>
    <input type="number" min="1" max={limit} inputMode="numeric" aria-label={label} value={value} onChange={event => onChange(Math.max(1, Math.min(limit, Number(event.target.value) || 1)))} />
    <button type="button" aria-label={label + " +"} disabled={value >= limit} onClick={() => onChange(value + 1)}>+</button>
  </span>;
}
