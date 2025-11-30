import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TaskList } from './components/TaskList';
import { VoiceControlPanel } from './components/VoiceControlPanel';
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  category: 'Perso' | 'Travail' | 'Études';
  priority: 'Haute' | 'Moyenne' | 'Basse';
  dueDate?: Date;
  createdAt: Date;
}

export type FilterType = 'all' | 'active' | 'completed' | 'today';
export type SortType = 'date' | 'priority' | 'category' | 'alphabetical';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Réviser pour l\'examen de mathématiques',
      description: 'Chapitres 5 à 8, focus sur les équations différentielles',
      completed: false,
      category: 'Études',
      priority: 'Haute',
      dueDate: new Date(Date.now() + 86400000 * 2),
      createdAt: new Date(),
    },
    {
      id: '2',
      title: 'Acheter du pain et des fruits',
      description: 'Boulangerie + marché',
      completed: false,
      category: 'Perso',
      priority: 'Moyenne',
      dueDate: new Date(),
      createdAt: new Date(),
    },
    {
      id: '3',
      title: 'Préparer la présentation client',
      description: 'Slides PowerPoint pour la réunion du Q4',
      completed: true,
      category: 'Travail',
      priority: 'Haute',
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      id: '4',
      title: 'Appeler le médecin pour RDV',
      completed: false,
      category: 'Perso',
      priority: 'Moyenne',
      dueDate: new Date(Date.now() + 86400000),
      createdAt: new Date(),
    },
    {
      id: '5',
      title: 'Finir le rapport trimestriel',
      description: 'Rapport financier T3 2025',
      completed: false,
      category: 'Travail',
      priority: 'Haute',
      dueDate: new Date(Date.now() + 86400000 * 3),
      createdAt: new Date(),
    },
    {
      id: '6',
      title: 'Faire du sport (jogging)',
      completed: false,
      category: 'Perso',
      priority: 'Basse',
      createdAt: new Date(),
    },
    {
      id: '7',
      title: 'Répondre aux emails',
      completed: true,
      category: 'Travail',
      priority: 'Moyenne',
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
  ]);

  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('ergovoice-tasks');
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        const tasksWithDates = parsed.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        }));
        setTasks(tasksWithDates);
      } catch (e) {
        console.error('Error loading tasks:', e);
      }
    }
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem('ergovoice-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (
    title: string,
    category: 'Perso' | 'Travail' | 'Études' = 'Perso',
    priority: 'Haute' | 'Moyenne' | 'Basse' = 'Moyenne',
    description?: string,
    dueDate?: Date
  ) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      completed: false,
      category,
      priority,
      dueDate,
      createdAt: new Date(),
    };
    setTasks([newTask, ...tasks]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ));
  };

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task && !task.completed) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const deleteAllCompleted = () => {
    setTasks(tasks.filter(task => !task.completed));
  };

  const handleVoiceCommand = (command: string) => {
    // Vérifier si c'est une commande structurée du nouveau système
    if (command.startsWith('TASK:')) {
      const taskData = JSON.parse(command.substring(5));
      addTask(taskData.title, taskData.category, taskData.priority);
      setTranscript(`✅ Tâche ajoutée : "${taskData.title}" (${taskData.category}, priorité ${taskData.priority})`);
      return;
    }

    const lowerCommand = command.toLowerCase();

    // Marquer comme terminée
    if (lowerCommand.includes('coche') || lowerCommand.includes('termine') || lowerCommand.includes('complète') || lowerCommand.includes('marque comme terminée')) {
      // Extraire le titre de la tâche à cocher
      let searchTitle = command
        .replace(/coche tâche/gi, '')
        .replace(/coche la tâche/gi, '')
        .replace(/coche/gi, '')
        .replace(/termine tâche/gi, '')
        .replace(/termine la tâche/gi, '')
        .replace(/termine/gi, '')
        .replace(/complète tâche/gi, '')
        .replace(/complète la tâche/gi, '')
        .replace(/complète/gi, '')
        .replace(/marque comme terminée/gi, '')
        .trim();
      
      const taskToComplete = tasks.find(task => 
        !task.completed && task.title.toLowerCase().includes(searchTitle.toLowerCase())
      );
      
      if (taskToComplete) {
        toggleTask(taskToComplete.id);
        setTranscript(`✅ Tâche cochée : "${taskToComplete.title}"`);
      } else {
        setTranscript(`❌ Aucune tâche trouvée contenant "${searchTitle}"`);
      }
    }
    // Supprimer tâches terminées
    else if (lowerCommand.includes('supprime') && (lowerCommand.includes('terminée') || lowerCommand.includes('terminées') || lowerCommand.includes('complétée'))) {
      const count = tasks.filter(t => t.completed).length;
      if (count > 0) {
        deleteAllCompleted();
        setTranscript(`✅ ${count} tâche(s) terminée(s) supprimée(s)`);
      } else {
        setTranscript('ℹ️ Aucune tâche terminée à supprimer');
      }
    }
    // Changer de filtre
    else if (lowerCommand.includes('affiche') || lowerCommand.includes('montre') || lowerCommand.includes('voir')) {
      if (lowerCommand.includes('aujourd\'hui') || lowerCommand.includes('aujourd hui')) {
        setFilter('today');
        setTranscript('✅ Affichage : tâches du jour');
      } else if (lowerCommand.includes('terminée') || lowerCommand.includes('terminées') || lowerCommand.includes('complétée')) {
        setFilter('completed');
        setTranscript('✅ Affichage : tâches terminées');
      } else if (lowerCommand.includes('en cours') || lowerCommand.includes('actives')) {
        setFilter('active');
        setTranscript('✅ Affichage : tâches en cours');
      } else if (lowerCommand.includes('toute') || lowerCommand.includes('tout')) {
        setFilter('all');
        setTranscript('✅ Affichage : toutes les tâches');
      }
    }
    // Trier
    else if (lowerCommand.includes('trier') || lowerCommand.includes('tri') || lowerCommand.includes('trie')) {
      if (lowerCommand.includes('priorité')) {
        setSortBy('priority');
        setTranscript('✅ Tri par priorité');
      } else if (lowerCommand.includes('catégorie')) {
        setSortBy('category');
        setTranscript('✅ Tri par catégorie');
      } else if (lowerCommand.includes('date')) {
        setSortBy('date');
        setTranscript('✅ Tri par date');
      } else if (lowerCommand.includes('alphabétique') || lowerCommand.includes('alphabet')) {
        setSortBy('alphabetical');
        setTranscript('✅ Tri alphabétique');
      }
    }
    // Commande non reconnue
    else {
      setTranscript('❌ Commande non reconnue');
    }
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40">
  <Header tasksCount={tasks.length} />

  {/* Celebration overlay */}
  {showCelebration && (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="animate-bounce">
        <div className="text-8xl">🎉</div>
      </div>
    </div>
  )}

  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
    {/* Stats Panel */}
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mt-6">
      
      {/* Colonne de gauche - Liste des tâches (70%) */}
      <div className="col-span-1 md:col-span-2 lg:col-span-2 order-2 md:order-1 lg:order-1">
        <div className="overflow-auto max-h-[calc(100vh-8rem)] lg:max-h-[calc(100vh-12rem)]">
          <TaskList
            tasks={tasks}
            filter={filter}
            sortBy={sortBy}
            searchQuery={searchQuery}
            onFilterChange={setFilter}
            onSortChange={setSortBy}
            onSearchChange={setSearchQuery}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            onUpdateTask={updateTask}
            onAddTask={addTask}
          />
        </div>
      </div>

      {/* Colonne de droite - Contrôle vocal (30%) */}
      <div className="col-span-1 md:col-span-1 lg:col-span-1 order-1 md:order-2 lg:order-2">
        <div className="flex flex-col w-full h-full overflow-auto">
          <VoiceControlPanel
            isListening={isListening}
            transcript={transcript}
            onListeningChange={setIsListening}
            onTranscriptChange={setTranscript}
            onVoiceCommand={handleVoiceCommand}
          />
        </div>
      </div>
    </div>
  </main>
</div>
  );
}