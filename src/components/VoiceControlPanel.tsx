import { Mic, MicOff, Volume2, AlertCircle, Check, X, Edit3 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface VoiceControlPanelProps {
  isListening: boolean;
  transcript: string;
  onListeningChange: (isListening: boolean) => void;
  onTranscriptChange: (transcript: string) => void;
  onVoiceCommand: (command: string) => void;
}

type DialogStep = 'idle' | 'awaiting-priority' | 'awaiting-category' | 'completed';

export function VoiceControlPanel({
  isListening,
  transcript,
  onListeningChange,
  onTranscriptChange,
  onVoiceCommand,
}: VoiceControlPanelProps) {
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [recognitionInitialized, setRecognitionInitialized] = useState(false);
  const [editableTranscript, setEditableTranscript] = useState('');
  const [canValidate, setCanValidate] = useState(false);
  const [dialogStep, setDialogStep] = useState<DialogStep>('idle');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'Haute' | 'Moyenne' | 'Basse'>('Moyenne');
  const [taskCategory, setTaskCategory] = useState<'Perso' | 'Travail' | 'Études'>('Perso');
  const [currentListening, setCurrentListening] = useState('');
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoValidateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    // Check if browser supports Web Speech API
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setBrowserSupported(false);
      onTranscriptChange('⚠️ Reconnaissance vocale non disponible dans ce navigateur');
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (autoValidateTimeoutRef.current) {
        clearTimeout(autoValidateTimeoutRef.current);
      }
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
    };
  }, []);

  // Redémarrer automatiquement l'écoute quand on passe à awaiting-category
  useEffect(() => {
    if (dialogStep === 'awaiting-category' && !isProcessingRef.current && recognitionInitialized) {
      console.log('useEffect: awaiting-category détecté, préparation du redémarrage');
      
      // S'assurer que l'écoute est activée
      if (!isListening) {
        console.log('Activation de l\'écoute');
        onListeningChange(true);
      }
      
      // Attendre un peu pour s'assurer que le message vocal est terminé
      const timeout = setTimeout(() => {
        if (dialogStep === 'awaiting-category' && !isProcessingRef.current && recognitionInitialized) {
          console.log('Redémarrage automatique pour catégorie');
          // S'assurer que l'écoute est activée
          if (!isListening) {
            onListeningChange(true);
          }
          try {
            startRecognition();
          } catch (error) {
            console.error('Erreur lors du redémarrage:', error);
          }
        }
      }, 1500);
      
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [dialogStep, recognitionInitialized]);

  const speak = (text: string, callback?: () => void) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    if (callback) {
      utterance.onend = callback;
    }
    
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      } catch (e) {
        // Ignorer les erreurs si déjà arrêté
      }
    }
    // Nettoyer les timeouts de redémarrage
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  };

  const startRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        onListeningChange(true);
      } catch (error: any) {
        if (error.message && error.message.includes('already started')) {
          console.log('Recognition already started');
        } else {
          console.error('Error starting recognition:', error);
        }
      }
    }
  };

  const initializeSpeechRecognition = () => {
    if (recognitionInitialized) return;

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Mode non-continu pour mieux contrôler
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'fr-FR';
      recognitionRef.current.maxAlternatives = 3;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        const currentTranscript = (finalTranscript || interimTranscript).trim();
        setCurrentListening(currentTranscript);
        
        if (dialogStep === 'idle') {
          onTranscriptChange(currentTranscript);
          setEditableTranscript(currentTranscript);
          setCanValidate(currentTranscript.length > 0);
          
          // PAS d'auto-validation pour la tâche - validation manuelle uniquement
        } else if (dialogStep === 'awaiting-priority') {
          // Détecter la priorité - utiliser résultats finaux en priorité, sinon interim avec délai
          const textToCheck = finalTranscript.trim() || interimTranscript.trim();
          
          if (textToCheck.length > 0 && !isProcessingRef.current) {
            const lowerText = textToCheck.toLowerCase();
            console.log('Détection priorité:', lowerText, 'final:', !!finalTranscript);
            
            // Détection avec patterns flexibles - accepter même un seul mot et "base" pour "basse"
            const cleanedText = lowerText.trim().replace(/[.,!?;:]/g, '');
            const isHaute = /\b(haute|hot|haut|urgent|urgente|importante|priorité haute|haute priorité)\b/i.test(cleanedText) || 
                           cleanedText === 'haute' || cleanedText === 'haut' || cleanedText.startsWith('haut');
            const isBasse = /\b(basse|bas|faible|low|priorité basse|basse priorité|base)\b/i.test(cleanedText) || 
                           cleanedText === 'basse' || cleanedText === 'bas' || cleanedText === 'base' ||
                           (cleanedText.startsWith('bas') && !cleanedText.startsWith('bass'));
            const isMoyenne = /\b(moyenne|moyen|normal|normale|medium|priorité moyenne|moyenne priorité)\b/i.test(cleanedText) || 
                             cleanedText === 'moyenne' || cleanedText === 'moyen' || cleanedText === 'normal' ||
                             cleanedText.startsWith('moyen');
            
            // Si résultat final, exécuter immédiatement
            if (finalTranscript && (isHaute || isBasse || isMoyenne)) {
              console.log('✅ Priorité détectée (final):', isHaute ? 'Haute' : isBasse ? 'Basse' : 'Moyenne');
              
              // Annuler tous les timeouts
              if (autoValidateTimeoutRef.current) {
                clearTimeout(autoValidateTimeoutRef.current);
                autoValidateTimeoutRef.current = null;
              }
              if (restartTimeoutRef.current) {
                clearTimeout(restartTimeoutRef.current);
                restartTimeoutRef.current = null;
              }
              
              // Arrêter immédiatement la reconnaissance
              stopRecognition();
              setCurrentListening('');
              
              // Utiliser setTimeout pour s'assurer que l'état est bien mis à jour
              setTimeout(() => {
                if (isHaute) {
                  handlePrioritySelection('Haute');
                } else if (isBasse) {
                  handlePrioritySelection('Basse');
                } else if (isMoyenne) {
                  handlePrioritySelection('Moyenne');
                }
              }, 100);
              return;
            }
            // Si résultat intermédiaire, attendre un peu pour confirmer
            else if (interimTranscript && (isHaute || isBasse || isMoyenne)) {
              // Annuler le timeout précédent
              if (autoValidateTimeoutRef.current) {
                clearTimeout(autoValidateTimeoutRef.current);
              }
              
              // Programmer une validation après 300ms si toujours valide (délai réduit)
              autoValidateTimeoutRef.current = setTimeout(() => {
                if (!isProcessingRef.current && dialogStep === 'awaiting-priority') {
                  // Re-vérifier avec le texte nettoyé
                  const recheckText = interimTranscript.toLowerCase().trim().replace(/[.,!?;:]/g, '');
                  const recheckHaute = /\b(haute|hot|haut|urgent|urgente|importante)\b/i.test(recheckText) || 
                                      recheckText === 'haute' || recheckText === 'haut' || recheckText.startsWith('haut');
                  const recheckBasse = /\b(basse|bas|faible|low|base)\b/i.test(recheckText) || 
                                     recheckText === 'basse' || recheckText === 'bas' || recheckText === 'base' ||
                                     (recheckText.startsWith('bas') && !recheckText.startsWith('bass'));
                  const recheckMoyenne = /\b(moyenne|moyen|normal|normale|medium)\b/i.test(recheckText) || 
                                        recheckText === 'moyenne' || recheckText === 'moyen' || recheckText === 'normal' ||
                                        recheckText.startsWith('moyen');
                  
                  console.log('✅ Priorité détectée (interim):', recheckHaute ? 'Haute' : recheckBasse ? 'Basse' : recheckMoyenne ? 'Moyenne' : 'Aucune');
                  stopRecognition();
                  setCurrentListening('');
                  
                  setTimeout(() => {
                    if (recheckHaute) {
                      handlePrioritySelection('Haute');
                    } else if (recheckBasse) {
                      handlePrioritySelection('Basse');
                    } else if (recheckMoyenne) {
                      handlePrioritySelection('Moyenne');
                    }
                  }, 100);
                }
              }, 300);
            }
          }
        } else if (dialogStep === 'awaiting-category') {
          // Détecter la catégorie - utiliser résultats finaux en priorité, sinon interim avec délai
          const textToCheck = finalTranscript.trim() || interimTranscript.trim();
          
          if (textToCheck.length > 0 && !isProcessingRef.current) {
            const lowerText = textToCheck.toLowerCase();
            console.log('Détection catégorie:', lowerText, 'final:', !!finalTranscript);
            
            // Détection avec patterns flexibles - accepter même un seul mot
            const isTravail = /\b(travail|work|boulot|professionnel|professionnelle|bureau)\b/i.test(lowerText) || 
                            lowerText.trim() === 'travail' || lowerText.trim() === 'boulot';
            const isEtudes = /\b(étude|études|study|école|scolaire|éducation|éducatif|université)\b/i.test(lowerText) || 
                           lowerText.trim() === 'études' || lowerText.trim() === 'étude' || lowerText.trim() === 'école';
            const isPerso = /\b(perso|personnel|personal|personnelle|privé|privée|vie privée)\b/i.test(lowerText) || 
                          lowerText.trim() === 'perso' || lowerText.trim() === 'personnel';
            
            // Si résultat final, exécuter immédiatement
            if (finalTranscript && (isTravail || isEtudes || isPerso)) {
              console.log('✅ Catégorie détectée (final):', isTravail ? 'Travail' : isEtudes ? 'Études' : 'Perso');
              
              // Annuler tous les timeouts
              if (autoValidateTimeoutRef.current) {
                clearTimeout(autoValidateTimeoutRef.current);
                autoValidateTimeoutRef.current = null;
              }
              if (restartTimeoutRef.current) {
                clearTimeout(restartTimeoutRef.current);
                restartTimeoutRef.current = null;
              }
              
              // Arrêter immédiatement la reconnaissance
              stopRecognition();
              setCurrentListening('');
              
              // Utiliser setTimeout pour s'assurer que l'état est bien mis à jour
              setTimeout(() => {
                if (isTravail) {
                  handleCategorySelection('Travail');
                } else if (isEtudes) {
                  handleCategorySelection('Études');
                } else if (isPerso) {
                  handleCategorySelection('Perso');
                }
              }, 100);
              return;
            }
            // Si résultat intermédiaire, attendre un peu pour confirmer
            else if (interimTranscript && (isTravail || isEtudes || isPerso)) {
              // Annuler le timeout précédent
              if (autoValidateTimeoutRef.current) {
                clearTimeout(autoValidateTimeoutRef.current);
              }
              
              // Programmer une validation après 300ms si toujours valide (délai réduit)
              autoValidateTimeoutRef.current = setTimeout(() => {
                if (!isProcessingRef.current && dialogStep === 'awaiting-category') {
                  console.log('✅ Catégorie détectée (interim):', isTravail ? 'Travail' : isEtudes ? 'Études' : 'Perso');
                  stopRecognition();
                  setCurrentListening('');
                  
                  setTimeout(() => {
                    if (isTravail) {
                      handleCategorySelection('Travail');
                    } else if (isEtudes) {
                      handleCategorySelection('Études');
                    } else if (isPerso) {
                      handleCategorySelection('Perso');
                    }
                  }, 100);
                }
              }, 300);
            }
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'not-allowed') {
          setPermissionDenied(true);
          onTranscriptChange('❌ Permission microphone refusée');
          onListeningChange(false);
        } else if (event.error === 'no-speech') {
          // Redémarrer automatiquement si dans un dialogue et pas en cours de traitement
          if (dialogStep !== 'idle' && dialogStep !== 'completed' && isListening && !isProcessingRef.current) {
            restartTimeoutRef.current = setTimeout(() => {
              if (!isProcessingRef.current && dialogStep !== 'completed') {
                startRecognition();
              }
            }, 1000);
          }
        } else if (event.error === 'network') {
          onTranscriptChange('Erreur réseau. Vérifiez votre connexion.');
          onListeningChange(false);
        }
      };

      recognitionRef.current.onend = () => {
        console.log('Recognition ended, dialogStep:', dialogStep, 'isProcessing:', isProcessingRef.current);
        
        // Ne redémarrer QUE si on n'est pas en train de traiter une sélection
        // et seulement si on est toujours dans le bon état
        if (isProcessingRef.current) {
          console.log('En cours de traitement, ne pas redémarrer');
          return;
        }
        
        // Redémarrer automatiquement si on est dans un dialogue et qu'on écoute toujours
        if (dialogStep !== 'idle' && dialogStep !== 'completed' && isListening && !isProcessingRef.current) {
          restartTimeoutRef.current = setTimeout(() => {
            if (!isProcessingRef.current && dialogStep !== 'completed') {
              startRecognition();
            }
          }, 500);
        } else if (dialogStep === 'idle' && isListening && !isProcessingRef.current) {
          // En mode idle, aussi redémarrer pour l'écoute continue
          restartTimeoutRef.current = setTimeout(() => {
            if (!isProcessingRef.current) {
              startRecognition();
            }
          }, 500);
        }
      };

      setRecognitionInitialized(true);
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setBrowserSupported(false);
      onTranscriptChange('⚠️ Impossible d\'initialiser la reconnaissance vocale');
    }
  };

  const handlePrioritySelection = (priority: 'Haute' | 'Moyenne' | 'Basse') => {
    if (isProcessingRef.current) {
      console.log('Déjà en cours de traitement, ignorer');
      return;
    }
    
    console.log('Sélection priorité:', priority);
    isProcessingRef.current = true;
    
    // Nettoyer tous les timeouts
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (autoValidateTimeoutRef.current) {
      clearTimeout(autoValidateTimeoutRef.current);
      autoValidateTimeoutRef.current = null;
    }
    
    setTaskPriority(priority);
    setDialogStep('awaiting-category');
    setCurrentListening('');
    
    // Arrêter complètement la reconnaissance
    stopRecognition();
    
    // Parler avec confirmation - le useEffect redémarrera automatiquement l'écoute
    speak(`La priorité est ${priority.toLowerCase()}. Quelle est la catégorie ? Dites Perso, Travail ou Études`, () => {
      setTimeout(() => {
        isProcessingRef.current = false;
        // Le useEffect surveillant dialogStep redémarrera automatiquement l'écoute
      }, 500);
    });
  };

  const handleCategorySelection = (category: 'Perso' | 'Travail' | 'Études') => {
    if (isProcessingRef.current) {
      console.log('Déjà en cours de traitement, ignorer');
      return;
    }
    
    console.log('Sélection catégorie:', category);
    isProcessingRef.current = true;
    
    // Nettoyer tous les timeouts
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (autoValidateTimeoutRef.current) {
      clearTimeout(autoValidateTimeoutRef.current);
      autoValidateTimeoutRef.current = null;
    }
    
    setTaskCategory(category);
    stopRecognition();
    onListeningChange(false);
    finalizeTask(category);
  };

  const finalizeTask = (category: 'Perso' | 'Travail' | 'Études') => {
    setDialogStep('completed');
    
    const fullCommand = {
      title: taskTitle,
      category: category,
      priority: taskPriority,
    };
    
    // Confirmer la catégorie puis annoncer la création de la tâche
    speak(`La catégorie est ${category.toLowerCase()}. Tâche ajoutée : ${taskTitle}, catégorie ${category}, priorité ${taskPriority}`, () => {
      onVoiceCommand(`TASK:${JSON.stringify(fullCommand)}`);
    });
    
    setTimeout(() => {
      isProcessingRef.current = false;
      setDialogStep('idle');
      setEditableTranscript('');
      setTaskTitle('');
      setCurrentListening('');
      onTranscriptChange('');
      setCanValidate(false);
    }, 3000);
  };

  const toggleListening = () => {
    if (!browserSupported) {
      onTranscriptChange('⚠️ Votre navigateur ne supporte pas la reconnaissance vocale');
      return;
    }

    // Initialize on first click
    if (!recognitionInitialized) {
      initializeSpeechRecognition();
    }

    if (isListening) {
      // Arrêter l'écoute
      isProcessingRef.current = false;
      stopRecognition();
      onListeningChange(false);
      window.speechSynthesis.cancel();
      setCurrentListening('');
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (autoValidateTimeoutRef.current) {
        clearTimeout(autoValidateTimeoutRef.current);
      }
    } else {
      // Démarrer l'écoute
      if (permissionDenied) {
        setPermissionDenied(false);
      }
      
      startRecognition();
      onTranscriptChange('🎤 Parlez maintenant...');
      setEditableTranscript('');
      setCanValidate(false);
    }
  };

  const handleValidate = () => {
    if (!editableTranscript.trim()) return;
    
    // Arrêter l'écoute temporairement
    stopRecognition();
    
    setTaskTitle(editableTranscript.trim());
    setDialogStep('awaiting-priority');
    setCurrentListening('');
    
    // Demander la priorité vocalement puis redémarrer l'écoute
    speak('Quelle priorité ? Dites Haute, Moyenne ou Basse', () => {
      setTimeout(() => {
        startRecognition();
      }, 500);
    });
  };

  const handleCancel = () => {
    isProcessingRef.current = false;
    setEditableTranscript('');
    setCanValidate(false);
    onTranscriptChange('');
    setDialogStep('idle');
    setCurrentListening('');
    window.speechSynthesis.cancel();
  };

  const autoValidateTask = (transcript: string) => {
    if (dialogStep === 'idle') {
      setTaskTitle(transcript);
      setDialogStep('awaiting-priority');
      setCurrentListening('');
      
      // Demander la priorité vocalement puis redémarrer l'écoute
      speak('Quelle priorité ? Dites Haute, Moyenne ou Basse', () => {
        setTimeout(() => {
          startRecognition();
        }, 500);
      });
    }
  };

  return (
    <div className="sticky top-24 space-y-4">
      {/* Main Voice Control Card */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50/50 rounded-2xl shadow-lg border border-indigo-100/60 overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-indigo-100/60 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-slate-800">Contrôle vocal</h3>
              <p className="text-xs text-slate-500">
                {dialogStep === 'idle' ? 'Reconnaissance vocale continue' :
                 dialogStep === 'awaiting-priority' ? 'Attente priorité...' :
                 dialogStep === 'awaiting-category' ? 'Attente catégorie...' :
                 'Enregistrement...'}
              </p>
            </div>
          </div>
        </div>

        {/* Voice button */}
        <div className="px-6 py-10 text-center">
          <button
            onClick={toggleListening}
            disabled={!browserSupported}
            className={`relative w-28 h-28 mx-auto rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              isListening
                ? 'bg-gradient-to-br from-red-600 via-pink-600 to-rose-600 shadow-2xl shadow-red-500/50 scale-110'
                : 'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 shadow-xl hover:shadow-2xl hover:scale-105'
            }`}
          >
            {isListening ? (
              <Mic className="w-12 h-12 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            ) : (
              <MicOff className="w-12 h-12 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            )}
            
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-40"></span>
                <span className="absolute -inset-2 rounded-full bg-red-400 animate-pulse opacity-20"></span>
              </>
            )}
          </button>

          {/* Status indicator */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              isListening ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' : 'bg-slate-400'
            }`}></div>
            <span className="text-sm text-slate-600">
              {isListening ? '🎤 En écoute...' : 'Cliquez pour démarrer'}
            </span>
          </div>
          
          {/* Real-time listening feedback */}
          {isListening && currentListening && dialogStep !== 'idle' && (
            <button
              onClick={() => {
                if (dialogStep === 'awaiting-priority') {
                  const lowerText = currentListening.toLowerCase().trim().replace(/[.,!?;:]/g, '');
                  console.log('Clic sur J\'entends (priorité) - texte nettoyé:', lowerText);
                  
                  // Détection plus flexible pour priorité
                  const isHaute = /\b(haute|hot|haut|urgent|urgente|importante|priorité haute|haute priorité)\b/i.test(lowerText) || 
                                 lowerText === 'haute' || lowerText === 'haut' || lowerText.startsWith('haut');
                  const isBasse = /\b(basse|bas|faible|low|priorité basse|basse priorité|base)\b/i.test(lowerText) || 
                                 lowerText === 'basse' || lowerText === 'bas' || lowerText === 'base' || 
                                 lowerText.startsWith('bas') && !lowerText.startsWith('bass');
                  const isMoyenne = /\b(moyenne|moyen|normal|normale|medium|priorité moyenne|moyenne priorité)\b/i.test(lowerText) || 
                                   lowerText === 'moyenne' || lowerText === 'moyen' || lowerText === 'normal' ||
                                   lowerText.startsWith('moyen');
                  
                  console.log('Détection priorité (clic):', { isHaute, isBasse, isMoyenne, lowerText });
                  
                  if (isHaute) {
                    console.log('✅ Validation Haute');
                    stopRecognition();
                    setCurrentListening('');
                    handlePrioritySelection('Haute');
                  } else if (isBasse) {
                    console.log('✅ Validation Basse');
                    stopRecognition();
                    setCurrentListening('');
                    handlePrioritySelection('Basse');
                  } else if (isMoyenne) {
                    console.log('✅ Validation Moyenne');
                    stopRecognition();
                    setCurrentListening('');
                    handlePrioritySelection('Moyenne');
                  } else {
                    console.log('❌ Aucune priorité détectée pour:', lowerText);
                    // Validation manuelle de secours
                    if (lowerText.includes('haut') || lowerText.includes('urgent')) {
                      console.log('Validation manuelle pour Haute');
                      stopRecognition();
                      setCurrentListening('');
                      handlePrioritySelection('Haute');
                    } else if (lowerText.includes('bas') || lowerText.includes('base') || lowerText.includes('faible')) {
                      console.log('Validation manuelle pour Basse');
                      stopRecognition();
                      setCurrentListening('');
                      handlePrioritySelection('Basse');
                    } else if (lowerText.includes('moyen') || lowerText.includes('normal')) {
                      console.log('Validation manuelle pour Moyenne');
                      stopRecognition();
                      setCurrentListening('');
                      handlePrioritySelection('Moyenne');
                    }
                  }
                } else if (dialogStep === 'awaiting-category') {
                  const lowerText = currentListening.toLowerCase().trim().replace(/[.,!?;:]/g, '');
                  console.log('Clic sur J\'entends - texte nettoyé:', lowerText);
                  
                  // Détection plus flexible
                  const isTravail = /\b(travail|work|boulot|professionnel|professionnelle|bureau)\b/i.test(lowerText) || 
                                  lowerText === 'travail' || lowerText === 'boulot';
                  const isEtudes = /\b(étude|études|study|école|scolaire|éducation|éducatif|université)\b/i.test(lowerText) || 
                                 lowerText === 'études' || lowerText === 'étude' || lowerText === 'école' || lowerText.startsWith('étud');
                  const isPerso = /\b(perso|personnel|personal|personnelle|privé|privée|vie privée)\b/i.test(lowerText) || 
                                lowerText === 'perso' || lowerText === 'personnel' || lowerText.startsWith('perso');
                  
                  console.log('Détection catégorie:', { isTravail, isEtudes, isPerso, lowerText });
                  
                  if (isTravail) {
                    console.log('✅ Validation Travail');
                    stopRecognition();
                    setCurrentListening('');
                    handleCategorySelection('Travail');
                  } else if (isEtudes) {
                    console.log('✅ Validation Études');
                    stopRecognition();
                    setCurrentListening('');
                    handleCategorySelection('Études');
                  } else if (isPerso) {
                    console.log('✅ Validation Perso');
                    stopRecognition();
                    setCurrentListening('');
                    handleCategorySelection('Perso');
                  } else {
                    console.log('❌ Aucune catégorie détectée pour:', lowerText);
                    // Même si non détecté, permettre la validation manuelle
                    if (lowerText.includes('étud') || lowerText.includes('école')) {
                      console.log('Validation manuelle pour Études');
                      stopRecognition();
                      setCurrentListening('');
                      handleCategorySelection('Études');
                    } else if (lowerText.includes('travail') || lowerText.includes('boulot')) {
                      console.log('Validation manuelle pour Travail');
                      stopRecognition();
                      setCurrentListening('');
                      handleCategorySelection('Travail');
                    } else if (lowerText.includes('perso') || lowerText.includes('personnel')) {
                      console.log('Validation manuelle pour Perso');
                      stopRecognition();
                      setCurrentListening('');
                      handleCategorySelection('Perso');
                    }
                  }
                }
              }}
              className="mt-3 w-full px-4 py-2 bg-white/70 rounded-lg border-2 border-indigo-200 hover:border-indigo-400 hover:bg-white cursor-pointer transition-all text-left"
            >
              <p className="text-xs text-slate-500 mb-1">J'entends :</p>
              <p className="text-sm text-indigo-700 font-medium">"{currentListening}"</p>
              <p className="text-xs text-indigo-500 mt-1">👆 Cliquez pour valider</p>
            </button>
          )}
          
          {isListening && dialogStep === 'idle' && (
            <p className="text-xs text-slate-500 mt-2">Cliquez à nouveau pour arrêter</p>
          )}
        </div>

        {/* Transcript Editing Area */}
        {dialogStep === 'idle' && (
          <div className="px-6 py-4 bg-white/70 backdrop-blur-sm border-t border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <Edit3 className="w-4 h-4 text-indigo-600" />
              <p className="text-xs text-slate-700">Transcription modifiable</p>
            </div>
            <textarea
              value={editableTranscript}
              onChange={(e) => {
                setEditableTranscript(e.target.value);
                setCanValidate(e.target.value.trim().length > 0);
              }}
              placeholder="Dites votre tâche ou tapez ici..."
              className="w-full min-h-[100px] px-4 py-3 bg-white rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:outline-none text-sm resize-none"
            />
            
            {canValidate && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
                <button
                  onClick={handleValidate}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  Valider
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dialog Status with Manual Buttons */}
        {dialogStep === 'awaiting-priority' && (
          <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-purple-100">
            <div className="text-center">
              <p className="text-sm text-purple-900 mb-2">🎯 Quelle priorité ?</p>
              <p className="text-xs text-purple-700">Dites : Haute, Moyenne ou Basse</p>
              {currentListening && (
                <button
                  onClick={() => {
                    const lowerText = currentListening.toLowerCase().trim().replace(/[.,!?;:]/g, '');
                    console.log('Clic sur J\'entends (section priorité) - texte nettoyé:', lowerText);
                    
                    // Détection plus flexible pour priorité
                    const isHaute = /\b(haute|hot|haut|urgent|urgente|importante|priorité haute|haute priorité)\b/i.test(lowerText) || 
                                   lowerText === 'haute' || lowerText === 'haut' || lowerText.startsWith('haut');
                    const isBasse = /\b(basse|bas|faible|low|priorité basse|basse priorité|base)\b/i.test(lowerText) || 
                                   lowerText === 'basse' || lowerText === 'bas' || lowerText === 'base' || 
                                   lowerText.startsWith('bas') && !lowerText.startsWith('bass');
                    const isMoyenne = /\b(moyenne|moyen|normal|normale|medium|priorité moyenne|moyenne priorité)\b/i.test(lowerText) || 
                                     lowerText === 'moyenne' || lowerText === 'moyen' || lowerText === 'normal' ||
                                     lowerText.startsWith('moyen');
                    
                    console.log('Détection priorité (section):', { isHaute, isBasse, isMoyenne, lowerText });
                    
                    if (isHaute) {
                      console.log('✅ Validation Haute');
                      stopRecognition();
                      setCurrentListening('');
                      handlePrioritySelection('Haute');
                    } else if (isBasse) {
                      console.log('✅ Validation Basse');
                      stopRecognition();
                      setCurrentListening('');
                      handlePrioritySelection('Basse');
                    } else if (isMoyenne) {
                      console.log('✅ Validation Moyenne');
                      stopRecognition();
                      setCurrentListening('');
                      handlePrioritySelection('Moyenne');
                    } else {
                      console.log('❌ Aucune priorité détectée pour:', lowerText);
                      // Validation manuelle de secours
                      if (lowerText.includes('haut') || lowerText.includes('urgent')) {
                        console.log('Validation manuelle pour Haute');
                        stopRecognition();
                        setCurrentListening('');
                        handlePrioritySelection('Haute');
                      } else if (lowerText.includes('bas') || lowerText.includes('base') || lowerText.includes('faible')) {
                        console.log('Validation manuelle pour Basse');
                        stopRecognition();
                        setCurrentListening('');
                        handlePrioritySelection('Basse');
                      } else if (lowerText.includes('moyen') || lowerText.includes('normal')) {
                        console.log('Validation manuelle pour Moyenne');
                        stopRecognition();
                        setCurrentListening('');
                        handlePrioritySelection('Moyenne');
                      }
                    }
                  }}
                  className="mt-3 w-full px-4 py-2 bg-white/70 rounded-lg border-2 border-purple-200 hover:border-purple-400 hover:bg-white cursor-pointer transition-all"
                >
                  <p className="text-xs text-slate-500 mb-1">J'entends :</p>
                  <p className="text-sm text-purple-700 font-medium">"{currentListening}"</p>
                  <p className="text-xs text-purple-500 mt-1">👆 Cliquez pour valider</p>
                </button>
              )}
            </div>
          </div>
        )}

        {dialogStep === 'awaiting-category' && (
          <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-purple-100">
            <div className="text-center">
              <p className="text-sm text-purple-900 mb-2">📁 Quelle catégorie ?</p>
              <p className="text-xs text-purple-700">Dites : Perso, Travail ou Études</p>
              {currentListening && (
                <button
                  onClick={() => {
                    const lowerText = currentListening.toLowerCase().trim().replace(/[.,!?;:]/g, '');
                    console.log('Clic sur J\'entends (section catégorie) - texte nettoyé:', lowerText);
                    
                    // Détection plus flexible
                    const isTravail = /\b(travail|work|boulot|professionnel|professionnelle|bureau)\b/i.test(lowerText) || 
                                    lowerText === 'travail' || lowerText === 'boulot';
                    const isEtudes = /\b(étude|études|study|école|scolaire|éducation|éducatif|université)\b/i.test(lowerText) || 
                                   lowerText === 'études' || lowerText === 'étude' || lowerText === 'école' || lowerText.startsWith('étud');
                    const isPerso = /\b(perso|personnel|personal|personnelle|privé|privée|vie privée)\b/i.test(lowerText) || 
                                  lowerText === 'perso' || lowerText === 'personnel' || lowerText.startsWith('perso');
                    
                    console.log('Détection catégorie (section):', { isTravail, isEtudes, isPerso, lowerText });
                    
                    if (isTravail) {
                      console.log('✅ Validation Travail');
                      stopRecognition();
                      setCurrentListening('');
                      handleCategorySelection('Travail');
                    } else if (isEtudes) {
                      console.log('✅ Validation Études');
                      stopRecognition();
                      setCurrentListening('');
                      handleCategorySelection('Études');
                    } else if (isPerso) {
                      console.log('✅ Validation Perso');
                      stopRecognition();
                      setCurrentListening('');
                      handleCategorySelection('Perso');
                    } else {
                      console.log('❌ Aucune catégorie détectée pour:', lowerText);
                      // Même si non détecté, permettre la validation manuelle
                      if (lowerText.includes('étud') || lowerText.includes('école')) {
                        console.log('Validation manuelle pour Études');
                        stopRecognition();
                        setCurrentListening('');
                        handleCategorySelection('Études');
                      } else if (lowerText.includes('travail') || lowerText.includes('boulot')) {
                        console.log('Validation manuelle pour Travail');
                        stopRecognition();
                        setCurrentListening('');
                        handleCategorySelection('Travail');
                      } else if (lowerText.includes('perso') || lowerText.includes('personnel')) {
                        console.log('Validation manuelle pour Perso');
                        stopRecognition();
                        setCurrentListening('');
                        handleCategorySelection('Perso');
                      }
                    }
                  }}
                  className="mt-3 w-full px-4 py-2 bg-white/70 rounded-lg border-2 border-purple-200 hover:border-purple-400 hover:bg-white cursor-pointer transition-all"
                >
                  <p className="text-xs text-slate-500 mb-1">J'entends :</p>
                  <p className="text-sm text-purple-700 font-medium">"{currentListening}"</p>
                  <p className="text-xs text-purple-500 mt-1">👆 Cliquez pour valider</p>
                </button>
              )}
            </div>
          </div>
        )}

        {dialogStep === 'completed' && (
          <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100">
            <div className="text-center">
              <p className="text-sm text-green-900 mb-2">✅ Tâche enregistrée !</p>
              <p className="text-xs text-green-700">{taskTitle}</p>
              <p className="text-xs text-green-600 mt-1">{taskCategory} • Priorité {taskPriority}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="px-6 py-5 bg-gradient-to-br from-slate-50/80 to-transparent">
          <div className="text-xs text-slate-600 space-y-2">
            <p className="font-medium text-slate-700">📝 Comment utiliser :</p>
            <p>1️⃣ Cliquez sur le micro et dites votre tâche</p>
            <p>2️⃣ Modifiez si besoin, puis cliquez "Valider"</p>
            <p>3️⃣ Dites la priorité (Haute/Moyenne/Basse) - validation automatique ou cliquez sur "J'entends"</p>
            <p>4️⃣ Dites la catégorie (Perso/Travail/Études) - validation automatique ou cliquez sur "J'entends"</p>
            <p>5️⃣ La tâche est enregistrée automatiquement !</p>
          </div>
        </div>

        {/* Error states */}
        {!browserSupported && (
          <div className="px-6 py-4 bg-red-50 border-t border-red-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 mb-1">Navigateur non supporté</p>
                <p className="text-xs text-red-700">
                  La reconnaissance vocale nécessite Chrome, Edge ou Safari (dernière version).
                </p>
              </div>
            </div>
          </div>
        )}

        {permissionDenied && browserSupported && (
          <div className="px-6 py-4 bg-amber-50 border-t border-amber-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-900 mb-2">🎤 Autorisation microphone requise</p>
                <div className="text-xs text-amber-800 space-y-1.5 mb-3 bg-white/50 rounded-lg p-3">
                  <p className="font-medium">Pour autoriser l'accès au microphone :</p>
                  <p>1️⃣ Regardez dans la barre d'adresse (en haut)</p>
                  <p>2️⃣ Cliquez sur l'icône 🔒 ou ⓘ à gauche de l'URL</p>
                  <p>3️⃣ Trouvez "Microphone" dans les permissions</p>
                  <p>4️⃣ Changez de "Bloquer" à "Autoriser"</p>
                  <p>5️⃣ Rechargez la page (F5)</p>
                </div>
                <button
                  onClick={() => {
                    setPermissionDenied(false);
                    onTranscriptChange('Cliquez sur le bouton micro pour réessayer');
                  }}
                  className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs transition-colors"
                >
                  ✅ J'ai autorisé le microphone
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}