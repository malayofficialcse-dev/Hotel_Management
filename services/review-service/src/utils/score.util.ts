export function calculateOverallRating(breakdown: {
  cleanliness: number;
  comfort: number;
  location: number;
  service: number;
  valueForMoney: number;
}): number {
  const sum =
    breakdown.cleanliness +
    breakdown.comfort +
    breakdown.location +
    breakdown.service +
    breakdown.valueForMoney;
  return Number((sum / 5).toFixed(1));
}

