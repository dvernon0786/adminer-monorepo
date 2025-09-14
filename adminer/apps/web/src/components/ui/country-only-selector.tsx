import { CountrySelector } from './country-selector';

interface CountryOnlySelectorProps {
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CountryOnlySelector({ 
  selectedCountry, 
  onCountryChange, 
  disabled = false, 
  className = '' 
}: CountryOnlySelectorProps) {
  return (
    <div className={className}>
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
  );
}