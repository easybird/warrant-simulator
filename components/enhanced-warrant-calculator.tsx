"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface Scenario {
  name: string;
  data: { month: number; price: number }[];
}

const EnhancedWarrantCalculator = () => {
  const [investment, setInvestment] = useState(2000);
  const [strikePrice, setStrikePrice] = useState(460);
  const [warrantPrice, setWarrantPrice] = useState(8.145);
  const [volatility, setVolatility] = useState(0.3);
  const [currentStockPrice, setCurrentStockPrice] = useState(200);
  const [endDate, setEndDate] = useState("2026-12-31");
  const [predicted2025, setPredicted2025] = useState(300);
  const [predicted2026, setPredicted2026] = useState(400);
  const [worstCase2025, setWorstCase2025] = useState(150);
  const [worstCase2026, setWorstCase2026] = useState(200);
  const [bestCase2025, setBestCase2025] = useState(450);
  const [bestCase2026, setBestCase2026] = useState(600);
  const [exchangeRate, setExchangeRate] = useState(1); // EUR per USD
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [totalMonths, setTotalMonths] = useState(0);

  useEffect(() => {
    generateScenarios();
  }, [
    currentStockPrice,
    endDate,
    predicted2025,
    predicted2026,
    worstCase2025,
    worstCase2026,
    bestCase2025,
    bestCase2026,
  ]);

  const generateScenarios = () => {
    const end = new Date(endDate);
    const now = new Date();
    const totalMonthsCalculated =
      (end.getFullYear() - now.getFullYear()) * 12 +
      (end.getMonth() - now.getMonth());
    setTotalMonths(totalMonthsCalculated);

    const createScenario = (
      name: string,
      target2025: number,
      target2026: number
    ) => {
      const data = [];
      const monthsTo2025 = Math.min(totalMonthsCalculated, 24);
      const monthsTo2026 = totalMonthsCalculated - monthsTo2025;

      for (let i = 0; i <= monthsTo2025; i++) {
        data.push({
          month: i,
          price:
            currentStockPrice +
            (target2025 - currentStockPrice) * (i / monthsTo2025),
        });
      }

      for (let i = 1; i <= monthsTo2026; i++) {
        data.push({
          month: monthsTo2025 + i,
          price: target2025 + (target2026 - target2025) * (i / monthsTo2026),
        });
      }

      return { name, data };
    };

    const newScenarios = [
      createScenario("Expected", predicted2025, predicted2026),
      createScenario("Worst Case", worstCase2025, worstCase2026),
      createScenario("Best Case", bestCase2025, bestCase2026),
    ];

    setScenarios(newScenarios);
  };

  const cumulativeNormalDistribution = (x: number) => {
    var sign = x >= 0 ? 1 : -1;
    x = Math.abs(x) / Math.sqrt(2);
    var t = 1 / (1 + 0.3275911 * x);

    var a1 = 0.254829592;
    var a2 = -0.284496736;
    var a3 = 1.421413741;
    var a4 = -1.453152027;
    var a5 = 1.061405429;

    var erf =
      1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return 0.5 * (1 + sign * erf);
  };

  const blackScholesCallPrice = (
    S: number,
    K: number,
    T: number,
    r: number,
    sigma: number
  ) => {
    if (T <= 0) {
      return Math.max(0, S - K);
    }
    var d1 =
      (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) /
      (sigma * Math.sqrt(T));
    var d2 = d1 - sigma * Math.sqrt(T);
    var N_d1 = cumulativeNormalDistribution(d1);
    var N_d2 = cumulativeNormalDistribution(d2);
    var callPrice = S * N_d1 - K * Math.exp(-r * T) * N_d2;
    return callPrice;
  };

  const calculateResults = () => {
    const resultData = scenarios.flatMap((scenario) => {
      return scenario.data.map((point) => {
        let T = (totalMonths - point.month) / 12;
        if (T <= 0) {
          T = 0.0001; // To avoid division by zero or negative time
        }

        const S = point.price; // Stock price in USD
        const K = strikePrice; // Strike price in USD
        const r = 0.01; // Risk-free interest rate (1%)
        const sigma = volatility; // Volatility

        // Calculate warrant price using Black-Scholes formula
        const callPriceUSD = blackScholesCallPrice(S, K, T, r, sigma);
        const totalWarrantPrice = callPriceUSD * exchangeRate; // Convert to EUR

        const warrantsBought = investment / warrantPrice; // Number of warrants bought initially
        const currentInvestmentValue = totalWarrantPrice * warrantsBought;
        const profitLossPercentage =
          ((currentInvestmentValue - investment) / investment) * 100;

        return {
          scenario: scenario.name,
          month: point.month,
          teslaPrice: point.price.toFixed(2),
          warrantPrice: totalWarrantPrice.toFixed(2),
          investmentValue: currentInvestmentValue.toFixed(2),
          profitLossPercentage: profitLossPercentage.toFixed(2),
        };
      });
    });

    setResults(resultData);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Enhanced Warrant Calculator</CardTitle>
        <CardDescription>
          Calculate and visualize warrant values over time with multiple
          scenarios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label
              htmlFor="investment"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Initial Investment (€)
            </label>
            <Input
              id="investment"
              type="number"
              value={investment}
              onChange={(e) => setInvestment(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label
              htmlFor="strikePrice"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Strike Price ($)
            </label>
            <Input
              id="strikePrice"
              type="number"
              value={strikePrice}
              onChange={(e) => setStrikePrice(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label
              htmlFor="warrantPrice"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Initial Warrant Price (€)
            </label>
            <Input
              id="warrantPrice"
              type="number"
              value={warrantPrice}
              onChange={(e) => setWarrantPrice(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label
              htmlFor="volatility"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Implied Volatility
            </label>
            <Input
              id="volatility"
              type="number"
              step="0.01"
              value={volatility}
              onChange={(e) => setVolatility(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label
              htmlFor="currentStockPrice"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Current Stock Price ($)
            </label>
            <Input
              id="currentStockPrice"
              type="number"
              value={currentStockPrice}
              onChange={(e) =>
                setCurrentStockPrice(parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              End Date of Warrant
            </label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="exchangeRate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Exchange Rate (EUR per USD)
            </label>
            <Input
              id="exchangeRate"
              type="number"
              step="0.0001"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label
              htmlFor="predicted2025"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Predicted Price 2025 ($)
            </label>
            <Input
              id="predicted2025"
              type="number"
              value={predicted2025}
              onChange={(e) =>
                setPredicted2025(parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div>
            <label
              htmlFor="predicted2026"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Predicted Price 2026 ($)
            </label>
            <Input
              id="predicted2026"
              type="number"
              value={predicted2026}
              onChange={(e) =>
                setPredicted2026(parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div>
            <label
              htmlFor="worstCase2025"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Worst Case 2025 ($)
            </label>
            <Input
              id="worstCase2025"
              type="number"
              value={worstCase2025}
              onChange={(e) =>
                setWorstCase2025(parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div>
            <label
              htmlFor="worstCase2026"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Worst Case 2026 ($)
            </label>
            <Input
              id="worstCase2026"
              type="number"
              value={worstCase2026}
              onChange={(e) =>
                setWorstCase2026(parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div>
            <label
              htmlFor="bestCase2025"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Best Case 2025 ($)
            </label>
            <Input
              id="bestCase2025"
              type="number"
              value={bestCase2025}
              onChange={(e) => setBestCase2025(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label
              htmlFor="bestCase2026"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Best Case 2026 ($)
            </label>
            <Input
              id="bestCase2026"
              type="number"
              value={bestCase2026}
              onChange={(e) => setBestCase2026(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <Button onClick={calculateResults} className="mb-6">
          Calculate
        </Button>

        {results.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Results</h3>
            <div className="mb-6">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={results}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="teslaPrice"
                    stroke="#8884d8"
                    name="Stock Price ($)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="investmentValue"
                    stroke="#82ca9d"
                    name="Investment Value (€)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Stock Price ($)</TableHead>
                  <TableHead>Warrant Price (€)</TableHead>
                  <TableHead>Investment Value (€)</TableHead>
                  <TableHead>Profit/Loss (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell>{result.scenario}</TableCell>
                    <TableCell>
                      {format(
                        new Date().setMonth(
                          new Date().getMonth() + result.month
                        ),
                        "MMM yyyy"
                      )}
                    </TableCell>
                    <TableCell>{result.teslaPrice}</TableCell>
                    <TableCell>{result.warrantPrice}</TableCell>
                    <TableCell>{result.investmentValue}</TableCell>
                    <TableCell
                      className={
                        parseFloat(result.profitLossPercentage) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {result.profitLossPercentage}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedWarrantCalculator;
