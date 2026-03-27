export type ThemeId = 'normal' | 'anime' | 'movies';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  emoji: string;
  tagline: string;
  colors: {
    primary: string;
    primaryDark: string;
    primaryRgb: string;      // for rgba() usage
    glow: string;
    accent: string;
    bg: string;
    bgRadial: string;
    navBg: string;
    cardBg: string;
    cardBorder: string;
    tabActive: string;
    tabText: string;
    text: string;
    subText: string;
  };
  flashcard: {
    glowColor: string;
    labelColor: string;
    borderColor: string;
    buttonGradient: string;
    hintColor: string;
  };
  font?: string;
  /** AI prompt prefix injected into the study-materials prompt */
  promptStyle: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  normal: {
    id: 'normal',
    name: 'Normal',
    emoji: '📚',
    tagline: 'Classic academic style',
    colors: {
      primary: '#8100D1',
      primaryDark: '#5b00a0',
      primaryRgb: '129,0,209',
      glow: 'rgba(129,0,209,0.45)',
      accent: '#c4b5fd',
      bg: '#000000',
      bgRadial: 'radial-gradient(ellipse at 30% 0%, #0d0721 0%, #000000 70%)',
      navBg: 'rgba(10,5,25,0.85)',
      cardBg: 'rgba(255,255,255,0.04)',
      cardBorder: 'rgba(255,255,255,0.07)',
      tabActive: 'linear-gradient(135deg,#8100D1,#5b00a0)',
      tabText: '#c4b5fd',
      text: '#ffffff',
      subText: 'rgba(255,255,255,0.45)',
    },
    flashcard: {
      glowColor: '#8100D1',
      labelColor: '#8100D1',
      borderColor: 'rgba(129,0,209,0.35)',
      buttonGradient: 'linear-gradient(135deg,#8100D1,#5b00a0)',
      hintColor: '#8100D1',
    },
    promptStyle: 'Use clear, structured academic language. Use markdown headers, bullet points, and concise explanations.',
  },

  anime: {
    id: 'anime',
    name: 'Anime',
    emoji: '⛩️',
    tagline: 'Learn like a shonen protagonist!',
    colors: {
      primary: '#FF2D9B',
      primaryDark: '#c4006a',
      primaryRgb: '255,45,155',
      glow: 'rgba(255,45,155,0.5)',
      accent: '#00D4FF',
      bg: '#0a0010',
      bgRadial: 'radial-gradient(ellipse at 30% 0%, #1a0030 0%, #0a0010 70%)',
      navBg: 'rgba(15,0,20,0.9)',
      cardBg: 'rgba(255,45,155,0.05)',
      cardBorder: 'rgba(255,45,155,0.2)',
      tabActive: 'linear-gradient(135deg,#FF2D9B,#00D4FF)',
      tabText: '#FF2D9B',
      text: '#ffffff',
      subText: 'rgba(255,255,255,0.5)',
    },
    flashcard: {
      glowColor: '#FF2D9B',
      labelColor: '#FF2D9B',
      borderColor: 'rgba(255,45,155,0.4)',
      buttonGradient: 'linear-gradient(135deg,#FF2D9B,#00D4FF)',
      hintColor: '#00D4FF',
    },
    font: "'Bangers', 'Impact', cursive",
    promptStyle: `Rewrite the study content in an ANIME / MANGA style! Rules:
- Make it dramatic and exciting, like a shonen anime narrator
- Use anime tropes: "power levels", "training arcs", "final boss concepts"
- Flashcard questions should sound like quiz challenges from a sensei to their student
- Use exclamation marks and dramatic language
- Reference anime/manga themes when explaining concepts
- Make learning feel like leveling up in an RPG
- Use terms like "Power Unlocked:", "Training Arc:", "Boss Concept:" for structure`,
  },

  movies: {
    id: 'movies',
    name: 'Movies',
    emoji: '🎬',
    tagline: 'Lights, camera, learn!',
    colors: {
      primary: '#F5C518',
      primaryDark: '#c49a00',
      primaryRgb: '245,197,24',
      glow: 'rgba(245,197,24,0.4)',
      accent: '#E8E8E8',
      bg: '#050505',
      bgRadial: 'radial-gradient(ellipse at 30% 0%, #1a1200 0%, #050505 70%)',
      navBg: 'rgba(5,5,5,0.95)',
      cardBg: 'rgba(245,197,24,0.04)',
      cardBorder: 'rgba(245,197,24,0.15)',
      tabActive: 'linear-gradient(135deg,#F5C518,#c49a00)',
      tabText: '#F5C518',
      text: '#ffffff',
      subText: 'rgba(255,255,255,0.5)',
    },
    flashcard: {
      glowColor: '#F5C518',
      labelColor: '#F5C518',
      borderColor: 'rgba(245,197,24,0.35)',
      buttonGradient: 'linear-gradient(135deg,#F5C518,#c49a00)',
      hintColor: '#F5C518',
    },
    promptStyle: `Rewrite the study content in a CINEMATIC / MOVIE style! Rules:
- Frame everything like a film synopsis or movie review
- Use cinematic language: "Scene 1:", "Plot Twist:", "Director's Note:", "The Climax:"
- Flashcard questions should feel like a film trivia challenge or plot-point test
- Reference famous movie techniques: foreshadowing, plot twists, character arcs
- Explain concepts the way a film director would — through story and visuals
- Use "Cut to:", "Fade in:", "Roll credits:" as section markers
- Make it feel like learning is watching the greatest film ever made`,
  },
};

export const DEFAULT_THEME = THEMES.normal;
