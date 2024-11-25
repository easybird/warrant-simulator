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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface ScenarioResultsProps {
  results: any[];
}

export const ScenarioResults = ({ results }: ScenarioResultsProps) => {
  // Calculate min and max values including all ranges
  const allPrices = results.flatMap((r) => [
    parseFloat(r.teslaPrice),
    parseFloat(r.upperBound),
    parseFloat(r.lowerBound),
  ]);
  const allInvestmentValues = results.flatMap((r) => [
    parseFloat(r.investmentValue),
    parseFloat(r.upperInvestmentValue),
    parseFloat(r.lowerInvestmentValue),
  ]);

  const minStock = Math.floor(Math.min(...allPrices) * 0.9);
  const maxStock = Math.ceil(Math.max(...allPrices) * 1.1);
  const minInvestment = Math.floor(Math.min(...allInvestmentValues) * 0.9);
  const maxInvestment = Math.ceil(Math.max(...allInvestmentValues) * 1.1);

  // Stock price color theme (blue)
  const stockMainColor = "#2563eb"; // blue-600
  const stockRangeColor = "#93c5fd"; // blue-300

  // Investment value color theme (orange)
  const investmentMainColor = "#ea580c"; // orange-600
  const investmentRangeColor = "#fdba74"; // orange-300

  const formatXAxis = (month: number) =>
    format(new Date().setMonth(new Date().getMonth() + month), "MMM yyyy");

  return (
    <div className="space-y-6">
      <div className="h-[250px]">
        <h2 className="text-lg font-semibold mb-4">Stock Price</h2>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={results}
            syncId="anyId"
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={formatXAxis} height={40} />
            <YAxis
              domain={[minStock, maxStock]}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              formatter={(value: number, name: string) => [`$${value}`, name]}
              labelFormatter={formatXAxis}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="upperBound"
              stroke={stockRangeColor}
              strokeDasharray="3 3"
              dot={false}
              name="Upper Range"
            />
            <Line
              type="monotone"
              dataKey="lowerBound"
              stroke={stockRangeColor}
              strokeDasharray="3 3"
              dot={false}
              name="Lower Range"
            />
            <Line
              type="monotone"
              dataKey="teslaPrice"
              stroke={stockMainColor}
              name="Stock Price"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="h-[250px]">
        <h2 className="text-lg font-semibold mb-4">Investment Value</h2>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={results}
            syncId="anyId"
            margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={formatXAxis} height={40} />
            <YAxis
              domain={[minInvestment, maxInvestment]}
              tickFormatter={(value) => `€${value}`}
            />
            <Tooltip
              formatter={(value: number, name: string) => [`€${value}`, name]}
              labelFormatter={formatXAxis}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="upperInvestmentValue"
              stroke={investmentRangeColor}
              strokeDasharray="3 3"
              dot={false}
              name="Upper Range"
            />
            <Line
              type="monotone"
              dataKey="lowerInvestmentValue"
              stroke={investmentRangeColor}
              strokeDasharray="3 3"
              dot={false}
              name="Lower Range"
            />
            <Line
              type="monotone"
              dataKey="investmentValue"
              stroke={investmentMainColor}
              name="Investment Value"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="h-[250px] mb-12">
        <h2 className="text-lg font-semibold mb-4">Scenario Results</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Stock Price ($)</TableHead>
              <TableHead>Range ($)</TableHead>
              <TableHead>Warrant Price (€)</TableHead>
              <TableHead>Investment Value (€)</TableHead>
              <TableHead>Profit/Loss (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result, index) => (
              <TableRow key={index}>
                <TableCell>
                  {format(
                    new Date().setMonth(new Date().getMonth() + result.month),
                    "MMM yyyy"
                  )}
                </TableCell>
                <TableCell>{result.teslaPrice}</TableCell>
                <TableCell>
                  {result.lowerBound && result.upperBound
                    ? `${result.lowerBound} - ${result.upperBound}`
                    : "N/A"}
                </TableCell>
                <TableCell>{result.warrantPrice}</TableCell>
                <TableCell>
                  {result.lowerInvestmentValue && result.upperInvestmentValue
                    ? `${result.investmentValue} (${result.lowerInvestmentValue} - ${result.upperInvestmentValue})`
                    : result.investmentValue}
                </TableCell>
                <TableCell
                  className={
                    parseFloat(result.profitLossPercentage) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {result.profitLossPercentage}%
                  {result.lowerProfitLossPercentage &&
                    result.upperProfitLossPercentage && (
                      <span className="text-gray-500 text-sm">
                        {" "}
                        ({result.lowerProfitLossPercentage}% -{" "}
                        {result.upperProfitLossPercentage}%)
                      </span>
                    )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
