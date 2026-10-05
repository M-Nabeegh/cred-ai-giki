const DAY_MS = 86_400_000

export function toDay(date: string) {
  return Math.floor(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) / DAY_MS)
}

export function daysBetween(from: string, to: string) {
  return toDay(to) - toDay(from)
}

export function monthKey(date: string) {
  return date.slice(0, 7)
}

/** The `count` calendar months ending with the month of `asOf`, oldest first (YYYY-MM). */
export function monthsEnding(asOf: string, count: number) {
  const year = +asOf.slice(0, 4)
  const month = +asOf.slice(5, 7) - 1
  return Array.from({ length: count }, (_, index) => {
    const d = new Date(Date.UTC(year, month - (count - 1 - index), 1))
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
  })
}

export function addDays(date: string, days: number) {
  return new Date((toDay(date) + days) * DAY_MS).toISOString().slice(0, 10)
}

export function addMonths(date: string, months: number) {
  const d = new Date(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1 + months, Math.min(28, +date.slice(8, 10))))
  return d.toISOString().slice(0, 10)
}

export function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

export function mean(values: number[]) {
  return values.length ? sum(values) / values.length : 0
}

export function std(values: number[]) {
  if (values.length < 2) return 0
  const m = mean(values)
  return Math.sqrt(sum(values.map((value) => (value - m) ** 2)) / (values.length - 1))
}

/** Coefficient of variation, safe for zero means. */
export function cv(values: number[]) {
  const m = mean(values)
  return m === 0 ? 0 : std(values) / m
}

export function median(values: number[]) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function round(value: number, decimals = 4) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value))
}

/** Small deterministic PRNG (FNV-1a seed hash + mulberry-style mixer). */
export function seededRandom(seed: string) {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return () => {
    hash += 0x6d2b79f5
    let value = hash
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export type Rng = ReturnType<typeof seededRandom>

export function gaussian(rng: Rng) {
  const u = Math.max(rng(), 1e-9)
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
