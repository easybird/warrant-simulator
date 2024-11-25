import { Input } from "@/components/ui/input";

interface ScenarioInputsProps {
  title: string;
  price2025: number;
  price2026: number;
  onPrice2025Change: (value: number) => void;
  onPrice2026Change: (value: number) => void;
}

export const ScenarioInputs = ({
  title,
  price2025,
  price2026,
  onPrice2025Change,
  onPrice2026Change,
}: ScenarioInputsProps) => {
  return (
    <div className="border p-4 rounded-lg">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price 2025 ($)
          </label>
          <Input
            type="number"
            value={price2025}
            onChange={(e) => onPrice2025Change(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price 2026 ($)
          </label>
          <Input
            type="number"
            value={price2026}
            onChange={(e) => onPrice2026Change(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  );
};
