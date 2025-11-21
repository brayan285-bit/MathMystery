import React, { useState, useEffect, useCallback } from 'react';
import { GameState, MathTopic, Question, SearchResult } from '../types';
import { generateMathQuestion, searchMathConcept, getFastHint, askMathSage } from '../services/geminiService';
import { MockFirebase } from '../services/mockFirebase';
import { Button } from './Button';
import { Heart, AlertCircle, ArrowRight, CheckCircle, Search, Lightbulb, X, Brain } from 'lucide-react';
import { User } from '../types';

interface StudentGameProps {
  user: User;
  onLogout: () => void;
}

// Mapping of topics to vivid futuristic minimalist images
const TOPIC_IMAGES: Record<MathTopic, string> = {
  [MathTopic.ALGEBRA]: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=600&q=80", // Neon Lights
  [MathTopic.GEOMETRY]: "https://images.unsplash.com/photo-1517263904808-5dc91e3e7044?auto=format&fit=crop&w=600&q=80", // Geometric Neon
  [MathTopic.CALCULUS]: "https://images.unsplash.com/photo-1605218427306-afa54388cf27?auto=format&fit=crop&w=600&q=80", // Abstract Wave
  [MathTopic.STATISTICS]: "https://images.unsplash.com/photo-1558494949-ef612705c7c3?auto=format&fit=crop&w=600&q=80", // Digital Futuristic
  [MathTopic.TRIGONOMETRY]: "https://images.unsplash.com/photo-1550684847-75bdda21cc95?auto=format&fit=crop&w=600&q=80" // Abstract Lines
};

