// Ad count options matching homepage implementation
const AD_COUNT_OPTIONS = [
  { value: 10, label: '10 ads (Free)', description: 'Free plan limit' },
  { value: 50, label: '50 ads', description: 'Standard option' },
  { value: 100, label: '100 ads (Recommended)', description: 'Recommended for most users' },
  { value: 200, label: '200 ads', description: 'High volume option' },
  { value: 300, label: '300 ads (Pro)', description: 'Pro plan option' }
];

interface AdCountSelectorProps {
  selectedCount: number | "";
  onCountChange: (count: number | "") => void;
  disabled?: boolean;
  className?: string;
}

export function AdCountSelector({ 
  selectedCount, 
  onCountChange, 
  disabled = false, 
  className = '' 
}: AdCountSelectorProps) {
  return (
    <div className={className}>
      <label htmlFor="adCount" className="block text-sm font-medium text-gray-700 mb-2">
        Number of Ads to Scrape
      </label>
      <select
        id="adCount"
        value={selectedCount}
        onChange={(e) => onCountChange(e.target.value === "" ? "" : Number(e.target.value))}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12"
      >
        <option value="">Select number of ads</option>
        {AD_COUNT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {selectedCount && (
        <p className="text-xs text-gray-500 mt-1">
          {AD_COUNT_OPTIONS.find(opt => opt.value === selectedCount)?.description}
        </p>
      )}
    </div>
  );
}