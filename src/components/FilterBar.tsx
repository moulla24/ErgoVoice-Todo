import { FilterType } from '../App';

interface FilterBarProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const filters: { label: string; value: FilterType }[] = [
  { label: 'Toutes', value: 'all' },
  { label: 'En cours', value: 'active' },
  { label: 'Terminées', value: 'completed' },
  { label: 'Aujourd\'hui', value: 'today' },
];

export function FilterBar({ currentFilter, onFilterChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(filter => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`px-4 py-2 rounded-full text-sm transition-all ${
            currentFilter === filter.value
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
