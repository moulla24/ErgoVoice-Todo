import { Mic2 } from 'lucide-react';

interface HeaderProps {
  tasksCount: number;
}

export function Header({ tasksCount }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Mic2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-slate-800 block leading-tight">
                ErgoVoice-Todo
              </span>
              <span className="text-xs text-slate-500">{tasksCount} tâche{tasksCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}