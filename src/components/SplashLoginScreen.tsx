import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, animate } from 'motion/react';

interface SplashLoginScreenProps {
  view: 'login' | 'signup';
  setView: (v: 'login' | 'signup' | 'home' | 'results' | 'demo') => void;
  setUser: (u: { email: string }) => void;
}

const TITLE = "NotesCraft".split('');
const SUBTITLE = "Where Knowledge Becomes Power".split('');

export function SplashLoginScreen({ view, setView, setUser }: SplashLoginScreenProps) {
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Smooth spring-driven progress
  const progressMV = useMotionValue(0);
  const smoothProgress = useSpring(progressMV, { stiffness: 60, damping: 18, mass: 1 });

  useEffect(() => {
    // Drive the motion value from 0 → 100 over 2.8 s
    const controls = animate(progressMV, 100, {
      duration: 2.8,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate: v => setProgress(Math.round(v)),
      onComplete: () => {
        setShowContent(true);
        setTimeout(() => setShowForm(true), 700);
      },
    });
    return () => controls.stop();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ email: email || 'user@example.com' });
    setView('home');
  };

  // Arc path calculation
  const arcLen = 565;
  const dashOffset = arcLen - (arcLen * progress) / 100;

  return (
    <div className="relative w-full h-screen overflow-hidden flex text-white"
      style={{ background: 'radial-gradient(ellipse at 30% 50%, #0d0721 0%, #000000 70%)' }}>

      {/* Ambient glow blobs */}
      {[
        { top: '10%', left: '10%', size: 600, color: 'rgba(109,40,217,0.12)', delay: 0 },
        { top: '60%', left: '50%', size: 500, color: 'rgba(79,70,229,0.10)', delay: 1.5 },
        { top: '20%', left: '70%', size: 400, color: 'rgba(167,139,250,0.08)', delay: 0.8 },
      ].map((blob, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            top: blob.top, left: blob.left,
            width: blob.size, height: blob.size,
            background: blob.color,
            filter: 'blur(100px)',
            translateX: '-50%', translateY: '-50%',
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: blob.delay }}
        />
      ))}

      {/* Stars */}
      {Array.from({ length: 80 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            width: Math.random() > 0.85 ? 2 : 1,
            height: Math.random() > 0.85 ? 2 : 1,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{ opacity: [0.1, Math.random() * 0.5 + 0.2, 0.1] }}
          transition={{ duration: 2 + Math.random() * 4, repeat: Infinity, ease: 'easeInOut', delay: Math.random() * 5 }}
        />
      ))}

      {/* ========== LEFT PANEL ========== */}
      <div className="relative flex flex-col items-center justify-center flex-1">

        {/* Arc + Book */}
        <div className="relative" style={{ width: 380, height: 300 }}>

          <svg width="380" height="280" viewBox="0 0 380 280" className="absolute inset-0">
            {/* Track */}
            <path d="M20 220 A180 180 0 0 1 360 220" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2" strokeLinecap="round" />
            {/* Fill */}
            <motion.path
              d="M20 220 A180 180 0 0 1 360 220"
              fill="none"
              stroke="url(#arcGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={arcLen}
              style={{ strokeDashoffset: smoothProgress.get() >= 100 ? 0 : dashOffset }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 2.8, ease: [0.25, 0.1, 0.25, 1] }}
            />
            {/* Glow overlay */}
            <motion.path
              d="M20 220 A180 180 0 0 1 360 220"
              fill="none"
              stroke="rgba(167,139,250,0.3)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={arcLen}
              animate={{ strokeDashoffset: 0 }}
              initial={{ strokeDashoffset: arcLen }}
              transition={{ duration: 2.8, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ filter: 'blur(4px)' }}
            />
            <defs>
              <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            {/* Bottom bar */}
            <rect x="20" y="238" width="340" height="1" rx="0.5" fill="rgba(255,255,255,0.05)" />
            <motion.rect x="20" y="238" height="1" rx="0.5" fill="rgba(167,139,250,0.5)"
              initial={{ width: 0 }}
              animate={{ width: 340 }}
              transition={{ duration: 2.8, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </svg>

          {/* 3D Book */}
          <div className="absolute" style={{ top: 28, left: '50%', transform: 'translateX(-50%)' }}>
            <Book3D />
          </div>

          {/* Loading text */}
          <AnimatePresence>
            {!showContent && (
              <motion.div
                className="absolute text-[11px] tracking-[0.2em] uppercase text-white/35"
                style={{ bottom: 2, left: 0, right: 0, textAlign: 'center' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4 }}
              >
                Loading Knowledge Base&nbsp;
                <motion.span className="text-violet-300 font-mono tabular-nums">
                  {progress}%
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Title + subtitle after loading */}
        <AnimatePresence>
          {showContent && (
            <motion.div className="text-center mt-6">
              {/* Title */}
              <motion.h1
                className="text-5xl md:text-6xl font-extrabold tracking-tight leading-none mb-3"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.055 } } }}
              >
                {TITLE.map((char, i) => (
                  <motion.span
                    key={i}
                    className="inline-block"
                    variants={{
                      hidden: { opacity: 0, y: -50, scale: 0.4, filter: 'blur(12px)', rotate: (Math.random()-0.5)*20 },
                      visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', rotate: 0,
                        transition: { type: 'spring', stiffness: 200, damping: 18, mass: 0.8 } },
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 30%, #c4b5fd)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-sm text-white/35 tracking-widest uppercase"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.025, delayChildren: 0.4 } } }}
              >
                {SUBTITLE.map((char, i) => (
                  <motion.span
                    key={i}
                    className="inline-block"
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
                    }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========== RIGHT PANEL ========== */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="relative flex flex-col items-center justify-center"
            style={{ width: 400, minWidth: 360, paddingRight: 52, paddingLeft: 20 }}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Divider */}
            <motion.div
              className="absolute left-0 top-[12%] h-[76%] w-px"
              style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)' }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            />

            <motion.div
              className="w-full max-w-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20,
                padding: 28,
                boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              {/* Brand */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                </div>
                <span className="font-bold text-white/85 text-sm tracking-wide">NotesCraft</span>
              </div>

              {/* Heading */}
              <div className="mb-5">
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={view}
                    className="text-xl font-semibold text-white"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    {view === 'login' ? 'Welcome back' : 'Create account'}
                  </motion.h2>
                </AnimatePresence>
                <p className="text-xs text-white/35 mt-0.5">
                  {view === 'login' ? 'Sign in to continue your journey' : 'Start learning smarter today'}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-5 p-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                {['login', 'signup'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setView(tab as 'login' | 'signup')}
                    className="relative flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors duration-200 z-10"
                    style={{ color: view === tab ? '#fff' : 'rgba(255,255,255,0.35)' }}
                  >
                    {view === tab && (
                      <motion.div
                        layoutId="tab-pill"
                        className="absolute inset-0 rounded-md"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', zIndex: -1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                      />
                    )}
                    {tab === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {/* Form fields */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {[
                  { label: 'Email Address', type: 'email', placeholder: 'e.g. john@example.com', value: email, onChange: setEmail },
                  { label: 'Password', type: 'password', placeholder: '••••••••', value: password, onChange: setPassword },
                ].map(field => (
                  <div key={field.label}>
                    <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={field.value}
                      onChange={e => field.onChange(e.target.value)}
                      className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none transition-all duration-200"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        caretColor: '#a78bfa',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(167,139,250,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(167,139,250,0.08)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                ))}

                <AnimatePresence>
                  {/* Phone field removed requested by user */}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(124,58,237,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-2.5 text-white rounded-lg font-semibold text-sm tracking-wide mt-1"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
                    transition: 'box-shadow 0.2s',
                  }}
                >
                  {view === 'login' ? 'Sign In →' : 'Create Account →'}
                </motion.button>
              </form>

              <p className="text-center text-[11px] mt-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {view === 'login'
                  ? <><span>No account? </span><button onClick={() => setView('signup')} className="text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors">Sign up free</button></>
                  : <><span>Already a member? </span><button onClick={() => setView('login')} className="text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors">Sign in</button></>
                }
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Book3D() {
  const y = useSpring(0, { stiffness: 40, damping: 10, mass: 1.2 });
  const rotY = useSpring(-22, { stiffness: 25, damping: 12, mass: 1 });

  useEffect(() => {
    // Float loop
    let t = 0;
    const raf = () => {
      t += 0.012;
      y.set(Math.sin(t) * 14);
      rotY.set(-22 + Math.sin(t * 0.5) * 14);
      handle = requestAnimationFrame(raf);
    };
    let handle = requestAnimationFrame(raf);
    return () => cancelAnimationFrame(handle);
  }, []);

  return (
    <motion.div
      style={{
        width: 120, height: 150,
        position: 'relative',
        transformStyle: 'preserve-3d',
        y, rotateY: rotY, rotateX: 8,
        filter: 'drop-shadow(0 0 30px rgba(167,139,250,0.55))',
      }}
    >
      {/* Back cover */}
      <div style={{
        position: 'absolute', width: 120, height: 150,
        background: 'linear-gradient(135deg, #1e1b4b, #3b0764)',
        borderRadius: '2px 8px 8px 2px',
        boxShadow: '6px 6px 24px rgba(0,0,0,0.7)',
        backfaceVisibility: 'hidden',
      }} />

      {/* Spine */}
      <div style={{
        position: 'absolute', width: 18, height: 150, left: -18,
        background: 'linear-gradient(180deg, #5b21b6, #3b0764)',
        transform: 'rotateY(-90deg)', transformOrigin: 'right center',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 7, fontWeight: 800, writingMode: 'vertical-rl', letterSpacing: 2.5 }}>
          NOTESCRAFT
        </span>
      </div>

      {/* Pages */}
      <div style={{
        position: 'absolute', width: 112, height: 146, left: 4, top: 2,
        background: 'repeating-linear-gradient(to bottom,#ddd6fe 0,#ddd6fe 1px,#f5f3ff 1px,#f5f3ff 3px)',
        borderRadius: '1px 4px 4px 1px',
        boxShadow: 'inset -2px 0 6px rgba(0,0,0,0.15)',
      }} />

      {/* Animated page */}
      <PageFlip />

      {/* Front cover */}
      <div style={{
        position: 'absolute', width: 120, height: 150,
        background: 'linear-gradient(140deg,#7c3aed 0%,#4f46e5 60%,#312e81 100%)',
        borderRadius: '2px 8px 8px 2px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '-3px 3px 16px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.18)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
        </div>
        <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: 2.5 }}>NOTESCRAFT</div>
        <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5 }}>STUDY AI</div>
        <div style={{
          position: 'absolute', bottom: 18, left: 14, right: 14, height: 1,
          background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)',
        }} />
      </div>
    </motion.div>
  );
}

function PageFlip() {
  const pageRotY = useSpring(0, { stiffness: 30, damping: 14, mass: 1.5 });

  useEffect(() => {
    let going = true;
    const cycle = async () => {
      while (going) {
        await new Promise(r => setTimeout(r, 3000));
        if (!going) break;
        pageRotY.set(-165);
        await new Promise(r => setTimeout(r, 1200));
        if (!going) break;
        pageRotY.set(0);
        await new Promise(r => setTimeout(r, 600));
      }
    };
    cycle();
    return () => { going = false; };
  }, []);

  return (
    <motion.div
      style={{
        position: 'absolute', width: 108, height: 142, left: 6, top: 4,
        background: 'linear-gradient(to right,#ede9fe,#f5f3ff)',
        borderRadius: '1px 4px 4px 1px',
        transformOrigin: 'left center',
        rotateY: pageRotY,
        backfaceVisibility: 'hidden',
        opacity: 0.65,
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} style={{ height: 1, background: 'rgba(109,40,217,0.12)', margin: `${12 + i * 13}px 10px 0` }} />
      ))}
    </motion.div>
  );
}
