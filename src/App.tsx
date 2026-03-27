import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Upload, 
  Youtube, 
  MessageSquare, 
  Layout, 
  ChevronRight, 
  Search, 
  User, 
  LogOut, 
  FileText, 
  BrainCircuit,
  ArrowLeft,
  Send,
  ExternalLink,
  CheckCircle2,
  X,
  Zap
} from 'lucide-react';
import Markdown from 'react-markdown';
import confetti from 'canvas-confetti';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'neutral',
  securityLevel: 'loose',
});

const Mermaid = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ref.current) {
      if (!chart) {
        setError("Flowchart data is currently unavailable. Try generating materials again.");
        return;
      }
      
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      setError(null);
      
      try {
        mermaid.parse(chart).then((valid) => {
          if (valid) {
            mermaid.render(id, chart).then((result) => {
              if (ref.current) {
                ref.current.innerHTML = result.svg;
              }
            }).catch((err) => {
              console.error("Mermaid render error:", err);
              setError("Failed to render flowchart. The AI produced invalid Mermaid syntax.");
            });
          } else {
            setError("The AI generated invalid flowchart syntax.");
          }
        }).catch((err) => {
          console.error("Mermaid parse error:", err);
          setError("Flowchart syntax error: The model's visualization was malformed.");
        });
      } catch (err) {
        console.error("Mermaid catch error:", err);
        setError("An unexpected error occurred while rendering the concept map.");
      }
    }
  }, [chart]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white/5 rounded-2xl border border-white/10 min-h-[300px]">
        <div className="p-3 rounded-full bg-amber-400/10 mb-4">
          <Layout className="h-8 w-8 text-amber-500" />
        </div>
        <p className="text-sm font-bold text-white mb-2">{error}</p>
        <p className="text-xs text-white/40 max-w-xs mb-4">You can still use the Notes and Flashcards for your exam preparation!</p>
        {chart && (
          <pre className="text-[10px] text-white/30 bg-black/30 p-3 rounded-lg border border-white/5 overflow-x-auto max-w-full text-left">
            {chart}
          </pre>
        )}
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full overflow-x-auto animate-in fade-in duration-700">
      <div ref={ref} className="w-full h-full" />
    </div>
  );
};
import { cn } from './lib/utils';
import { extractTextFromPDF } from './services/pdf';
import { generateStudyMaterials, chatWithNotes } from './services/gemini';
import { Flashcard, StudyContent, Message } from './types';
import { ThemePickerScreen } from './components/ThemePickerScreen';
import { THEMES, ThemeId, DEFAULT_THEME } from './themes/themes';
import { StudySession } from './components/study/StudySession';
import { ExamPrepMode } from './components/study/ExamPrepMode';


// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost', size?: 'default' | 'icon' }>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    const variants = {
      primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
      secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100'
    };
    const sizes = {
      default: 'px-4 py-2',
      icon: 'h-10 w-10 p-0'
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('rounded-xl border border-slate-200 bg-white p-6 shadow-sm', className)}>
    {children}
  </div>
);

import { AnimatedAIChat } from './components/ui/animated-ai-chat';
import { SplashLoginScreen } from './components/SplashLoginScreen';


// --- Main App ---

