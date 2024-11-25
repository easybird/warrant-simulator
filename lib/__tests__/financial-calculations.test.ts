import {
  blackScholesCallPrice,
  calculateWarrantValue,
  cumulativeNormalDistribution,
} from "../financial-calculations";

describe("Financial Calculations", () => {
  describe("cumulativeNormalDistribution", () => {
    it("should return 0.5 for x = 0", () => {
      expect(cumulativeNormalDistribution(0)).toBeCloseTo(0.5, 6);
    });

    it("should be symmetric around 0.5", () => {
      const x = 1.5;
      const positive = cumulativeNormalDistribution(x);
      const negative = cumulativeNormalDistribution(-x);
      expect(positive + negative).toBeCloseTo(1, 6);
    });
  });

  describe("blackScholesCallPrice", () => {
    const baseParams = {
      S: 350, // Current stock price
      K: 460, // Strike price
      T: 2.5, // Time to expiration in years
      r: 0.01, // Risk-free rate
      sigma: 0.3, // Volatility
    };

    it("should return 0 when stock price is 0", () => {
      const price = blackScholesCallPrice(
        0,
        baseParams.K,
        baseParams.T,
        baseParams.r,
        baseParams.sigma
      );
      expect(price).toBe(0);
    });

    it("should return max(0, S-K) when time to expiry is 0", () => {
      const price = blackScholesCallPrice(
        baseParams.S,
        baseParams.K,
        0,
        baseParams.r,
        baseParams.sigma
      );
      expect(price).toBe(Math.max(0, baseParams.S - baseParams.K));
    });

    it("should increase with stock price", () => {
      const lowerPrice = blackScholesCallPrice(
        baseParams.S,
        baseParams.K,
        baseParams.T,
        baseParams.r,
        baseParams.sigma
      );
      const higherPrice = blackScholesCallPrice(
        baseParams.S * 1.5,
        baseParams.K,
        baseParams.T,
        baseParams.r,
        baseParams.sigma
      );
      expect(higherPrice).toBeGreaterThan(lowerPrice);
    });

    it("should decrease with strike price", () => {
      const lowerStrike = blackScholesCallPrice(
        baseParams.S,
        baseParams.K,
        baseParams.T,
        baseParams.r,
        baseParams.sigma
      );
      const higherStrike = blackScholesCallPrice(
        baseParams.S,
        baseParams.K * 1.5,
        baseParams.T,
        baseParams.r,
        baseParams.sigma
      );
      expect(higherStrike).toBeLessThan(lowerStrike);
    });
  });

  describe("calculateWarrantValue", () => {
    const baseParams = {
      stockPrice: 350,
      strikePrice: 460,
      timeToExpiryYears: 2.5,
      impliedVolatility: 0.3,
      exchangeRate: 0.92, // EUR/USD
      investment: 2000,
      initialWarrantPrice: 8.145,
    };

    it("should calculate expected warrant value for base scenario", () => {
      const value = calculateWarrantValue(baseParams);

      // The value should be positive but less than the max potential value
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThan(baseParams.investment * 10); // Reasonable upper bound
    });

    it("should scale linearly with investment amount", () => {
      const value1 = calculateWarrantValue(baseParams);

      const value2 = calculateWarrantValue({
        ...baseParams,
        investment: baseParams.investment * 2,
      });

      expect(value2).toBeCloseTo(value1 * 2, 2);
    });

    it("should handle time decay", () => {
      const valueLongTime = calculateWarrantValue(baseParams);

      const valueShortTime = calculateWarrantValue({
        ...baseParams,
        timeToExpiryYears: baseParams.timeToExpiryYears / 2,
      });

      expect(valueShortTime).toBeLessThan(valueLongTime);
    });

    it("should calculate expected value after one month", () => {
      // Setup initial parameters
      const initialParams = {
        stockPrice: 350,
        strikePrice: 460,
        endDate: new Date("2026-06-26"),
        impliedVolatility: 0.3,
        exchangeRate: 0.92,
        investment: 2000,
        initialWarrantPrice: 8.145,
      };

      // Calculate price after one month based on linear interpolation to 500 by 2025
      const now = new Date();
      const totalMonthsTo2025 = 24; // roughly 2 years
      const priceIncreasePerMonth =
        (500 - initialParams.stockPrice) / totalMonthsTo2025;
      const priceAfterOneMonth =
        initialParams.stockPrice + priceIncreasePerMonth;

      // Calculate time to expiry in years (initial and after one month)
      const initialTimeToExpiry =
        (initialParams.endDate.getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24 * 365);
      const timeToExpiryAfterOneMonth = initialTimeToExpiry - 1 / 12;

      // Calculate initial value and value after one month
      const initialValue = calculateWarrantValue({
        stockPrice: initialParams.stockPrice,
        strikePrice: initialParams.strikePrice,
        timeToExpiryYears: initialTimeToExpiry,
        impliedVolatility: initialParams.impliedVolatility,
        exchangeRate: initialParams.exchangeRate,
        investment: initialParams.investment,
        initialWarrantPrice: initialParams.initialWarrantPrice,
      });

      const valueAfterOneMonth = calculateWarrantValue({
        stockPrice: priceAfterOneMonth,
        strikePrice: initialParams.strikePrice,
        timeToExpiryYears: timeToExpiryAfterOneMonth,
        impliedVolatility: initialParams.impliedVolatility,
        exchangeRate: initialParams.exchangeRate,
        investment: initialParams.investment,
        initialWarrantPrice: initialParams.initialWarrantPrice,
      });

      // Expectations
      expect(valueAfterOneMonth).toBeGreaterThan(0);
      expect(valueAfterOneMonth).toBeLessThan(initialParams.investment * 10);

      // The change shouldn't be extremely dramatic in just one month
      const percentageChange =
        ((valueAfterOneMonth - initialValue) / initialValue) * 100;
      expect(Math.abs(percentageChange)).toBeLessThan(50); // Expecting less than 50% change in first month

      // Value should increase as we're moving towards the target price
      expect(valueAfterOneMonth).toBeGreaterThan(initialValue);
    });
  });
});
