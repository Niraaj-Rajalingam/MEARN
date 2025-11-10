'use client';

export type TaskFilterType = 'all' | 'assigned_to_me' | 'assigned_by_me';

interface TaskFilterProps {
  selectedFilter: TaskFilterType;
  onFilterChange: (filter: TaskFilterType) => void;
}

const FILTER_OPTIONS: { value: TaskFilterType; label: string; description: string }[] = [
  {
    value: 'all',
    label: 'All Tasks',
    description: 'All tasks you\'re involved with',
  },
  {
    value: 'assigned_to_me',
    label: 'Assigned to Me',
    description: 'Tasks assigned to you by others',
  },
  {
    value: 'assigned_by_me',
    label: 'Assigned by Me',
    description: 'Tasks you created and assigned to others',
  },
];

export default function TaskFilter({ selectedFilter, onFilterChange }: TaskFilterProps) {
  return (
    <div className="mb-4 flex gap-2 flex-wrap">
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onFilterChange(option.value)}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
            selectedFilter === option.value
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={option.description}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
