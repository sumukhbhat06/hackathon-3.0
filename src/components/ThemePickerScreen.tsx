import { motion } from 'motion/react';
import { THEMES, ThemeId, ThemeConfig } from '../themes/themes';

interface ThemePickerScreenProps {
  onSelect: (theme: ThemeId) => void;
  currentTheme?: ThemeId;
}

const THEME_BG: Record<ThemeId, string> = {
  normal: 'radial-gradient(135deg at 20% 20%, #1a0040 0%, #0a0018 60%, #000 100%)',
  anime:  'radial-gradient(135deg at 20% 20%, #2a0040 0%, #0a0015 60%, #0a0010 100%)',
  movies: 'radial-gradient(135deg at 20% 20%, #1a1000 0%, #0a0800 60%, #050505 100%)',
};

const THEME_PARTICLES: Record<ThemeId, string[]> = {
  normal: ['✨','🔮','💡','📖','🧠','⭐'],
  anime:  ['⛩️','🌸','⚡','🗡️','🔥','💥','🌊','🏮'],
  movies: ['🎬','🎭','🌟','🎥','🏆','🎞️','🎪','🎦'],
};

function ThemeCard({ theme, onSelect, index }: { theme: ThemeConfig; onSelect: () => void; index: number }) {
  const particles = THEME_PARTICLES[theme.id];

  return (
    <motion.button
      onClick={onSelect}
      className="relative overflow-hidden rounded-3xl text-left w-full"
      style={{
        background: THEME_BG[theme.id],
        border: `1px solid ${theme.colors.cardBorder}`,
        padding: '2px',
      }}
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.1 + index * 0.12, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ scale: 1.03, y: -6 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Glow border */}
      <motion.div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{ boxShadow: `0 0 0 0 ${theme.colors.primary}` }}
        whileHover={{ boxShadow: `0 0 40px 2px ${theme.colors.glow}, inset 0 0 20px ${theme.colors.glow}` }}
        transition={{ duration: 0.3 }}
      />

      <div className="relative rounded-3xl overflow-hidden" style={{ background: THEME_BG[theme.id], padding: 28 }}>
        {/* Floating particles */}
        {particles.map((p, i) => (
          <motion.span
            key={i}
            className="absolute select-none pointer-events-none text-xl"
            style={{ top: `${10 + (i * 17) % 70}%`, left: `${5 + (i * 23) % 80}%`, opacity: 0.15 }}
            animate={{ y: [-4, 4, -4], opacity: [0.12, 0.25, 0.12] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
          >
            {p}
          </motion.span>
        ))}

        {/* Theme emoji big */}
        <motion.div
          className="text-5xl mb-4 block"
          animate={{ rotate: [-3, 3, -3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {theme.emoji}
        </motion.div>

        {/* Badge */}
        <div
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest mb-3"
          style={{
            background: `rgba(${theme.colors.primaryRgb},0.15)`,
            color: theme.colors.primary,
            border: `1px solid rgba(${theme.colors.primaryRgb},0.3)`,
          }}
        >
          {theme.name} Mode
        </div>

        <h3
          className="text-2xl font-extrabold text-white mb-2 leading-tight"
          style={{ fontFamily: theme.font || 'Inter, sans-serif' }}
        >
          {theme.name}
        </h3>
        <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {theme.tagline}
        </p>

        {/* Preview pills */}
        <div className="flex flex-wrap gap-2">
          {['Notes', 'Flashcards', 'Flowchart'].map(label => (
            <span
              key={label}
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: `rgba(${theme.colors.primaryRgb},0.12)`,
                color: theme.colors.accent,
                border: `1px solid rgba(${theme.colors.primaryRgb},0.2)`,
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Select button */}
        <motion.div
          className="mt-6 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white w-full justify-center"
          style={{ background: theme.colors.tabActive, boxShadow: `0 4px 20px ${theme.colors.glow}` }}
          whileHover={{ scale: 1.03 }}
        >
          Choose {theme.name} →
        </motion.div>
      </div>
    </motion.button>
  );
}

export function ThemePickerScreen({ onSelect, currentTheme }: ThemePickerScreenProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'radial-gradient(ellipse at 30% 0%, #0d0721 0%, #000000 70%)' }}
    >
      {/* Stars */}
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            width: Math.random() > 0.8 ? 2 : 1,
            height: Math.random() > 0.8 ? 2 : 1,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{ opacity: [0.1, Math.random() * 0.5 + 0.1, 0.1] }}
          transition={{ duration: 2 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 4 }}
        />
      ))}

      {/* Header */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#8100D1,#4f46e5)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <span className="font-bold text-white text-sm tracking-wide">NotesCraft</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">
          Choose Your{' '}
          <span style={{ background: 'linear-gradient(135deg,#8100D1,#FF2D9B,#F5C518)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Learning Style
          </span>
        </h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Your notes, flashcards and UI will adapt to the theme you choose
        </p>
      </motion.div>

      {/* Theme Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {Object.values(THEMES).map((theme, i) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            index={i}
            onSelect={() => onSelect(theme.id)}
          />
        ))}
      </div>

      <motion.p
        className="mt-8 text-xs"
        style={{ color: 'rgba(255,255,255,0.2)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        You can switch themes anytime from the navbar
      </motion.p>
    </div>
  );
}
