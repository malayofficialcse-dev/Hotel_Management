export function formatCurrency(amount: number, currency: string = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateTax(amount: number, rate: number = 0.12): number {
  return Math.round(amount * rate);
}

