import React from "react";

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search analyses..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors">
          Filter
        </button>
        <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors">
          Sort
        </button>
      </div>
    </div>
  );
};

export default SearchAndFilter; 