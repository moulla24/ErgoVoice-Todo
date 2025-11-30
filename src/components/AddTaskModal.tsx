import { X, Calendar, Tag, Flag, FileText } from 'lucide-react';
import { useState } from 'react';

interface AddTaskModalProps {
  onClose: () => void;
  onAdd: (
    title: string,
    category: 'Perso' | 'Travail' | 'Études',
    priority: 'Haute' | 'Moyenne' | 'Basse',
    description?: string,
    dueDate?: Date
  ) => void;
}

export function AddTaskModal({ onClose, onAdd }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Perso' | 'Travail' | 'Études'>('Perso');
  const [priority, setPriority] = useState<'Haute' | 'Moyenne' | 'Basse'>('Moyenne');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(
        title,
        category,
        priority,
        description || undefined,
        dueDate ? new Date(dueDate) : undefined
      );
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600">
          <h3 className="text-white">Nouvelle tâche</h3>
          <button
            onClick={onClose}
            type="button"
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm text-slate-700 mb-2">
                Titre de la tâche *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Réviser pour l'examen..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 text-sm"
                autoFocus
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
                <FileText className="w-4 h-4" />
                Description (optionnelle)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ajoutez des détails..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 text-sm resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
                <Tag className="w-4 h-4" />
                Catégorie
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Perso', 'Travail', 'Études'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all ${
                      category === cat
                        ? cat === 'Perso'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : cat === 'Travail'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
                <Flag className="w-4 h-4" />
                Priorité
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Haute', 'Moyenne', 'Basse'] as const).map((prio) => (
                  <button
                    key={prio}
                    type="button"
                    onClick={() => setPriority(prio)}
                    className={`px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all ${
                      priority === prio
                        ? prio === 'Haute'
                          ? 'bg-red-600 text-white shadow-md'
                          : prio === 'Moyenne'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-slate-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {prio}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
                <Calendar className="w-4 h-4" />
                Date d'échéance (optionnelle)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors text-sm sm:text-base"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Ajouter
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}