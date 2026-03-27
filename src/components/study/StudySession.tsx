import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flashcard } from '../../types';
import { ThemeConfig } from '../../themes/themes';
import confetti from 'canvas-confetti';

// ─── SM-2 Types ──────────────────────────────────────────────────────────────

type Rating = 'again' | 'hard' | 'good' | 'easy';

interface CardState {
  id: string;
  interval: number;   // days until next review
  ef: number;         // ease factor (2.5 default)
  due: number;        // timestamp
  reps: number;       // total reviews
  rating?: Rating;
}

const INITIAL_EF = 2.5;

function applyRating(cs: CardState, rating: Rating): CardState {
  let { interval, ef, reps } = cs;
  switch (rating) {
    case 'again': interval = 0; ef = Math.max(1.3, ef - 0.2); break;
    case 'hard':  interval = Math.max(1, Math.floor(interval * 1.2)); ef = Math.max(1.3, ef - 0.15); break;
    case 'good':  interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(interval * ef); break;
    case 'easy':  interval = reps === 0 ? 3 : reps === 1 ? 5 : Math.round(interval * ef * 1.3); ef = Math.min(3, ef + 0.15); break;
  }
  return { ...cs, interval, ef, reps: reps + 1, due: Date.now() + interval * 86_400_000, rating };
}

// ─── Theme helpers ────────────────────────────────────────────────────────────

