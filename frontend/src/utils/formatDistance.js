// formatDistance — plan §14.3 Step 21: formatDistance(km) → "12.5 km" (FR-1 display).

export function formatDistance(km) {
  const n = Number(km);
  if (Number.isNaN(n)) return '';
  return `${n.toFixed(1)} km`;
}