export const StudentGame: React.FC<StudentGameProps> = ({ user, onLogout }) => {
  const [gameState, setGameState] = useState<GameState>({
    lives: user.lives || 5,
    score: user.score || 0,
    currentLevel: user.level || 1,
    correctStreak: 0,
    topic: null,
    isPlaying: false
  });

  // Game Logic State
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'timeout' | null>(null);
  const [gameOver, setGameOver] = useState(false);

  // Feature State: Oracle (Search & Thinking)
  const [showOracle, setShowOracle] = useState(false);
  const [oracleQuery, setOracleQuery] = useState('');
  const [oracleResult, setOracleResult] = useState<SearchResult | null>(null);
  const [oracleLoading, setOracleLoading] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);

  // Feature State: Fast Hint
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);

  const fetchQuestion = useCallback(async (topic: MathTopic, difficulty: number) => {
    setLoading(true);
    setHint(null); // Reset hint
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
    const currentUserData = MockFirebase.getCurrentUser();
    
    const currentScore = currentUserData?.score ?? user.score ?? 0;
    const currentLives = currentUserData?.lives ?? user.lives ?? 5;
    const currentLevel = currentUserData?.level ?? user.level ?? 1;

    setGameState(prev => ({
      ...prev,
      lives: currentLives,
      score: currentScore,
      currentLevel: currentLevel,
      topic: topic,
      isPlaying: true
    }));
    setGameOver(false);
    fetchQuestion(topic, currentLevel);
  };

  const handleRetry = () => {
      // Explicitly reset lives to 5 in the database
      // We keep the current score and level, but restore lives
      MockFirebase.saveGameProgress(user.id, gameState.score, gameState.currentLevel, 5);
      
      // Restart the game (handleStartGame will fetch the updated 5 lives from DB)
      handleStartGame(gameState.topic!);
  };

  const handleAnswer = (answer: string | null) => {
    if (!question) return;

    const isCorrect = answer === question.correctAnswer;

    if (isCorrect) {
      setFeedback('correct');
      
      const newStreak = gameState.correctStreak + 1;
      const newScore = gameState.score + (gameState.currentLevel * 10);
      let newLevel = gameState.currentLevel;
      let newLives = gameState.lives;

      if (newStreak % 5 === 0) {
          newLevel = Math.min(gameState.currentLevel + 1, 5);
          newLives = Math.min(gameState.lives + 1, 5);
      }

      MockFirebase.saveGameProgress(user.id, newScore, newLevel, newLives);

      setGameState(prev => ({
        ...prev,
        score: newScore,
        correctStreak: newStreak,
        currentLevel: newLevel,
        lives: newLives
      }));

    } else {
      setFeedback(answer === null ? 'timeout' : 'incorrect');
      
      const newLives = gameState.lives - 1;
      
      if (newLives <= 0) {
        setGameOver(true);
        // Save 0 lives to persist game over state until reset
        MockFirebase.saveGameProgress(user.id, gameState.score, gameState.currentLevel, 0);
      } else {
        MockFirebase.saveGameProgress(user.id, gameState.score, gameState.currentLevel, newLives);
      }
      
      setGameState(prev => ({
        ...prev,
        lives: newLives,
        correctStreak: 0
      }));
    }
  };

  const handleNextQuestion = () => {
    if (gameOver) return;
    if (gameState.topic) {
        fetchQuestion(gameState.topic, gameState.currentLevel);
    }
  };

  // --- AI Handlers ---
  const handleOracleSearch = async () => {
    if (!oracleQuery.trim()) return;
    setOracleLoading(true);
    setOracleResult(null);
    
    let result;
    if (isThinkingMode) {
      result = await askMathSage(oracleQuery);
    } else {
      result = await searchMathConcept(oracleQuery);
    }

    setOracleResult(result);
    setOracleLoading(false);
  };

  const handleGetHint = async () => {
    if (!question) return;
    setHintLoading(true);
    const hintText = await getFastHint(question.text);
    setHint(hintText);
    setHintLoading(false);
  };

  // --- MODALS ---
  const renderOracleModal = () => (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-slide-up">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-purple-900/20">
          <h3 className="text-xl font-display text-purple-300 flex items-center gap-2">
            <Search size={20} /> Oráculo Matemático
          </h3>
          <button onClick={() => setShowOracle(false)}><X className="text-gray-400 hover:text-white" /></button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-end">
               <button 
                  onClick={() => setIsThinkingMode(!isThinkingMode)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isThinkingMode ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_10px_rgba(147,51,234,0.5)]' : 'bg-slate-800 border-slate-600 text-gray-400 hover:border-purple-500'}`}
               >
                  <Brain size={14} /> 
                  {isThinkingMode ? 'Pensamiento Profundo ACTIVO' : 'Activar Pensamiento Profundo'}
               </button>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none placeholder-gray-500"
                placeholder={isThinkingMode ? "Plantea un problema complejo para razonar..." : "Pregunta sobre historia, conceptos o curiosidades..."}
                value={oracleQuery}
                onChange={e => setOracleQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleOracleSearch()}
              />
              <Button onClick={handleOracleSearch} isLoading={oracleLoading}>
                {isThinkingMode ? 'Razonar' : 'Consultar'}
              </Button>
            </div>
          </div>
          
          {oracleResult && (
            <div className="space-y-4 animate-fade-in">
              <div className={`p-4 rounded-xl border ${isThinkingMode ? 'bg-purple-900/20 border-purple-500/50' : 'bg-slate-800 border-slate-700'}`}>
                {isThinkingMode && <div className="text-xs text-purple-300 uppercase font-bold mb-2 flex items-center gap-1"><Brain size={12}/> Análisis Profundo</div>}
                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{oracleResult.text}</p>
              </div>
              {!isThinkingMode && oracleResult.sources.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">Fuentes del Conocimiento</p>
                  <div className="flex flex-wrap gap-2">
                    {oracleResult.sources.map((s, i) => (
                      <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-3 py-1 rounded-full border border-slate-600 transition-colors truncate max-w-[200px]">
                        {s.title || 'Fuente Externa'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // --- WORLD SELECTION SCREEN ---
  if (!gameState.isPlaying) {
    const currentUserData = MockFirebase.getCurrentUser();
    const displayScore = currentUserData?.score ?? gameState.score;
    const displayLevel = currentUserData?.level ?? gameState.currentLevel;

    return (
      <div className="h-full w-full flex flex-col overflow-hidden relative animate-fade-in">
        {showOracle && renderOracleModal()}

        <div className="flex-shrink-0 p-6 border-b border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 backdrop-blur-md animate-slide-down">
          <div>
            <h1 className="text-2xl md:text-3xl font-display text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-lg">
              Hola, {user.name}
            </h1>
            <p className="text-gray-300 text-sm font-bold shadow-black drop-shadow-md">Selecciona un mundo para restaurar el equilibrio.</p>
          </div>
          <div className="flex gap-2">
             <Button onClick={() => setShowOracle(true)} className="bg-indigo-900/60 border border-indigo-500/50 hover:bg-indigo-800 text-indigo-100 px-3 py-2 text-sm flex items-center gap-2 backdrop-blur-sm">
               <Search size={16} /> <span className="hidden sm:inline">Oráculo</span>
             </Button>
             <Button variant="secondary" onClick={onLogout} className="text-sm px-4 py-2">Salir</Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.values(MathTopic).map((topic, index) => (
                <div 
                  key={topic} 
                  className="relative overflow-hidden rounded-xl border-2 border-slate-700 hover:border-mystery-accent transition-all cursor-pointer group shadow-xl hover:shadow-purple-500/20 h-64 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => handleStartGame(topic)}
                >
                  {/* Topic Image Background */}
                  <img 
                    src={TOPIC_IMAGES[topic]} 
                    alt={topic} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 filter brightness-75 group-hover:brightness-100"
                  />
                  
                  {/* Content Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent p-6 flex flex-col justify-end">
                    <h3 className="text-2xl font-bold font-display mb-1 text-white drop-shadow-lg group-hover:text-mystery-accent transition-colors">{topic}</h3>
                    <p className="text-sm text-gray-200 font-medium drop-shadow-md">Explora los misterios de {topic.toLowerCase()}.</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 bg-slate-900/80 backdrop-blur-md rounded-xl p-6 border border-slate-700 shadow-lg animate-slide-up" style={{ animationDelay: '0.5s' }}>
                <h2 className="text-xl font-display mb-4">Tu Progreso Global</h2>
                <div className="flex gap-8">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-400 drop-shadow-glow">{displayScore}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Puntos Totales</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-400 drop-shadow-glow">{displayLevel}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Nivel Alcanzado</p>
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
    <div className="h-full w-full flex flex-col overflow-hidden animate-fade-in">
      {/* HUD */}
      <div className="flex-shrink-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-700 p-4 flex justify-between items-center shadow-xl z-30 animate-slide-down">
        <div className="flex items-center gap-2">
           <div className="flex text-red-500">
             {[...Array(5)].map((_, i) => (
               <Heart key={i} size={20} fill={i < gameState.lives ? "currentColor" : "none"} className={`md:w-6 md:h-6 ${i < gameState.lives ? "text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" : "text-gray-600/50"}`} />
             ))}
           </div>
        </div>
        <div className="flex flex-col items-center mx-2">
             <div className={`text-2xl md:text-3xl font-display font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'} drop-shadow-md`}>
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
                <p className="text-lg md:text-xl font-bold text-mystery-gold drop-shadow-sm">{gameState.score}</p>
            </div>
            <div className="text-right hidden xs:block">
                <p className="text-[10px] md:text-xs text-gray-400">NIVEL</p>
                <p className="text-lg md:text-xl font-bold text-purple-400 drop-shadow-sm">{gameState.currentLevel}</p>
            </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center">
        <div className="w-full max-w-3xl relative">
          
          {/* Game Over Overlay */}
          {gameOver && (
              <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-lg flex flex-col items-center justify-center p-4 text-center rounded-3xl border-2 border-red-900/50 shadow-2xl animate-fade-in">
                  <AlertCircle size={64} className="text-red-500 mb-4 mx-auto drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-bounce" />
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">¡Juego Terminado!</h2>
                  <p className="text-gray-400 mb-8 text-lg">Te has quedado sin vidas.</p>
                  <div className="bg-slate-800/80 p-6 rounded-xl mb-8 w-full max-w-xs border border-slate-700">
                      <p className="text-sm text-gray-400 uppercase tracking-wider">Puntuación Final</p>
                      <p className="text-4xl font-bold text-mystery-gold my-2">{gameState.score}</p>
                  </div>
                  <div className="flex gap-4 justify-center w-full">
                      <Button variant="secondary" onClick={() => setGameState(prev => ({...prev, isPlaying: false}))}>Salir al Menú</Button>
                      <Button onClick={handleRetry} className="bg-red-600 hover:bg-red-500 border-none">Reintentar (5 Vidas)</Button>
                  </div>
              </div>
          )}

          <div className="bg-slate-800/90 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-700 min-h-[300px] flex flex-col relative animate-slide-up">
              {/* Fast Hint Button */}
              {!loading && !feedback && !gameOver && question && (
                 <button 
                   onClick={handleGetHint}
                   disabled={hintLoading}
                   className="absolute top-4 right-4 text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1 text-xs uppercase tracking-wider font-bold bg-yellow-900/40 px-3 py-1 rounded-full border border-yellow-500/30 hover:bg-yellow-900/60"
                 >
                    <Lightbulb size={14} /> {hintLoading ? 'Pensando...' : 'Pista Rápida'}
                 </button>
              )}

              {loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12">
                      <div className="w-12 h-12 border-4 border-mystery-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-mystery-accent font-display animate-pulse text-center">Descifrando código antiguo...</p>
                  </div>
              ) : question ? (
                  <>
                      <div className="mb-6">
                          <div className="flex justify-between items-start mb-4">
                              <span className="bg-indigo-900/80 text-indigo-200 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold shadow-sm">
                                  {question.topic} • Dif {question.difficulty}
                              </span>
                          </div>
                          <h2 className="text-lg md:text-2xl font-medium text-white leading-relaxed drop-shadow-md animate-fade-in">
                              {question.text}
                          </h2>
                          
                          {/* Hint Display */}
                          {hint && (
                             <div className="mt-4 bg-yellow-900/30 border-l-2 border-yellow-500 p-3 text-yellow-200 text-sm italic animate-fade-in rounded-r-lg">
                               💡 {hint}
                             </div>
                          )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:gap-4 mb-6">
                          {question.options.map((opt, idx) => (
                              <button
                                  key={idx}
                                  disabled={feedback !== null}
                                  onClick={() => handleAnswer(opt)}
                                  className={`p-4 rounded-xl text-left text-base transition-all border-2 shadow-md ${
                                      feedback 
                                          ? opt === question.correctAnswer
                                              ? 'bg-green-900/50 border-green-500 text-green-200'
                                              : 'bg-slate-700/30 border-transparent opacity-50'
                                          : 'bg-slate-700/80 hover:bg-slate-600/80 border-transparent hover:border-mystery-accent text-gray-100'
                                  }`}
                              >
                                  <span className="mr-3 font-mono text-gray-400 opacity-50">
                                      {String.fromCharCode(65 + idx)}.
                                  </span>
                                  {opt}
                              </button>
                          ))}
                      </div>

                      {feedback && (
                          <div className={`rounded-xl p-4 mb-2 border shadow-lg ${
                              feedback === 'correct' ? 'bg-green-900/40 border-green-500/50' : 'bg-red-900/40 border-red-500/50'
                          } animate-fade-in`}>
                              <div className="flex items-start gap-4">
                                  {feedback === 'correct' ? <CheckCircle className="text-green-400 shrink-0 drop-shadow-glow" size={28} /> : <AlertCircle className="text-red-400 shrink-0 drop-shadow-glow" size={28} />}
                                  <div>
                                      <h3 className={`font-bold text-lg ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                                          {feedback === 'correct' ? '¡Correcto!' : feedback === 'timeout' ? '¡Tiempo agotado!' : 'Incorrecto'}
                                      </h3>
                                      <p className="text-gray-200 mt-2 text-sm leading-relaxed">{question.explanation}</p>
                                  </div>
                              </div>
                              <div className="mt-4 flex justify-end">
                                  <Button onClick={handleNextQuestion} className="flex items-center justify-center py-2 text-sm shadow-lg hover:shadow-xl transition-shadow">
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