const THEME_LABELS: Record<string, { again: string; hard: string; good: string; easy: string; correct: string; wrong: string }> = {
  normal: { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy', correct: '✅ Correct!', wrong: '❌ Not quite' },
  anime:  { again: '💀 Again (Davy Back!)', hard: '⚔️ Hard (needs training)', good: '🔥 Good (Power Up!)', easy: '⚡ Easy (Devil Fruit!)', correct: '🏴‍☠️ GOMU GOMU NO CORRECT!', wrong: '💦 Sea King got ya!' },
  movies: { again: '🔄 Again (plan failed)', hard: '😅 Hard (need backup)', good: '✅ Good (smooth move)', easy: '💎 Easy (vault cracked!)', correct: '🎬 Heist Successful! 🎯', wrong: '⚠️ Inspector caught you!' },
};

// ─── Sub-mode switcher ────────────────────────────────────────────────────────

type Mode = 'browse' | 'qa' | 'spaced';

interface Props {
  cards: Flashcard[];
  theme: ThemeConfig;
  isMastered: (id: string) => boolean;
  onToggleMastered: (id: string) => void;
  FlashcardGrid: React.ReactNode;
}

// ─── Q&A Mode ─────────────────────────────────────────────────────────────────

function QAMode({ cards, theme }: { cards: Flashcard[]; theme: ThemeConfig }) {
  const T = theme.colors;
  const labels = THEME_LABELS[theme.id] || THEME_LABELS.normal;
  const [idx, setIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [done, setDone] = useState(false);
  const [selfRating, setSelfRating] = useState<'correct' | 'wrong' | null>(null);

  const card = cards[idx];

  const handleReveal = () => setRevealed(true);

  const handleRate = (r: 'correct' | 'wrong') => {
    setSelfRating(r);
    const newScore = { ...score, [r]: score[r as keyof typeof score] + 1 };
    setScore(newScore);
    if (r === 'correct') confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    setTimeout(() => {
      setSelfRating(null);
      setRevealed(false);
      setUserAnswer('');
      if (idx + 1 >= cards.length) setDone(true);
      else setIdx(i => i + 1);
    }, 900);
  };

  const restart = () => { setIdx(0); setRevealed(false); setUserAnswer(''); setScore({ correct: 0, wrong: 0 }); setDone(false); };

  if (done) {
    const pct = Math.round((score.correct / cards.length) * 100);
    return (
      <motion.div className="flex flex-col items-center justify-center py-12 text-center gap-6"
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="text-6xl">{pct >= 80 ? (theme.id === 'anime' ? '🏴‍☠️' : theme.id === 'movies' ? '🎬' : '🎉') : '📚'}</div>
        <h2 className="text-2xl font-bold text-white">Session Complete!</h2>
        <div className="flex gap-6">
          <div className="text-center"><div className="text-3xl font-black" style={{ color: '#10b981' }}>{score.correct}</div><div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Correct</div></div>
          <div className="text-center"><div className="text-3xl font-black" style={{ color: '#f87171' }}>{score.wrong}</div><div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Wrong</div></div>
          <div className="text-center"><div className="text-3xl font-black" style={{ color: T.primary }}>{pct}%</div><div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Score</div></div>
        </div>
        <button onClick={restart} className="px-6 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: T.tabActive }}>
          Try Again
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-full h-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <motion.div className="h-full rounded-full" style={{ background: T.tabActive, width: `${(idx / cards.length) * 100}%` }}
            animate={{ width: `${(idx / cards.length) * 100}%` }} transition={{ type: 'spring', stiffness: 80 }} />
        </div>
        <span className="text-xs font-semibold tabular-nums" style={{ color: 'rgba(255,255,255,0.4)' }}>{idx + 1}/{cards.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="rounded-2xl p-7 flex flex-col gap-5"
          style={{ background: theme.colors.cardBg, border: `1px solid ${theme.colors.cardBorder}` }}>

          <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.primary }}>
            {theme.id === 'anime' ? '⚔️ Sensei asks:' : theme.id === 'movies' ? '🎬 The Mastermind tests:' : '❓ Question'}
          </div>
          <p className="text-lg font-semibold text-white leading-relaxed">{card.question}</p>

          {!revealed ? (
            <div className="flex flex-col gap-3">
              <textarea
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                placeholder={theme.id === 'anime' ? 'State your answer, nakama...' : theme.id === 'movies' ? 'Reveal the plan, boss...' : 'Type your answer...'}
                rows={3}
                className="w-full resize-none rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(${T.primaryRgb},0.2)`, caretColor: T.primary }}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleReveal(); }}
              />
              <button onClick={handleReveal}
                className="w-full py-3 rounded-xl font-bold text-white text-sm"
                style={{ background: T.tabActive, boxShadow: `0 4px 20px ${T.glow}` }}>
                {theme.id === 'anime' ? 'Reveal the jutsu!' : theme.id === 'movies' ? 'Open the vault!' : 'Reveal Answer'}
              </button>
              <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Ctrl+Enter to reveal</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
              {userAnswer && (
                <div className="rounded-lg px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Your answer</div>
                  <p className="text-sm text-white">{userAnswer}</p>
                </div>
              )}
              <div className="rounded-xl px-5 py-4" style={{ background: `rgba(${T.primaryRgb},0.08)`, border: `1px solid rgba(${T.primaryRgb},0.2)` }}>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: T.primary }}>
                  {theme.id === 'anime' ? '🔥 Sensei reveals:' : theme.id === 'movies' ? '💎 Vault opened:' : '✅ Correct Answer'}
                </div>
                <p className="text-sm leading-relaxed text-white">{card.answer}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleRate('correct')}
                  className="py-3 px-4 rounded-xl font-bold text-sm text-white transition-transform active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
                  {labels.correct}
                </button>
                <button onClick={() => handleRate('wrong')}
                  className="py-3 px-4 rounded-xl font-bold text-sm text-white transition-transform active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#dc2626,#f87171)', boxShadow: '0 4px 16px rgba(248,113,113,0.3)' }}>
                  {labels.wrong}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Spaced Repetition Mode ───────────────────────────────────────────────────

function SpacedRepMode({ cards, theme }: { cards: Flashcard[]; theme: ThemeConfig }) {
  const T = theme.colors;
  const labels = THEME_LABELS[theme.id] || THEME_LABELS.normal;

  const initStates = useMemo<CardState[]>(() =>
    cards.map(c => ({ id: c.id, interval: 0, ef: INITIAL_EF, due: Date.now(), reps: 0 })), [cards]);

  const [cardStates, setCardStates] = useState<CardState[]>(initStates);
  const [sessionDone, setSessionDone] = useState<Set<string>>(new Set());
  const [flipped, setFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

  const dueCards = useMemo(() =>
    cardStates.filter(cs => cs.due <= Date.now() && !sessionDone.has(cs.id)), [cardStates, sessionDone]);

  const current = dueCards[0];
  const currentCard = cards.find(c => c.id === current?.id);

  const rate = useCallback((rating: Rating) => {
    if (!current) return;
    const updated = applyRating(current, rating);
    setCardStates(prev => prev.map(cs => cs.id === updated.id ? updated : cs));
    setSessionStats(s => ({ ...s, [rating]: s[rating as keyof typeof s] + 1 }));
    if (rating === 'easy' || rating === 'good') {
      setSessionDone(prev => new Set([...prev, current.id]));
      if (rating === 'easy') confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    }
    setFlipped(false);
  }, [current]);

  const restart = () => { setCardStates(initStates); setSessionDone(new Set()); setFlipped(false); setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 }); };

  const totalDone = sessionDone.size;
  const total = cards.length;
  const pct = Math.round((totalDone / total) * 100);

  // Session complete
  if (dueCards.length === 0) {
    return (
      <motion.div className="flex flex-col items-center justify-center py-12 gap-6 text-center"
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="text-6xl">{theme.id === 'anime' ? '⚡' : theme.id === 'movies' ? '🏆' : '🎉'}</div>
        <h2 className="text-2xl font-bold text-white">
          {theme.id === 'anime' ? 'Training Arc Complete! Nakama!' : theme.id === 'movies' ? 'Heist Complete! Roll Credits!' : 'Session Complete!'}
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {(['again','hard','good','easy'] as Rating[]).map(r => (
            <div key={r} className="text-center rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(${T.primaryRgb},0.15)` }}>
              <div className="text-xl font-black text-white">{sessionStats[r]}</div>
              <div className="text-[10px] uppercase tracking-wider mt-1 capitalize" style={{ color: 'rgba(255,255,255,0.35)' }}>{r}</div>
            </div>
          ))}
        </div>
        <button onClick={restart} className="px-6 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: T.tabActive }}>
          New Session
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      {/* Progress bar + stats row */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-[11px] mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <span>{theme.id === 'anime' ? '🌊 Grand Line progress' : theme.id === 'movies' ? '🗺️ Heist progress' : 'Session Progress'}</span>
            <span>{totalDone}/{total} cards</span>
          </div>
          <div className="rounded-full h-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <motion.div className="h-full rounded-full" style={{ background: T.tabActive }}
              animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 80 }} />
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-black" style={{ color: T.primary }}>{dueCards.length}</div>
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>due</div>
        </div>
      </div>

      {/* Mini stat pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: labels.again.split(' ')[0], val: sessionStats.again, color: '#f87171' },
          { label: labels.hard.split(' ')[0], val: sessionStats.hard, color: '#fb923c' },
          { label: labels.good.split(' ')[0], val: sessionStats.good, color: '#4ade80' },
          { label: labels.easy.split(' ')[0], val: sessionStats.easy, color: T.primary },
        ].map(s => (
          <span key={s.label} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.05)', color: s.color, border: `1px solid ${s.color}33` }}>
            <span style={{ color: s.color }}>{s.val}</span> {s.label}
          </span>
        ))}
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        {currentCard && (
          <motion.div key={current.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            style={{ perspective: 1000 }}>
              {/* Perspective wrapper — MUST be separate from the rotating div */}
              <div style={{ perspective: '1200px', perspectiveOrigin: '50% 50%' }}>
                <motion.div
                  className="relative cursor-pointer select-none rounded-2xl"
                  style={{
                    minHeight: 280,
                    transformStyle: 'preserve-3d',
                    // NO overflow-hidden here — it breaks preserve-3d
                  }}
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 160, damping: 20 }}
                  onClick={() => !flipped && setFlipped(true)}
                >
                  {/* Front face */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center rounded-2xl"
                    style={{
                      background: theme.colors.cardBg,
                      border: `1px solid ${theme.colors.cardBorder}`,
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    } as React.CSSProperties}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-widest mb-5" style={{ color: T.primary }}>
                      {theme.id === 'anime' ? '⚔️ Zoro challenges you:' : theme.id === 'movies' ? '🎬 The Mastermind asks:' : '❓ Question'}
                    </div>
                    <p className="text-lg font-bold text-white leading-relaxed max-w-[90%]">{currentCard.question}</p>
                    <div className="mt-6 text-xs animate-pulse" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {theme.id === 'anime' ? '👆 Click to reveal the power!' : theme.id === 'movies' ? '👆 Click to open the vault' : '👆 Click to reveal answer'}
                    </div>
                  </div>

                  {/* Back face — rotated 180° in place, text reads correctly when parent flips */}
                  <div
                    className="absolute inset-0 flex flex-col justify-start pt-6 px-8 pb-8 text-center rounded-2xl overflow-y-auto"
                    style={{
                      background: theme.colors.cardBg,
                      border: `1px solid rgba(${T.primaryRgb}, 0.4)`,
                      boxShadow: `0 0 30px rgba(${T.primaryRgb}, 0.15)`,
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    } as React.CSSProperties}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: T.primary }}>
                      {theme.id === 'anime' ? '🔥 The truth revealed:' : theme.id === 'movies' ? '💎 Vault contents:' : '✅ Answer'}
                    </div>
                    <p className="text-base font-medium text-white leading-relaxed">{currentCard.answer}</p>
                  </div>
                </motion.div>
              </div>


            {/* Rating buttons — only show when flipped */}
            <AnimatePresence>
              {flipped && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className="mt-4 grid grid-cols-4 gap-2">
                  {([
                    { r: 'again' as Rating, label: labels.again, color: '#dc2626', glow: 'rgba(220,38,38,0.3)' },
                    { r: 'hard'  as Rating, label: labels.hard,  color: '#d97706', glow: 'rgba(217,119,6,0.3)' },
                    { r: 'good'  as Rating, label: labels.good,  color: '#059669', glow: 'rgba(5,150,105,0.3)' },
                    { r: 'easy'  as Rating, label: labels.easy,  color: T.primary, glow: T.glow },
                  ]).map(({ r, label, color, glow }) => (
                    <button key={r} onClick={() => rate(r)}
                      className="py-2.5 rounded-xl text-xs font-bold text-white transition-transform active:scale-95"
                      style={{ background: color, boxShadow: `0 4px 14px ${glow}` }}>
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {!flipped && (
              <p className="mt-3 text-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Rate after flipping the card
              </p>
            )}

            {/* Interval preview */}
            {flipped && (
              <div className="mt-4 flex justify-around text-center">
                {([
                  { r: 'again', label: 'Again',  int: 0 },
                  { r: 'hard',  label: 'Hard',   int: Math.max(1, Math.floor(current.interval * 1.2)) },
                  { r: 'good',  label: 'Good',   int: current.reps < 2 ? 3 : Math.round(current.interval * current.ef) },
                  { r: 'easy',  label: 'Easy',   int: current.reps < 2 ? 5 : Math.round(current.interval * current.ef * 1.3) },
                ]).map(({ label, int }) => (
                  <div key={label} className="text-center">
                    <div className="text-[10px] font-semibold text-white">{int === 0 ? 'Now' : int === 1 ? '1d' : `${int}d`}</div>
                    <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main StudySession Export ─────────────────────────────────────────────────

export function StudySession({ cards, theme, isMastered, onToggleMastered, FlashcardGrid }: Props) {
  const [mode, setMode] = useState<Mode>('browse');
  const T = theme.colors;

  const MODES: { id: Mode; label: string; icon: string }[] = [
    { id: 'browse',  label: 'Browse',     icon: theme.id === 'anime' ? '📜' : theme.id === 'movies' ? '🎞️' : '📚' },
    { id: 'qa',      label: 'Q&A Mode',   icon: theme.id === 'anime' ? '⚔️' : theme.id === 'movies' ? '🎬' : '❓' },
    { id: 'spaced',  label: 'Spaced Rep', icon: theme.id === 'anime' ? '🌊' : theme.id === 'movies' ? '🗺️' : '🔁' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Mode switcher */}
      <div className="flex items-center gap-1 rounded-2xl p-1 w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
            style={mode === m.id
              ? { background: T.tabActive, color: '#fff', boxShadow: `0 2px 12px ${T.glow}` }
              : { color: 'rgba(255,255,255,0.45)' }
            }
          >
            <span>{m.icon}</span> {m.label}
          </button>
        ))}
      </div>

      {/* Mode description banner */}
      <AnimatePresence mode="wait">
        {mode !== 'browse' && (
          <motion.div key={mode} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-xl px-5 py-3 text-sm" style={{ background: `rgba(${T.primaryRgb},0.07)`, border: `1px solid rgba(${T.primaryRgb},0.15)`, color: 'rgba(255,255,255,0.6)' }}>
            {mode === 'qa' && (
              theme.id === 'anime'  ? '⚔️ Type your answer like a true nakama — then reveal the sensei\'s wisdom and rate yourself!' :
              theme.id === 'movies' ? '🎬 The mastermind tests your knowledge — write your answer, open the vault, then judge yourself!' :
              '❓ Write your answer first, then reveal and honestly rate how well you did.'
            )}
            {mode === 'spaced' && (
              theme.id === 'anime'  ? '🌊 Conquer the Grand Line! Flip each card, then rate difficulty — hard cards come back sooner. Aim for Devil Fruit mastery!' :
              theme.id === 'movies' ? '🗺️ Plan the perfect heist! Flip each card, rate your recall — failed cards return to the blueprint. Complete the heist!' :
              '🔁 Flip the card, rate your recall (Again / Hard / Good / Easy). Harder cards come back sooner. Build lasting memory!'
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={mode} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}>
          {mode === 'browse'  && FlashcardGrid}
          {mode === 'qa'      && <QAMode      cards={cards} theme={theme} />}
          {mode === 'spaced'  && <SpacedRepMode cards={cards} theme={theme} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
