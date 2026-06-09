export function formatCurrency(value: number, currency = "EUR") {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}
