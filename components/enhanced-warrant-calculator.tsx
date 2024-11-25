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
import { ScenarioInputs } from "./scenario-inputs";
import { ScenarioResults } from "./scenario-results";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  calculateImpliedVolatility,
  calculateWarrantValue,
} from "@/lib/financial-calculations";

interface Scenario {
  name: string;
  data: {
    month: number;
    price: number;
    upperBound: number;
    lowerBound: number;
  }[];
}

const EnhancedWarrantCalculator = () => {
  const [investment, setInvestment] = useState(2000);
  const [strikePrice, setStrikePrice] = useState(460);
  const [warrantPrice, setWarrantPrice] = useState(8.145);
  const [volatility, setVolatility] = useState(0.3);
  const [currentStockPrice, setCurrentStockPrice] = useState(360);
  const [endDate, setEndDate] = useState("2026-06-26");
  const [predicted2025, setPredicted2025] = useState(500);
  const [predicted2026, setPredicted2026] = useState(1000);
  const [worstCase2025, setWorstCase2025] = useState(350);
  const [worstCase2026, setWorstCase2026] = useState(350);
  const [bestCase2025, setBestCase2025] = useState(800);
  const [bestCase2026, setBestCase2026] = useState(1200);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [totalMonths, setTotalMonths] = useState(0);
  const [volatilityRange, setVolatilityRange] = useState(0.2);
  const [riskFreeRate, setRiskFreeRate] = useState(0.03);

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

      // Modified volatility range calculation
      const getVolatilityRange = (month: number) => {
        // Square root of time to better reflect how uncertainty grows
        const timeEffect = Math.sqrt(month / totalMonthsCalculated);
        return volatilityRange * timeEffect;
      };

      for (let i = 0; i <= monthsTo2025; i++) {
        const basePrice =
          currentStockPrice +
          (target2025 - currentStockPrice) * (i / monthsTo2025);

        const range = getVolatilityRange(i);
        // Apply range as a percentage of the base price
        data.push({
          month: i,
          price: basePrice,
          upperBound: basePrice * (1 + range),
          lowerBound: basePrice * (1 - range),
        });
      }

      for (let i = 1; i <= monthsTo2026; i++) {
        const basePrice =
          target2025 + (target2026 - target2025) * (i / monthsTo2026);

        const range = getVolatilityRange(monthsTo2025 + i);
        // Apply range as a percentage of the base price
        data.push({
          month: monthsTo2025 + i,
          price: basePrice,
          upperBound: basePrice * (1 + range),
          lowerBound: basePrice * (1 - range),
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

  const now = new Date();
  const expiryDate = new Date(endDate);
  const timeToExpiry =
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365);

  const initialImpliedVolatility = calculateImpliedVolatility(
    warrantPrice,
    currentStockPrice,
    strikePrice,
    timeToExpiry,
    riskFreeRate,
    1
  );

  const calculateResults = () => {
    const resultData = scenarios.flatMap((scenario) => {
      return scenario.data.map((point) => {
        let T = (totalMonths - point.month) / 12;
        if (T <= 0) {
          T = 0.0001;
        }

        const mainInvestmentValue = calculateWarrantValue({
          stockPrice: point.price,
          strikePrice,
          timeToExpiryYears: T,
          exchangeRate: 1,
          investment,
          initialWarrantPrice: warrantPrice,
          impliedVolatility: initialImpliedVolatility,
          riskFreeRate,
        });

        const upperInvestmentValue = calculateWarrantValue({
          stockPrice: point.upperBound,
          strikePrice,
          timeToExpiryYears: T,
          exchangeRate: 1,
          investment,
          initialWarrantPrice: warrantPrice,
          impliedVolatility: initialImpliedVolatility,
          riskFreeRate,
        });

        const lowerInvestmentValue = calculateWarrantValue({
          stockPrice: point.lowerBound,
          strikePrice,
          timeToExpiryYears: T,
          exchangeRate: 1,
          investment,
          initialWarrantPrice: warrantPrice,
          impliedVolatility: initialImpliedVolatility,
          riskFreeRate,
        });

        const calculateProfitLoss = (value: number) => {
          return ((value - investment) / investment) * 100;
        };

        return {
          scenario: scenario.name,
          month: point.month,
          teslaPrice: point.price.toFixed(2),
          upperBound: point.upperBound.toFixed(2),
          lowerBound: point.lowerBound.toFixed(2),
          warrantPrice: (
            mainInvestmentValue /
            (investment / warrantPrice)
          ).toFixed(2),
          investmentValue: mainInvestmentValue.toFixed(2),
          upperInvestmentValue: upperInvestmentValue.toFixed(2),
          lowerInvestmentValue: lowerInvestmentValue.toFixed(2),
          profitLossPercentage:
            calculateProfitLoss(mainInvestmentValue).toFixed(2),
          upperProfitLossPercentage:
            calculateProfitLoss(upperInvestmentValue).toFixed(2),
          lowerProfitLossPercentage:
            calculateProfitLoss(lowerInvestmentValue).toFixed(2),
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
              Initial Investment ($)
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
              Initial Warrant Price ($)
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
              htmlFor="volatilityRange"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Price Volatility Range (%)
            </label>
            <Input
              id="volatilityRange"
              type="number"
              step="1"
              value={volatilityRange * 100}
              onChange={(e) =>
                setVolatilityRange(
                  Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) /
                    100
                )
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <ScenarioInputs
            title="Expected Scenario"
            price2025={predicted2025}
            price2026={predicted2026}
            onPrice2025Change={setPredicted2025}
            onPrice2026Change={setPredicted2026}
          />
          <ScenarioInputs
            title="Worst Case Scenario"
            price2025={worstCase2025}
            price2026={worstCase2026}
            onPrice2025Change={setWorstCase2025}
            onPrice2026Change={setWorstCase2026}
          />
          <ScenarioInputs
            title="Best Case Scenario"
            price2025={bestCase2025}
            price2026={bestCase2026}
            onPrice2025Change={setBestCase2025}
            onPrice2026Change={setBestCase2026}
          />
        </div>

        <Button onClick={calculateResults} className="mb-6">
          Calculate
        </Button>

        {results.length > 0 && (
          <Tabs defaultValue="expected" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="expected">Expected Scenario</TabsTrigger>
              <TabsTrigger value="worst">Worst Case Scenario</TabsTrigger>
              <TabsTrigger value="best">Best Case Scenario</TabsTrigger>
            </TabsList>
            <TabsContent value="expected">
              <ScenarioResults
                results={results.filter((r) => r.scenario === "Expected")}
              />
            </TabsContent>
            <TabsContent value="worst">
              <ScenarioResults
                results={results.filter((r) => r.scenario === "Worst Case")}
              />
            </TabsContent>
            <TabsContent value="best">
              <ScenarioResults
                results={results.filter((r) => r.scenario === "Best Case")}
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedWarrantCalculator;
