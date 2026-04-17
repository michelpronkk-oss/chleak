import { formatDistanceToNowStrict } from "date-fns"

export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCompactCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatRelativeTimestamp(isoTimestamp: string) {
  return `${formatDistanceToNowStrict(new Date(isoTimestamp), { addSuffix: true })}`
}
