export const DEFAULT_RISK_FREE_RATES = {
  EUR: 0.04, // 4% - approximate ECB rate
  USD: 0.05, // 5% - approximate Fed rate
} as const;

export const cumulativeNormalDistribution = (x: number): number => {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const erf =
    1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
};

export const blackScholesCallPrice = (
  S: number, // Current stock price
  K: number, // Strike price
  T: number, // Time to expiration in years
  r: number, // Risk-free interest rate
  sigma: number // Volatility
): number => {
  if (T <= 0) {
    return Math.max(0, S - K);
  }
  const d1 =
    (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const N_d1 = cumulativeNormalDistribution(d1);
  const N_d2 = cumulativeNormalDistribution(d2);
  return S * N_d1 - K * Math.exp(-r * T) * N_d2;
};

// Function to calculate implied volatility
export const calculateImpliedVolatility = (
  marketPrice: number,
  S: number,
  K: number,
  T: number,
  r: number,
  exchangeRate: number
): number => {
  // Handle edge cases
  if (T <= 0) {
    return 0;
  }

  let sigma = 0.2; // Initial guess
  const tolerance = 1e-5;
  const maxIterations = 100;
  let iteration = 0;

  while (iteration < maxIterations) {
    const price = blackScholesCallPrice(S, K, T, r, sigma) * exchangeRate;
    const vega = calculateVega(S, K, T, r, sigma) * exchangeRate;

    // If vega is too close to zero, break to avoid division by zero
    if (Math.abs(vega) < 1e-10) {
      break;
    }

    const priceDifference = price - marketPrice;

    if (Math.abs(priceDifference) < tolerance) {
      break;
    }

    // Limit the change in sigma to prevent overshooting
    const deltaSigma = priceDifference / vega;
    sigma = Math.max(0.001, sigma - deltaSigma); // Ensure sigma stays positive

    iteration++;
  }

  return sigma;
};

// Function to calculate Vega (the derivative of the price with respect to volatility)
export const calculateVega = (
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number
): number => {
  // Handle edge cases
  if (T <= 0) {
    return 0;
  }

  // Ensure sigma is not zero to prevent division by zero
  const safeSigma = Math.max(sigma, 1e-10);

  const d1 =
    (Math.log(S / K) + (r + (safeSigma * safeSigma) / 2) * T) /
    (safeSigma * Math.sqrt(T));
  const N_prime_d1 = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * d1 * d1);
  const vega = S * Math.sqrt(T) * N_prime_d1;

  return vega;
};

interface WarrantValueParams {
  stockPrice: number;
  strikePrice: number;
  timeToExpiryYears: number;
  exchangeRate: number;
  investment: number;
  initialWarrantPrice: number;
  impliedVolatility: number;
  riskFreeRate?: number;
}

export const calculateWarrantValue = ({
  stockPrice,
  strikePrice,
  timeToExpiryYears,
  exchangeRate,
  investment,
  initialWarrantPrice,
  impliedVolatility,
  riskFreeRate = DEFAULT_RISK_FREE_RATES.EUR,
}: WarrantValueParams): number => {
  // Black-Scholes calculated warrant price
  const callPriceUSD = blackScholesCallPrice(
    stockPrice,
    strikePrice,
    timeToExpiryYears,
    riskFreeRate,
    impliedVolatility
  );
  const warrantPriceEUR = callPriceUSD * exchangeRate;

  // Calculate value based on initial number of warrants bought
  const warrantsBought = investment / initialWarrantPrice;
  return warrantPriceEUR * warrantsBought;
};
