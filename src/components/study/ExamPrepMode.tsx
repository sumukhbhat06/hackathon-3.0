import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flashcard } from '../../types';
import { ThemeConfig } from '../../themes/themes';
import confetti from 'canvas-confetti';
import { Play, Pause, RotateCcw, Zap, BrainCircuit, Target, CheckCircle2, XCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────
type PrepPhase = 'setup' | 'active' | 'break' | 'review';
type StudyMode = 'quick' | 'active-recall' | 'rapid-quiz';

interface Props {
  cards: Flashcard[];
  theme: ThemeConfig;
}

// ─── Prioritization Logic ─────────────────────────────────────────────
// In a full app, we'd read historical weak cards from DB.
// Here we simulate by allowing weak cards mapped in state to be shifted up.
function getPrioritizedCards(cards: Flashcard[], weakIds: Set<string>, limit: number = 50) {
  const weak = cards.filter(c => weakIds.has(c.id));
  const others = cards.filter(c => !weakIds.has(c.id));
  // Shuffle arrays
  const shuffle = (arr: Flashcard[]) => [...arr].sort(() => Math.random() - 0.5);
  return [...shuffle(weak), ...shuffle(others)].slice(0, limit);
}

const POMODORO_WORK = 25 * 60; // 25 mins
const POMODORO_BREAK = 5 * 60; // 5 mins

export function ExamPrepMode({ cards, theme }: Props) {
  const T = theme.colors;

  // ─── State ────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<PrepPhase>('setup');
  const [studyMode, setStudyMode] = useState<StudyMode>('quick');
  
  // Timer
  const [timeLeft, setTimeLeft] = useState(POMODORO_WORK);
  const [isRunning, setIsRunning] = useState(false);

  // Cards & Session
  const [weakIds, setWeakIds] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Stats
  const [stats, setStats] = useState({ correct: 0, wrong: 0, completed: 0 });

  // Mode specific state
  const [flipped, setFlipped] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null);

  // ─── Timer Logic ──────────────────────────────────────────────────────
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      // Auto-switch phases
      if (phase === 'active') {
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
        setPhase('break');
        setTimeLeft(POMODORO_BREAK);
        setIsRunning(false);
      } else if (phase === 'break') {
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
        setPhase('active');
        setTimeLeft(POMODORO_WORK);
        setIsRunning(false);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, phase]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(phase === 'active' ? POMODORO_WORK : POMODORO_BREAK);
  };

  const formatTime = (secs: number) => `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;

  // ─── Session Control ──────────────────────────────────────────────────
  const startSession = (mode: StudyMode) => {
    setStudyMode(mode);
    setQueue(getPrioritizedCards(cards, weakIds));
    setCurrentIndex(0);
    setStats({ correct: 0, wrong: 0, completed: 0 });
    setFlipped(false);
    setQuizAnswer('');
    setQuizFeedback(null);
    setPhase('active');
    setTimeLeft(POMODORO_WORK);
    setIsRunning(true);
  };

  const endSession = () => {
    setIsRunning(false);
    setPhase('review');
  };

  const currentCard = queue[currentIndex];

  // ─── Handlers ─────────────────────────────────────────────────────────

  const nextCard = () => {
    // For Quick Review, we count it as completed when they hit next
    if (studyMode === 'quick') {
      setStats(s => ({ ...s, completed: s.completed + 1 }));
    }
    
    setFlipped(false);
    setQuizAnswer('');
    setQuizFeedback(null);
    if (currentIndex + 1 >= queue.length) {
      endSession();
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const handleRate = (isCorrect: boolean) => {
    if (!currentCard) return;

    if (isCorrect) {
      setStats(s => ({ ...s, correct: s.correct + 1, completed: s.completed + 1 }));
      setWeakIds(prev => { const n = new Set(prev); n.delete(currentCard.id); return n; });
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 }, colors: ['#10b981', '#34d399'] });
    } else {
      setStats(s => ({ ...s, wrong: s.wrong + 1, completed: s.completed + 1 }));
      setWeakIds(prev => new Set(prev).add(currentCard.id));
      // Weak reinforcement: occasionally push card back into queue 3-5 spots later
      if (queue.length - currentIndex > 5 && Math.random() > 0.5) {
        const newQueue = [...queue];
        const insertAt = currentIndex + 3 + Math.floor(Math.random() * 3);
        newQueue.splice(insertAt, 0, currentCard);
        setQueue(newQueue);
      }
    }

    if (studyMode === 'rapid-quiz') {
      setTimeout(nextCard, 1200);
    } else {
      nextCard();
    }
  };

  const handleQuizSubmit = () => {
    if (!currentCard || !quizAnswer.trim()) return;
    // Simple fuzz match for demo purposes (ignore case, check if included)
    const isCorrect = currentCard.answer.toLowerCase().includes(quizAnswer.toLowerCase().trim());
    setQuizFeedback(isCorrect ? 'correct' : 'wrong');
    handleRate(isCorrect);
  };

  // ─── Renders ──────────────────────────────────────────────────────────

  if (phase === 'setup') {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-8 py-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl mb-6 transition-transform hover:scale-110 duration-300" 
            style={{ 
              background: `rgba(${T.primaryRgb}, 0.1)`, 
              border: `1px solid rgba(${T.primaryRgb}, 0.3)`,
              boxShadow: `0 0 20px rgba(${T.primaryRgb}, 0.2)`
            }}>
            <Zap className="h-8 w-8" style={{ color: T.primary }} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-3">1-Day Exam Prep Mode</h1>
          <p className="text-lg" style={{ color: 'rgba(255,255,255,0.6)' }}>High-intensity focus. Pomodoro timer. Smart weak-card prioritization.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            { id: 'quick', icon: Target, title: 'Quick Review', desc: 'Fast flipping. Front and back scanning.' },
            { id: 'active-recall', icon: BrainCircuit, title: 'Active Recall', desc: 'Question only. Think, reveal, self-rate.' },
            { id: 'rapid-quiz', icon: Zap, title: 'Rapid Quiz', desc: 'Type answers. Instant strict feedback.' }
          ].map(m => (
            <button 
              key={m.id} 
              onClick={() => startSession(m.id as StudyMode)} 
              className="group relative rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1" 
              style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid rgba(255,255,255,0.06)' 
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `rgba(${T.primaryRgb},0.05)`;
                e.currentTarget.style.borderColor = `rgba(${T.primaryRgb},0.4)`;
                e.currentTarget.style.boxShadow = `0 10px 30px -10px rgba(${T.primaryRgb}, 0.2)`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg transition-colors group-hover:scale-110" 
                style={{ background: `rgba(${T.primaryRgb},0.12)`, color: T.primary }}>
                <m.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 transition-colors group-hover:text-white">{m.title}</h3>
              <p className="text-sm leading-relaxed transition-colors group-hover:text-white/70" style={{ color: 'rgba(255,255,255,0.5)' }}>{m.desc}</p>
            </button>
          ))}
        </div>

        <div className="rounded-2xl p-6 mt-4 flex items-center justify-between" 
          style={{ 
            background: 'rgba(255,255,255,0.015)', 
            border: '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)'
          }}>
          <div>
            <h4 className="font-bold text-white/90 mb-1">Total Pool</h4>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{cards.length} cards available</p>
          </div>
          <div className="text-right">
            <h4 className="font-bold mb-1" style={{ color: '#f87171' }}>Weak Cards identified</h4>
            <p className="text-sm" style={{ color: 'rgba(129,0,209,0.3)' }}>{weakIds.size} cards ready for drill</p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'review') {
    const accuracy = stats.completed ? Math.round((stats.correct / stats.completed) * 100) : 0;
    return (
      <div className="max-w-xl mx-auto py-12 text-center flex flex-col items-center gap-8">
        <div className="text-7xl">🏆</div>
        <h2 className="text-3xl font-black text-white">Session Complete!</h2>
        
        <div className="grid grid-cols-3 gap-4 w-full">
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-3xl font-black mb-1" style={{ color: T.primary }}>{stats.completed}</div>
            <div className="text-xs uppercase font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>Cards Done</div>
          </div>
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-3xl font-black mb-1" style={{ color: accuracy >= 80 ? '#10b981' : '#f59e0b' }}>{accuracy}%</div>
            <div className="text-xs uppercase font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>Accuracy</div>
          </div>
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-3xl font-black mb-1" style={{ color: '#f87171' }}>{weakIds.size}</div>
            <div className="text-xs uppercase font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>Weak Cards</div>
          </div>
        </div>

        <button onClick={() => setPhase('setup')} className="w-full py-4 rounded-xl font-bold text-lg text-white mt-4 transition-transform active:scale-95" style={{ background: T.tabActive, boxShadow: `0 4px 20px ${T.glow}` }}>
          Return to Prep Menu
        </button>
      </div>
    );
  }

  // Active or Break phase
  const isBreak = phase === 'break';
  const progressPct = ((currentIndex) / queue.length) * 100;

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      {/* ─── Top Bar: Stats & Timer ─── */}
      <div className="flex items-center justify-between p-4 mb-6 rounded-2xl" style={{ background: isBreak ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isBreak ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}` }}>
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>Progress</span>
            <span className="font-mono text-base font-bold text-white">{currentIndex + 1} <span style={{ color: 'rgba(255,255,255,0.3)' }}>/ {queue.length}</span></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>Accuracy</span>
            <span className="font-mono text-base font-bold" style={{ color: (stats.correct / (stats.completed || 1)) >= 0.7 ? '#10b981' : '#f59e0b' }}>
              {stats.completed ? Math.round((stats.correct / stats.completed) * 100) : 0}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>Score (C/W)</span>
            <span className="font-mono text-base font-bold">
              <span style={{ color: '#10b981' }}>{stats.correct}</span>
              <span className="mx-1" style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
              <span style={{ color: '#f87171' }}>{stats.wrong}</span>
            </span>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <span className="text-[10px] uppercase font-bold tracking-widest text-white px-2 py-0.5 rounded" style={{ background: isBreak ? '#059669' : T.primary }}>
              {isBreak ? 'BREAK' : 'FOCUS'}
            </span>
            <span className="font-mono text-xl font-black tracking-widest" style={{ color: isBreak ? '#34d399' : '#fff' }}>
              {formatTime(timeLeft)}
            </span>
            <button onClick={toggleTimer} className="p-1 rounded hover:bg-white/10 text-white transition-colors">
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button onClick={resetTimer} className="p-1 rounded hover:bg-white/10 text-white transition-colors" title="Reset phase timer">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <button onClick={() => setPhase('setup')} className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.5)' }}>Exit</button>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="h-1.5 w-full bg-white/5 rounded-full mb-8 overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: T.tabActive, width: `${progressPct}%` }} animate={{ width: `${progressPct}%` }} transition={{ type: 'spring' }} />
      </div>

      {isBreak ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
          <div className="text-6xl mb-6">☕</div>
          <h2 className="text-3xl font-black text-white mb-2">Take a breather</h2>
          <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>Let the concepts sink in. Stand up and stretch.</p>
          <button onClick={() => { setPhase('active'); setTimeLeft(POMODORO_WORK); setIsRunning(true); }} className="px-8 py-3 rounded-xl font-bold text-white transition-transform active:scale-95" style={{ background: 'rgba(255,255,255,0.1)' }}>Skip Break</button>
        </div>
      ) : currentCard && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={currentCard.id + (flipped?'1':'0')} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.2 }}
              className="flex-1 rounded-3xl p-8 flex flex-col shadow-2xl overflow-y-auto"
              style={{ background: theme.colors.cardBg, border: `1px solid ${theme.colors.cardBorder}` }}>
              
              <div className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: T.primary }}>
                {studyMode === 'quick' ? '👀 Quick Review' : studyMode === 'active-recall' ? '🧠 Active Recall' : '⚡ Rapid Quiz'}
              </div>

              {/* Question */}
              <div className="mb-8">
                <p className="text-2xl font-bold text-white leading-relaxed">{currentCard.question}</p>
              </div>

              {/* ─── Mode Specific Logic ─── */}

              {/* QUICK REVIEW */}
              {studyMode === 'quick' && (
                <>
                  <div className="mb-4">
                    <p className="text-lg font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{currentCard.answer}</p>
                  </div>
                  <div className="mt-auto flex justify-end gap-3 pt-6">
                    <button onClick={nextCard} className="px-8 py-4 rounded-xl font-bold text-white tracking-wide" style={{ background: T.tabActive, boxShadow: `0 4px 15px ${T.glow}` }}>Next Card ➔</button>
                  </div>
                </>
              )}

              {/* ACTIVE RECALL */}
              {studyMode === 'active-recall' && (
                <>
                  {!flipped ? (
                    <div className="mt-auto flex justify-center pt-6">
                      <button onClick={() => setFlipped(true)} className="w-full py-4 rounded-xl font-bold text-white text-lg transition-transform active:scale-[0.98]" style={{ background: T.tabActive, boxShadow: `0 4px 15px ${T.glow}` }}>Reveal Answer</button>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <div className="rounded-xl p-6 mb-8" style={{ background: `rgba(${T.primaryRgb},0.08)`, border: `1px solid rgba(${T.primaryRgb},0.2)` }}>
                        <p className="text-lg font-medium text-white leading-relaxed">{currentCard.answer}</p>
                      </div>
                      <div className="mt-auto">
                        <p className="text-center text-xs uppercase font-bold tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Did you know it?</p>
                        <div className="flex gap-3">
                          <button onClick={() => handleRate(false)} className="flex-1 py-4 rounded-xl font-bold text-white transition-opacity hover:opacity-90" style={{ background: '#dc2626' }}><XCircle className="inline-block mr-2 h-5 w-5"/> No, missed it</button>
                          <button onClick={() => handleRate(true)} className="flex-1 py-4 rounded-xl font-bold text-white transition-opacity hover:opacity-90" style={{ background: '#059669' }}><CheckCircle2 className="inline-block mr-2 h-5 w-5"/> Yes, got it!</button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* RAPID QUIZ */}
              {studyMode === 'rapid-quiz' && (
                <div className="flex flex-col flex-1">
                  {!quizFeedback ? (
                    <div className="mt-auto pt-6 flex flex-col gap-4">
                      <input
                        type="text"
                        autoFocus
                        value={quizAnswer}
                        onChange={e => setQuizAnswer(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleQuizSubmit()}
                        placeholder="Type your answer here..."
                        className="w-full bg-transparent border-b-2 px-2 py-3 text-xl font-medium text-white outline-none transition-colors"
                        style={{ borderBottomColor: quizAnswer ? T.primary : 'rgba(255,255,255,0.2)' }}
                      />
                      <button onClick={handleQuizSubmit} disabled={!quizAnswer.trim()} className="w-full py-4 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: T.tabActive, boxShadow: quizAnswer.trim() ? `0 4px 15px ${T.glow}` : 'none' }}>Submit Answer</button>
                    </div>
                  ) : (
                    <div className="mt-auto flex flex-col gap-6 animate-in slide-in-from-bottom-4">
                      {quizFeedback === 'correct' ? (
                        <div className="rounded-2xl p-6 flex flex-col items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="h-12 w-12" />
                          <h3 className="text-xl font-black">Correct!</h3>
                        </div>
                      ) : (
                        <div className="rounded-2xl p-6 flex flex-col gap-3 bg-red-500/10 border border-red-500/20">
                          <div className="flex items-center gap-2 text-red-500 mb-2">
                            <XCircle className="h-6 w-6" />
                            <h3 className="text-xl font-black">Incorrect</h3>
                          </div>
                          <div className="text-xs uppercase font-bold text-red-400/70 tracking-widest">Correct Answer:</div>
                          <p className="text-white font-medium">{currentCard.answer}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
