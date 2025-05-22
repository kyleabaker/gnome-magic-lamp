export function easeOutCubic(t, isEnabled) {
  return isEnabled ? 1 - Math.pow(1 - t, 3) : t;
}
