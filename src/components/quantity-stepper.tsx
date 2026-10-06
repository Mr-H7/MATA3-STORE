"use client";
export function QuantityStepper({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  return <span className="quantity-stepper" role="group" aria-label={label}>
    <button type="button" aria-label={label + " −"} disabled={value <= 1} onClick={() => onChange(value - 1)}>−</button>
    <input type="number" min="1" max="99" inputMode="numeric" aria-label={label} value={value} onChange={event => onChange(Math.max(1, Math.min(99, Number(event.target.value) || 1)))} />
    <button type="button" aria-label={label + " +"} disabled={value >= 99} onClick={() => onChange(value + 1)}>+</button>
  </span>;
}
