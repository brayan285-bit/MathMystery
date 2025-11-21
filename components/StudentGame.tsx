import React, { useState, useEffect, useCallback } from 'react';
import { GameState, MathTopic, Question } from '../types';
import { generateMathQuestion } from '../services/geminiService';
import { MockFirebase } from '../services/mockFirebase';
import { Button } from './Button';
import { Heart, Trophy, Clock, AlertCircle, ArrowRight, CheckCircle, RotateCcw } from 'lucide-react';
import { User } from '../types';

interface StudentGameProps {
  user: User;
  onLogout: () => void;
}

export const StudentGame: React.FC<StudentGameProps> = ({ user, onLogout }) => {
  const [gameState, setGameState] = useState<GameState>({
    lives: 5,
    score: 0,
    currentLevel: 1,
    correctStreak: 0,
    topic: null,
    isPlaying: false
  });

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'timeout' | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<MathTopic | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const fetchQuestion = useCallback(async (topic: MathTopic, difficulty: number) => {
    setLoading(true);
    try {
      const q = await generateMathQuestion(topic, difficulty);
      setQuestion(q);
      setTimeLeft(30);
      setFeedback(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Timer Effect
  useEffect(() => {
    if (!gameState.isPlaying || loading || feedback || gameOver || !question) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAnswer(null); // Timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.isPlaying, loading, feedback, gameOver, question]);

  const handleStartGame = (topic: MathTopic) => {
    setSelectedTopic(topic);
    setGameState({
      lives: 5,
      score: 0,
      currentLevel: 1,
      correctStreak: 0,
      topic: topic,
      isPlaying: true
    });
    setGameOver(false);
    fetchQuestion(topic, 1);
  };

  const handleAnswer = (answer: string | null) => {
    if (!question) return;

    const isCorrect = answer === question.correctAnswer;

    if (isCorrect) {
      setFeedback('correct');
      setGameState(prev => {
        const newStreak = prev.correctStreak + 1;
        const newScore = prev.score + (prev.currentLevel * 10); // Points multiplier
        let newLevel = prev.currentLevel;
        let newLives = prev.lives;

        // Every 5 correct, increase difficulty
        if (newStreak % 5 === 0) {
            newLevel = Math.min(prev.currentLevel + 1, 5);
            newLives = Math.min(prev.lives + 1, 5); // Max 5 lives, bonus life
        }

        return {
          ...prev,
          score: newScore,
          correctStreak: newStreak,
          currentLevel: newLevel,
          lives: newLives
        };
      });
    } else {
      setFeedback(answer === null ? 'timeout' : 'incorrect');
      setGameState(prev => {
        const newLives = prev.lives - 1;
        if (newLives <= 0) {
          setGameOver(true);
          MockFirebase.saveGameProgress(user.id, prev.score, prev.currentLevel, 0);
        }
        return {
          ...prev,
          lives: newLives,
          correctStreak: 0 // Reset streak
        };
      });
    }
  };

  const handleNextQuestion = () => {
    if (gameOver) return;
    if (gameState.topic) {
        fetchQuestion(gameState.topic, gameState.currentLevel);
    }
  };

  // --- WORLD SELECTION SCREEN ---
  if (!gameState.isPlaying) {
    return (
      <div className="h-full w-full flex flex-col overflow-hidden">
        <div className="flex-shrink-0 p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 backdrop-blur-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-display text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Hola, {user.name}
            </h1>
            <p className="text-gray-400 text-sm">Selecciona un mundo para restaurar el equilibrio.</p>
          </div>
          <Button variant="secondary" onClick={onLogout} className="text-sm px-4 py-2">Cerrar Sesión</Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.values(MathTopic).map((topic) => (
                <div key={topic} className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6 hover:border-mystery-accent transition-all cursor-pointer group" onClick={() => handleStartGame(topic)}>
                  <div className="h-32 mb-4 rounded-lg bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="text-4xl">🪐</span>
                  </div>
                  <h3 className="text-xl font-bold font-display mb-2 group-hover:text-mystery-accent">{topic}</h3>
                  <p className="text-sm text-gray-400">Explora los misterios de {topic.toLowerCase()}.</p>
                </div>
              ))}
            </div>
            
            <div className="mt-8 bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                <h2 className="text-xl font-display mb-4">Tu Progreso Global</h2>
                <div className="flex gap-8">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-400">{user.score || 0}</p>
                        <p className="text-xs text-gray-500 uppercase">Puntos Totales</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">{user.level || 1}</p>
                        <p className="text-xs text-gray-500 uppercase">Nivel Alcanzado</p>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- GAMEPLAY SCREEN ---
  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* HUD - Fixed Top */}
      <div className="flex-shrink-0 bg-slate-800/95 border-b border-slate-700 p-4 flex justify-between items-center shadow-xl z-30">
        <div className="flex items-center gap-2">
           <div className="flex text-red-500">
             {[...Array(5)].map((_, i) => (
               <Heart key={i} size={20} fill={i < gameState.lives ? "currentColor" : "none"} className={`md:w-6 md:h-6 ${i < gameState.lives ? "text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" : "text-gray-600"}`} />
             ))}
           </div>
        </div>
        <div className="flex flex-col items-center mx-2">
             <div className={`text-2xl md:text-3xl font-display font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {timeLeft}s
             </div>
             <div className="w-24 md:w-32 h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                <div 
                  className={`h-full ${timeLeft <= 10 ? 'bg-red-500' : 'bg-blue-500'} transition-all duration-1000 linear`} 
                  style={{ width: `${(timeLeft / 30) * 100}%` }}
                />
             </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
            <div className="text-right">
                <p className="text-[10px] md:text-xs text-gray-400">PUNTOS</p>
                <p className="text-lg md:text-xl font-bold text-mystery-gold">{gameState.score}</p>
            </div>
            <div className="text-right hidden xs:block">
                <p className="text-[10px] md:text-xs text-gray-400">NIVEL</p>
                <p className="text-lg md:text-xl font-bold text-purple-400">{gameState.currentLevel}</p>
            </div>
        </div>
      </div>

      {/* Game Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center">
        <div className="w-full max-w-3xl relative">
          
          {/* Game Over Overlay */}
          {gameOver && (
              <div className="absolute inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center p-4 text-center rounded-3xl border-2 border-red-900/50">
                  <AlertCircle size={48} className="text-red-500 mb-4 mx-auto" />
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">¡Juego Terminado!</h2>
                  <p className="text-gray-400 mb-6">Te has quedado sin vidas.</p>
                  <div className="bg-slate-900 p-4 rounded-xl mb-6 w-full max-w-xs border border-slate-700">
                      <p className="text-sm text-gray-400 uppercase tracking-wider">Puntuación Final</p>
                      <p className="text-3xl font-bold text-mystery-gold my-2">{gameState.score}</p>
                  </div>
                  <div className="flex gap-4 justify-center w-full">
                      <Button variant="secondary" onClick={() => setGameState({...gameState, isPlaying: false})}>Salir</Button>
                      <Button onClick={() => handleStartGame(gameState.topic!)}>Reintentar</Button>
                  </div>
              </div>
          )}

          <div className="bg-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-700 min-h-[300px] flex flex-col">
              {loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12">
                      <div className="w-12 h-12 border-4 border-mystery-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-mystery-accent font-display animate-pulse text-center">Descifrando código antiguo...</p>
                  </div>
              ) : question ? (
                  <>
                      <div className="mb-6">
                          <div className="flex justify-between items-start mb-4">
                              <span className="bg-indigo-900 text-indigo-200 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                                  {question.topic} • Dif {question.difficulty}
                              </span>
                          </div>
                          <h2 className="text-lg md:text-2xl font-medium text-white leading-relaxed">
                              {question.text}
                          </h2>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:gap-4 mb-6">
                          {question.options.map((opt, idx) => (
                              <button
                                  key={idx}
                                  disabled={feedback !== null}
                                  onClick={() => handleAnswer(opt)}
                                  className={`p-4 rounded-xl text-left text-base transition-all border-2 ${
                                      feedback 
                                          ? opt === question.correctAnswer
                                              ? 'bg-green-900/30 border-green-500 text-green-200'
                                              : 'bg-slate-700/30 border-transparent opacity-50'
                                          : 'bg-slate-700 hover:bg-slate-600 border-transparent hover:border-mystery-accent'
                                  }`}
                              >
                                  <span className="mr-3 font-mono text-gray-400 opacity-50">
                                      {String.fromCharCode(65 + idx)}.
                                  </span>
                                  {opt}
                              </button>
                          ))}
                      </div>

                      {/* Feedback Section */}
                      {feedback && (
                          <div className={`rounded-xl p-4 mb-2 border ${
                              feedback === 'correct' ? 'bg-green-900/20 border-green-600' : 'bg-red-900/20 border-red-600'
                          } animate-fade-in`}>
                              <div className="flex items-start gap-4">
                                  {feedback === 'correct' ? <CheckCircle className="text-green-500 shrink-0" /> : <AlertCircle className="text-red-500 shrink-0" />}
                                  <div>
                                      <h3 className={`font-bold text-lg ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                                          {feedback === 'correct' ? '¡Correcto!' : feedback === 'timeout' ? '¡Tiempo agotado!' : 'Incorrecto'}
                                      </h3>
                                      <p className="text-gray-300 mt-2 text-sm leading-relaxed">{question.explanation}</p>
                                  </div>
                              </div>
                              <div className="mt-4 flex justify-end">
                                  <Button onClick={handleNextQuestion} className="flex items-center justify-center py-2 text-sm">
                                      Siguiente Desafío <ArrowRight size={16} className="ml-2" />
                                  </Button>
                              </div>
                          </div>
                      )}
                  </>
              ) : (
                  <div className="text-center text-red-400 py-12">Error al cargar la pregunta.</div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};