export default function App() {
  const [view, setView] = useState<'login' | 'signup' | 'home' | 'results' | 'demo' | 'theme-picker'>('login');
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [theme, setTheme] = useState<ThemeId>('normal');
  const [showThemeSwitcher, setShowThemeSwitcher] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<StudyContent | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'flashcards' | 'flowchart' | 'examprep' | 'videos'>('notes');
  const [homeTab, setHomeTab] = useState<'search' | 'profile'>('search');
  const [flowchartZoom, setFlowchartZoom] = useState(1);

  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());

  // Auth Handlers (Backup if Splash screen bypassed)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ email: 'demo@example.com' });
    setView('theme-picker');
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ email: 'newuser@example.com' });
    setView('theme-picker');
  };

  // Processing Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await extractTextFromPDF(file);
      const result = await generateStudyMaterials(text, 'pdf', theme);
      setContent(result);
      setView('results');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (error: any) {
      console.error(error);
      alert(`Failed to process PDF: ${error?.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleYoutubeSubmit = async (url: string) => {
    if (!url) return;
    setLoading(true);
    try {
      const result = await generateStudyMaterials(`Analyze the content of this YouTube video: ${url}`, 'youtube', theme);
      setContent(result);
      setView('results');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (error: any) {
      console.error(error);
      alert(`Failed to process YouTube video: ${error?.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !content) return;

    const userMsg: Message = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');

    try {
      const response = await chatWithNotes(content.notes, chatHistory, chatInput);
      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChatSubmit = async (text: string, files: File[]) => {
    setLoading(true);
    try {
      if (files.length > 0) {
        const textFromPdf = await extractTextFromPDF(files[0]);
        // Allow text input to guide the analysis if provided
        const extractPrompt = text.trim() ? `Analyze this PDF with focus on: ${text}\n\nPDF Context:\n${textFromPdf}` : textFromPdf;
        const result = await generateStudyMaterials(extractPrompt, 'pdf', theme);

        setContent(result);
        setView('results');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else if (text.includes('youtube.com') || text.includes('youtu.be')) {
        const result = await generateStudyMaterials(`Analyze the content of this YouTube video: ${text}`, 'youtube', theme);

        setContent(result);
        setView('results');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else if (text.trim()) {
        const result = await generateStudyMaterials(text, 'pdf', theme);

        setContent(result);
        setView('results');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (error: any) {
      console.error(error);
      alert(`Failed to process request: ${error?.message || error}`);

    } finally {
      setLoading(false);
    }
  };

  // --- Views ---

  if (view === 'login' || view === 'signup') {
    return <SplashLoginScreen view={view} setView={setView} setUser={setUser} />;
  }


  if (view === 'theme-picker') {
    return (
      <ThemePickerScreen
        currentTheme={theme}
        onSelect={(t) => {
          setTheme(t);
          setView('home');
        }}
      />
    );
  }

  if (view === 'home') {
    const T = THEMES[theme];
    return (
      <div className="min-h-screen" style={{ background: T.colors.bgRadial }}>
        {/* Navbar */}
        <header className="sticky top-0 z-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: T.colors.navBg, backdropFilter: 'blur(20px)' }}>
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: T.colors.tabActive }}>
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-white">NotesCraft</span>
            </div>
            <div className="flex items-center gap-6">
              <nav className="hidden sm:flex items-center gap-1">
                <button 
                  onClick={() => setHomeTab('search')}
                  className="px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200"
                  style={homeTab === 'search' ? { background: `rgba(${T.colors.primaryRgb},0.2)`, color: T.colors.tabText } : { color: T.colors.subText }}
                >
                  Search & Upload
                </button>
                <button 
                  onClick={() => setHomeTab('profile')}
                  className="px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200"
                  style={homeTab === 'profile' ? { background: `rgba(${T.colors.primaryRgb},0.2)`, color: T.colors.tabText } : { color: T.colors.subText }}
                >
                  Profile
                </button>
              </nav>
              <div className="flex items-center gap-3">
                {/* Theme Switcher */}
                <div className="relative">
                  <button
                    onClick={() => setShowThemeSwitcher(v => !v)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: `rgba(${T.colors.primaryRgb},0.15)`, color: T.colors.tabText, border: `1px solid rgba(${T.colors.primaryRgb},0.25)` }}
                  >
                    <span>{T.emoji}</span> {T.name}
                  </button>
                  {showThemeSwitcher && (
                    <div
                      className="absolute right-0 top-10 rounded-xl overflow-hidden z-50 shadow-2xl"
                      style={{ background: 'rgba(10,5,25,0.97)', border: '1px solid rgba(255,255,255,0.08)', minWidth: 160 }}
                    >
                      {Object.values(THEMES).map(t => (
                        <button
                          key={t.id}
                          onClick={() => { setTheme(t.id); setShowThemeSwitcher(false); }}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors"
                          style={{
                            background: theme === t.id ? `rgba(${t.colors.primaryRgb},0.2)` : 'transparent',
                            color: theme === t.id ? t.colors.tabText : 'rgba(255,255,255,0.6)',
                          }}
                        >
                          <span>{t.emoji}</span> {t.name}
                          {theme === t.id && <span className="ml-auto text-xs">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="hidden items-center gap-2 sm:flex">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: `rgba(${T.colors.primaryRgb},0.2)`, color: T.colors.tabText }}>
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{user?.email}</span>
                </div>
                <button onClick={() => setView('login')} className="p-2 rounded-lg transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.colors.tabText)}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[100vw] sm:px-0 lg:px-0 py-0 flex-1 flex">
          {homeTab === 'search' ? (
            <div className="w-full relative bg-neutral-950 flex-1">
              <AnimatedAIChat onSubmit={handleChatSubmit} isProcessing={loading} />
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mx-auto max-w-2xl w-full p-6"
            >
              <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-6 mb-8">
                  <div className="h-24 w-24 rounded-full flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)', color: '#c4b5fd', border: '2px solid rgba(124,58,237,0.3)' }}>
                    <User className="h-12 w-12" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white max-w-[280px] truncate">{user?.email}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)' }}>Premium Learner</p>
                    <div className="mt-2 flex gap-2">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium" style={{ background: 'rgba(124,58,237,0.15)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.3)' }}>Student</span>
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium" style={{ background: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)' }}>Active Learner</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Study Stats</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl p-4" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                        <div className="text-2xl font-bold text-white">12</div>
                        <div className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Materials Generated</div>
                      </div>
                      <div className="rounded-xl p-4" style={{ background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)' }}>
                        <div className="text-2xl font-bold text-white">{masteredCards.size}</div>
                        <div className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Flashcards Mastered</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Recent Activity</h4>
                    <div className="space-y-3">
                      {[
                        { title: 'Quantum Mechanics Lecture 1', date: '2 hours ago', type: 'PDF' },
                        { title: 'Cell Biology Basics', date: 'Yesterday', type: 'YouTube' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="flex items-center gap-3">
                            {item.type === 'PDF' ? <FileText className="h-4 w-4" style={{ color: '#a78bfa' }} /> : <Youtube className="h-4 w-4 text-red-400" />}
                            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{item.title}</span>
                          </div>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {loading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(5,2,15,0.85)', backdropFilter: 'blur(12px)' }}>
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: 'rgba(167,139,250,0.3)', borderTopColor: 'transparent', borderRightColor: '#7c3aed' }}></div>
                </div>
                <h3 className="text-xl font-bold text-white">Analyzing Content...</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>Gemini is extracting key concepts and generating your study materials.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (view === 'results' && content) {
    const T = THEMES[theme];
    return (
      <div className="flex h-screen flex-col" style={{ background: T.colors.bgRadial }}>
        {/* Results Header */}
        <header className="px-4 py-3 sm:px-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: T.colors.navBg, backdropFilter: 'blur(20px)' }}>
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('home')} className="p-2 rounded-lg transition-colors" style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)' }}
                onMouseEnter={e => (e.currentTarget.style.background = `rgba(${T.colors.primaryRgb},0.2)`)}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: T.colors.tabActive }}>
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-white">{T.emoji} Study Materials</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
                onMouseEnter={e => (e.currentTarget.style.background = `rgba(${T.colors.primaryRgb},0.2)`)}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                <FileText className="h-4 w-4" />
                Print
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-4xl">
              {/* Tabs */}
              <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
                {[
                  { id: 'notes', label: 'Notes', icon: FileText },
                  { id: 'flashcards', label: 'Flashcards', icon: BrainCircuit },
                  { id: 'flowchart', label: 'Flowchart', icon: Layout },
                  { id: 'examprep', label: '1-Day Prep ⚡', icon: Zap },
                  { id: 'videos', label: 'Related Videos', icon: Youtube },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className="flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all"
                    style={activeTab === tab.id
                      ? { background: T.colors.tabActive, color: '#fff', boxShadow: `0 4px 16px ${T.colors.glow}` }
                      : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.07)' }
                    }
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'notes' && (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="rounded-2xl p-6 prose max-w-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.85)' }}>
                      <Markdown>{content.notes}</Markdown>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'flashcards' && (
                  <motion.div
                    key="flashcards"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <StudySession
                      cards={content.flashcards}
                      theme={THEMES[theme]}
                      isMastered={(id) => masteredCards.has(id)}
                      onToggleMastered={(id) => {
                        setMasteredCards(prev => {
                          const next = new Set(prev);
                          if (next.has(id)) next.delete(id);
                          else next.add(id);
                          return next;
                        });
                      }}
                      FlashcardGrid={
                        <div className="grid gap-6 sm:grid-cols-2">
                          {content.flashcards.map((card) => (
                            <FlashcardComponent
                              key={card.id}
                              card={card}
                              isMastered={masteredCards.has(card.id)}
                              onToggleMastered={() => {
                                setMasteredCards(prev => {
                                  const next = new Set(prev);
                                  if (next.has(card.id)) next.delete(card.id);
                                  else next.add(card.id);
                                  return next;
                                });
                              }}
                            />
                          ))}
                        </div>
                      }
                    />
                  </motion.div>
                )}


                {activeTab === 'flowchart' && (
                  <motion.div
                    key="flowchart"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div
                      className="rounded-2xl p-6 flex flex-col min-h-[500px]"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      {/* Header row */}
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Concept Flowchart</h3>
                        {/* Zoom controls */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs tabular-nums mr-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {Math.round(flowchartZoom * 100)}%
                          </span>
                          <button
                            onClick={() => setFlowchartZoom(z => Math.max(0.25, parseFloat((z - 0.25).toFixed(2))))}
                            title="Zoom out"
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-white font-bold text-lg transition-all"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.3)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                          >
                            −
                          </button>
                          <button
                            onClick={() => setFlowchartZoom(1)}
                            title="Reset zoom"
                            className="flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.3)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                          >
                            Reset
                          </button>
                          <button
                            onClick={() => setFlowchartZoom(z => Math.min(3, parseFloat((z + 0.25).toFixed(2))))}
                            title="Zoom in"
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-white font-bold text-lg transition-all"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.3)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Chart area with wheel-to-zoom */}
                      <div
                        className="flex-1 overflow-auto rounded-xl p-4"
                        style={{ background: 'rgba(255,255,255,0.025)' }}
                        onWheel={e => {
                          e.preventDefault();
                          setFlowchartZoom(z =>
                            Math.min(3, Math.max(0.25, parseFloat((z + (e.deltaY < 0 ? 0.1 : -0.1)).toFixed(2))))
                          );
                        }}
                      >
                        <div
                          style={{
                            transform: `scale(${flowchartZoom})`,
                            transformOrigin: 'top left',
                            transition: 'transform 0.18s ease',
                            width: `${100 / flowchartZoom}%`,
                          }}
                        >
                          <Mermaid chart={content.flowchartData || ''} />
                        </div>
                      </div>

                      <p className="mt-3 text-xs italic text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        Scroll on the chart to zoom · Use +/− buttons · Ctrl+scroll also works
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'examprep' && (
                  <motion.div
                    key="examprep"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="h-full"
                  >
                    <ExamPrepMode cards={content.flashcards} theme={THEMES[theme]} />
                  </motion.div>
                )}

                {activeTab === 'videos' && (
                  <motion.div
                    key="videos"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid gap-6 sm:grid-cols-2"
                  >
                    {content.relatedVideos.map((video, i) => (
                      <a 
                        key={i} 
                        href={video.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group"
                      >
                        <div className="overflow-hidden rounded-2xl transition-transform group-hover:-translate-y-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <img 
                            src={video.thumbnail} 
                            alt={video.title} 
                            className="h-40 w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="p-4">
                            <h4 className="font-bold text-white group-hover:text-violet-300 transition-colors">{video.title}</h4>
                            <div className="mt-2 flex items-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              <Youtube className="mr-1 h-4 w-4 text-red-400" />
                              Watch on YouTube
                              <ExternalLink className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: '#a78bfa' }} />
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>

          {/* Chatbot Sidebar */}
          <aside className="hidden w-80 lg:flex flex-col" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,5,25,0.7)', backdropFilter: 'blur(16px)' }}>
            <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 font-bold text-white">
                <MessageSquare className="h-5 w-5" style={{ color: '#a78bfa' }} />
                Study Assistant
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.length === 0 && (
                <div className="text-center py-8">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>
                    <BrainCircuit className="h-6 w-6" />
                  </div>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Ask me anything about your notes!</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.role === 'user' ? "ml-auto items-end" : "items-start"
                )}>
                  <div
                    className="rounded-2xl px-4 py-2 text-sm"
                    style={msg.role === 'user'
                      ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', borderRadius: '16px 16px 4px 16px' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px 16px 16px 4px' }
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleChat} className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="relative">
                <input 
                  placeholder="Ask a question..." 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 pr-10 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#a78bfa' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(167,139,250,0.5)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  style={{ color: '#a78bfa' }}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </aside>
        </div>
      </div>
    );
  }


  return null;
}

function FlashcardComponent({ 
  card, 
  isMastered, 
  onToggleMastered 
}: { 
  card: Flashcard; 
  isMastered: boolean;
  onToggleMastered: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="h-72 w-full perspective-1000"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="relative h-full w-full cursor-pointer preserve-3d"
        onClick={() => setFlipped(!flipped)}
        animate={{ 
          rotateY: flipped ? 180 : 0,
          scale: isHovered ? 1.02 : 1,
          y: isHovered ? -5 : 0
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <motion.div 
          className={cn(
            "absolute -inset-0.5 rounded-2xl blur-md opacity-30 transition-colors duration-500",
            isMastered ? "bg-emerald-500" : ""
          )}
          style={!isMastered ? { background: '#8100D1' } : {}}
          animate={{
            opacity: isHovered ? 0.6 : 0.3,
            scale: isHovered ? 1.05 : 1
          }}
        />

        <div className={cn(
            "absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6 text-center border backdrop-blur-xl shadow-2xl overflow-hidden",
            isMastered ? "bg-emerald-50/90 border-emerald-200/50" : "bg-white/90 border-slate-200/50"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: isMastered ? undefined : '#8100D1' }}
              {...(isMastered ? { className: 'text-xs font-bold uppercase tracking-wider text-emerald-500' } : {})}
            >Question</span>
            {isMastered && (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Mastered
              </span>
            )}
          </div>
          <p className="text-xl font-medium text-slate-800 leading-relaxed max-w-[90%]">
            {card.question}
          </p>
          <div className="absolute bottom-4 inset-x-0 flex justify-center">
            <div className={cn(
              "flex items-center text-sm font-semibold transition-all duration-300",
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
              isMastered ? "text-emerald-600" : ""
            )}
            style={!isMastered ? { color: '#8100D1' } : {}}
            >
              Click to reveal <ChevronRight className="ml-1 h-4 w-4" />
            </div>
          </div>
        </div>

        <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6 text-center border backdrop-blur-xl shadow-2xl overflow-hidden",
              isMastered ? "bg-emerald-50/90 border-emerald-200/50" : "bg-white/90"
            )}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              ...(!isMastered ? { borderColor: 'rgba(129,0,209,0.35)' } : {}),
            }}
          >

          <span
            className={"absolute top-4 left-4 text-xs font-bold uppercase tracking-wider" + (isMastered ? " text-emerald-500" : "")}
            style={!isMastered ? { color: '#8100D1' } : {}}
          >Answer</span>
          
          <div className="flex-1 flex items-center justify-center mt-6 mb-12 w-full overflow-y-auto">
            <p className="text-lg font-medium text-slate-700 leading-relaxed py-2 px-2">
              {card.answer}
            </p>
          </div>
          
          <div className="absolute bottom-4 inset-x-0 px-6 flex justify-center pb-2">
            <Button 
              size="default" 
              variant={isMastered ? "secondary" : "primary"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleMastered();
                if (!isMastered) {
                  confetti({
                    particleCount: 80,
                    spread: 60,
                    origin: { y: 0.8 },
                    colors: ['#10b981', '#34d399', '#6ee7b7']
                  });
                }
              }}
              className={cn(
                "h-10 text-xs w-full max-w-[200px] shadow-lg transition-transform active:scale-95 tracking-wide",
                isMastered 
                  ? "bg-white text-slate-600 border-slate-200 hover:bg-slate-50" 
                  : "text-white border-none"
              )}
              style={!isMastered ? { background: 'linear-gradient(135deg, #8100D1, #5b00a0)' } : {}}
            >
              {isMastered ? "Mark as Unmastered" : "Mark as Mastered"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
