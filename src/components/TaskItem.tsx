import { Trash2, Calendar, Flag, Edit2, Check, X } from 'lucide-react';
import { Task } from '../App';
import { useState } from 'react';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
}

const categoryColors = {
  Perso: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    gradient: 'from-emerald-500 to-green-600',
  },
  Travail: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    gradient: 'from-blue-500 to-indigo-600',
  },
  Études: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
    gradient: 'from-purple-500 to-pink-600',
  },
};

const priorityColors = {
  Haute: { bg: 'bg-red-100', text: 'text-red-700', icon: 'text-red-500' },
  Moyenne: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-500' },
  Basse: { bg: 'bg-slate-100', text: 'text-slate-700', icon: 'text-slate-500' },
};

export function TaskItem({ task, onToggle, onDelete, onUpdate }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onUpdate(task.id, {
        title: editTitle,
        description: editDescription || undefined,
      });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setIsEditing(false);
  };

  const getDueDateColor = () => {
    if (!task.dueDate || task.completed) return 'text-slate-500';
    
    const now = new Date();
    const due = new Date(task.dueDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffDays = Math.ceil((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600 font-medium';
    if (diffDays === 0) return 'text-orange-600 font-medium';
    if (diffDays <= 2) return 'text-amber-600';
    return 'text-slate-500';
  };

  const formatDueDate = () => {
    if (!task.dueDate) return null;
    
    const now = new Date();
    const due = new Date(task.dueDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffDays = Math.ceil((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `En retard de ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Demain';
    if (diffDays <= 7) return `Dans ${diffDays} jours`;
    
    return due.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="px-6 py-4 hover:bg-slate-50/70 transition-all group">
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm"
            autoFocus
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Description..."
            rows={2}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              Sauvegarder
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm transition-colors"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <button
            onClick={() => onToggle(task.id)}
            className="flex-shrink-0 mt-0.5"
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              task.completed
                ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-500 shadow-md'
                : `border-slate-300 hover:border-indigo-400 hover:shadow-sm`
            }`}>
              {task.completed && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className={`text-sm transition-all leading-relaxed ${
                  task.completed
                    ? 'text-slate-400 line-through'
                    : 'text-slate-800'
                }`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className={`text-xs mt-1 ${
                    task.completed ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {task.description}
                  </p>
                )}
              </div>
              
              {/* Priority indicator */}
              <div className={`flex-shrink-0 w-1.5 h-6 rounded-full ${
                task.priority === 'Haute' ? 'bg-red-500' :
                task.priority === 'Moyenne' ? 'bg-amber-500' :
                'bg-slate-300'
              }`} />
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {/* Category */}
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${
                categoryColors[task.category].bg
              } ${categoryColors[task.category].text} ${categoryColors[task.category].border}`}>
                {task.category}
              </span>

              {/* Priority */}
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${
                priorityColors[task.priority].bg
              } ${priorityColors[task.priority].text}`}>
                <Flag className={`w-3 h-3 ${priorityColors[task.priority].icon}`} />
                {task.priority}
              </span>

              {/* Due date */}
              {task.dueDate && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-100 ${getDueDateColor()}`}>
                  <Calendar className="w-3 h-3" />
                  {formatDueDate()}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Modifier"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
