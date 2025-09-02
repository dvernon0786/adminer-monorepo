// Simple alphabetical country list (no regions, no country codes visible to user)
const COUNTRIES = [
  'Argentina', 'Australia', 'Austria', 'Bangladesh', 'Belgium', 'Bolivia', 'Brazil', 'Canada', 'Chile', 'Colombia',
  'Costa Rica', 'Denmark', 'Dominican Republic', 'Ecuador', 'El Salvador', 'Finland', 'France', 'Germany', 'Greece',
  'Guatemala', 'Honduras', 'Hong Kong', 'India', 'Indonesia', 'Ireland', 'Israel', 'Italy', 'Japan', 'Malaysia',
  'Mexico', 'Netherlands', 'New Zealand', 'Nicaragua', 'Norway', 'Panama', 'Paraguay', 'Peru', 'Philippines',
  'Poland', 'Portugal', 'Romania', 'Singapore', 'South Africa', 'South Korea', 'Spain', 'Sweden', 'Switzerland',
  'Taiwan', 'Thailand', 'Turkey', 'United Kingdom', 'United States', 'Uruguay', 'Vietnam'
];

interface CountrySelectorProps {
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CountrySelector({ selectedCountry, onCountryChange, disabled = false, className = '' }: CountrySelectorProps) {
  return (
    <select
      value={selectedCountry}
      onChange={(e) => onCountryChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12 ${className}`}
    >
      <option value="">Select country</option>
      {COUNTRIES.map((country) => (
        <option key={country} value={country}>
          {country}
        </option>
      ))}
    </select>
  );
} 