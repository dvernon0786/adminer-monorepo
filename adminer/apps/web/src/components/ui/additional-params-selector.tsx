import { CountrySelector } from './country-selector';

// Priority levels for job processing
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low Priority', description: 'Standard processing time' },
  { value: 'medium', label: 'Medium Priority', description: 'Normal processing time' },
  { value: 'high', label: 'High Priority', description: 'Faster processing' },
  { value: 'urgent', label: 'Urgent', description: 'Highest priority processing' }
];

interface AdditionalParamsSelectorProps {
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  selectedPriority: string;
  onPriorityChange: (priority: string) => void;
  disabled?: boolean;
  className?: string;
}

export function AdditionalParamsSelector({ 
  selectedCountry, 
  onCountryChange, 
  selectedPriority, 
  onPriorityChange, 
  disabled = false, 
  className = '' 
}: AdditionalParamsSelectorProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Country Selection */}
      <div>
        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
          Target Country
        </label>
        <CountrySelector
          selectedCountry={selectedCountry}
          onCountryChange={onCountryChange}
          disabled={disabled}
          className="w-full"
        />
      </div>

      {/* Priority Selection */}
      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
          Processing Priority
        </label>
        <select
          id="priority"
          value={selectedPriority}
          onChange={(e) => onPriorityChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12"
        >
          <option value="">Select priority</option>
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {selectedPriority && (
          <p className="text-xs text-gray-500 mt-1">
            {PRIORITY_OPTIONS.find(opt => opt.value === selectedPriority)?.description}
          </p>
        )}
      </div>
    </div>
  );
}