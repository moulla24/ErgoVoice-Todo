import { CheckCircle2, Circle, Clock, TrendingUp } from 'lucide-react';
import { Task } from '../App';

interface StatsPanelProps {
  tasks: Task[];
}

export function StatsPanel({ tasks }: StatsPanelProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const activeTasks = totalTasks - completedTasks;
  const highPriorityTasks = tasks.filter(t => !t.completed && t.priority === 'Haute').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    {
      label: 'Total',
      value: totalTasks,
      icon: Circle,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: 'En cours',
      value: activeTasks,
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
    },
    {
      label: 'Terminées',
      value: completedTasks,
      icon: CheckCircle2,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      label: 'Haute priorité',
      value: highPriorityTasks,
      icon: TrendingUp,
      color: 'from-red-500 to-pink-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              {index === 2 && totalTasks > 0 && (
                <div className="px-2 py-1 bg-green-100 rounded-full">
                  <span className="text-xs text-green-700">{completionRate}%</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-3xl text-slate-800 mb-1">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
