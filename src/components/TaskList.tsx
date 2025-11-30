import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { Task, FilterType, SortType } from '../App';
import { FilterBar } from './FilterBar';
import { TaskItem } from './TaskItem';
import { AddTaskModal } from './AddTaskModal';
import { useState } from 'react';

interface TaskListProps {
  tasks: Task[];
  filter: FilterType;
  sortBy: SortType;
  searchQuery: string;
  onFilterChange: (filter: FilterType) => void;
  onSortChange: (sort: SortType) => void;
  onSearchChange: (query: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onAddTask: (title: string, category: 'Perso' | 'Travail' | 'Études', priority: 'Haute' | 'Moyenne' | 'Basse', description?: string, dueDate?: Date) => void;
}

export function TaskList({
  tasks,
  filter,
  sortBy,
  searchQuery,
  onFilterChange,
  onSortChange,
  onSearchChange,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  onAddTask,
}: TaskListProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const getFilteredTasks = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let filtered = tasks;

    // Apply filter
    switch (filter) {
      case 'active':
        filtered = tasks.filter(task => !task.completed);
        break;
      case 'completed':
        filtered = tasks.filter(task => task.completed);
        break;
      case 'today':
        filtered = tasks.filter(task => {
          if (!task.dueDate) return false;
          const taskDate = new Date(task.dueDate);
          const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
          return taskDay.getTime() === today.getTime();
        });
        break;
      default:
        filtered = tasks;
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sort
    const sorted = [...filtered];
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { 'Haute': 0, 'Moyenne': 1, 'Basse': 2 };
        sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      case 'category':
        sorted.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'alphabetical':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'date':
      default:
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return sorted;
  };

  const filteredTasks = getFilteredTasks();
  const activeTasksCount = tasks.filter(t => !t.completed).length;

  const sortOptions = [
    { label: 'Date (récent)', value: 'date' as SortType },
    { label: 'Priorité', value: 'priority' as SortType },
    { label: 'Catégorie', value: 'category' as SortType },
    { label: 'Alphabétique', value: 'alphabetical' as SortType },
  ];

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-slate-800">Mes tâches</h2>
              <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-sm shadow-sm">
                {activeTasksCount}
              </span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Trier</span>
              </button>
              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-10">
                  {sortOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        sortBy === option.value
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher une tâche..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 text-sm"
            />
          </div>

          <FilterBar currentFilter={filter} onFilterChange={onFilterChange} />
        </div>

        {/* Task list */}
        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {filteredTasks.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-500 mb-2">Aucune tâche trouvée</p>
              <p className="text-sm text-slate-400">
                {searchQuery ? 'Essayez une autre recherche' : 'Ajoutez votre première tâche'}
              </p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggleTask}
                onDelete={onDeleteTask}
                onUpdate={onUpdateTask}
              />
            ))
          )}
        </div>

        {/* Add task button */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50/50 to-white border-t border-slate-100">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm">Ajouter une tâche</span>
          </button>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onAdd={onAddTask}
        />
      )}
    </>
  );
}
