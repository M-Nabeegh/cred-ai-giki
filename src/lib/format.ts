export const pkr = (value: number | null | undefined, compact = false) => {
  if (value === null || value === undefined) return "—"
  if (compact && Math.abs(value) >= 1_000_000) return `PKR ${(value / 1_000_000).toFixed(1)}M`
  if (compact && Math.abs(value) >= 1_000) return `PKR ${Math.round(value / 1_000)}k`
  return `PKR ${Math.round(value).toLocaleString("en-US")}`
}

export const pct = (value: number | null | undefined, digits = 0) => (value === null || value === undefined ? "—" : `${(value * 100).toFixed(digits)}%`)

export const monthLabel = (month: string) => new Date(`${month}-15T00:00:00Z`).toLocaleString("en-US", { month: "short", timeZone: "UTC" })

export const dateLabel = (date: string) => new Date(date.length === 10 ? `${date}T00:00:00Z` : date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })

export const initials = (name: string) => name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()
