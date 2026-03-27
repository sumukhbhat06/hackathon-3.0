import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || "",
  defaultHeaders: {
    "HTTP-Referer": "https://ais-dev.run.app",
    "X-Title": "NotesCraft Study AI",
  }
});

// Theme-specific prompt styles
const THEME_STYLES: Record<string, string> = {
  normal: "Use clear, structured academic language. Use markdown headers, bullet points, and concise explanations.",

  anime: `You are a dramatic ONE PIECE-style narrator teaching this content as if it were a shonen manga!

**NOTES STYLE:**
- Write notes like Luffy's crew discovering a new island — every concept is an adventure
- Use One Piece analogies: concepts are "Devil Fruits" granting special powers, hard topics are "The Grand Line" to conquer, foundational ideas are "the Will of D.", key rules are "Haki training"
- Structure sections with: "⚡ Nakama Knowledge:" (key facts), "🌊 Grand Line Challenge:" (complex topics), "💀 Final Boss Concept:" (the hardest idea), "🔥 Gear Second Mode:" (advanced insight)
- Make it feel like leveling up toward becoming King of the Pirates (or in this case, King of the Exam Hall!)

**FLASHCARD Q&A STYLE (most important):**
- Questions must be phrased like Zoro challenging you: "Oi! State the rule of [concept] or walk the plank!"
  OR like Nami demanding: "Listen carefully! What is [concept]? Get it wrong and I'll charge you 1 million berries!"
  OR like Sanji declaring: "This is the secret ingredient of [topic] — what is it?!"
- Answers must start with a dramatic confirmation like: "YOHOHOHO! The answer is..." or "GOMU GOMU NO... [answer]!" or "That's the power of [concept]:" then explain clearly
- Sprinkle in One Piece references: Berries (currency), Devil Fruits (superpowers), nakama (crew/friends), Log Pose (guide), Sea Kings (dangerous topics)
- End each answer with an encouraging line like "You're one step closer to the One Piece!" or "Luffy would be proud, nakama!"`,

  movies: `You are a DHURANDHAR 2 Bollywood heist director narrating this content as the greatest intellectual heist ever planned!

**NOTES STYLE:**
- Frame the entire subject as a high-stakes heist being planned by a genius mastermind (like the lead from Dhurandhar 2)
- Structure sections as heist planning stages:
  "🎬 The Brief:" (introduction/overview)
  "🗺️ The Blueprint:" (key concepts laid out)
  "🤝 The Crew:" (supporting concepts/terms)
  "⚠️ The Risk:" (common mistakes or hard topics)
  "💎 The Vault:" (the most important concept — the prize)
  "🏆 Heist Complete:" (summary/conclusion)
- Write like a slick Bollywood screenplay — sharp, witty, dramatic reveals

**FLASHCARD Q&A STYLE (most important):**
- Questions must sound like the mastermind testing his crew before the big heist:
  "Beta, ek baar bata — what is [concept]? Galat jawab diya toh plan fail ho jayega!"
  OR "Inspector sahab aa rahe hain! Quick — describe [topic] in one line!"
  OR "The vault is locked by [concept]. What's the combination?"
- Answers must open with a slick Dhurandhar reveal:
  "Suno dhyan se — the answer is [X]." or "Plan B activate! Here's the truth about [concept]:"
  OR "Exactly jaise scene mein hota hai — [concept] means..."
- End answers with lines like: "Heist successful! 🎯" or "Ek dum perfect plan, boss!" or "Ranveer would approve! 🎬"
- Hindi-English mix (Hinglish) is strongly preferred for the authentic Dhurandhar 2 feel`,
};


const app = express();
app.use(express.json({ limit: '100mb' }));

// Study materials — theme-aware
app.post("/api/ai/study-materials", async (req, res) => {
  const { content, type, theme = 'normal' } = req.body;
  const promptStyle = THEME_STYLES[theme] || THEME_STYLES.normal;

  try {
    const response = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "system",
          content: `You are a study material generator that ALWAYS responds with a valid JSON object.
Your response must contain exactly these keys: "notes", "flashcards", "flowchartData", "relatedVideos".
Do NOT wrap the JSON in markdown code fences. Do NOT add any text before or after the JSON object.

CONTENT STYLE TO APPLY TO ALL OUTPUT:
${promptStyle}`
        },
        {
          role: "user",
          content: `Analyze the following ${type === 'pdf' ? 'lecture notes' : 'video transcript/content'}:

${content}

Generate study materials in JSON with this exact structure:
{
  "notes": "<comprehensive notes in Markdown, styled per system instructions>",
  "flashcards": [{"question": "<styled question>", "answer": "<styled answer>"}],
  "flowchartData": "graph TD\\n  A[\\"Concept A\\"] --> B[\\"Concept B\\"]",
  "relatedVideos": [{"title": "<title>", "searchQuery": "<search query>"}]
}

Requirements:
- notes: at least 300 words in Markdown with headers and bullets
- flashcards: 5-10 Q&A pairs, styled according to the system instructions
- flowchartData: valid Mermaid graph TD syntax. IMPORTANT: ALL node labels MUST be in double quotes like A["Node Name"] to avoid syntax errors with special characters like brackets or parentheses. Output ONLY the graph definition.
- relatedVideos: exactly 5 items`
        }
      ],
      response_format: { type: "json_object" }
    });


    const raw = response.choices[0].message.content || "{}";
    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      const stripped = raw.replace(/^```(json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      try {
        result = JSON.parse(stripped);
      } catch {
        console.error("JSON parse failed. Raw content:", raw.slice(0, 500));
        return res.status(502).json({ error: 'AI returned invalid JSON. Try again or use a shorter document.' });
      }
    }
    res.json(result);
  } catch (error: any) {
    const detail = error?.response?.data || error?.message || String(error);
    console.error("OpenRouter Error:", detail);
    res.status(500).json({ error: typeof detail === 'string' ? detail : JSON.stringify(detail) });
  }
});

app.post("/api/ai/chat", async (req, res) => {
  const { notes, history, message } = req.body;
  try {
    const response = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "system",
          content: `You are a helpful study assistant. Use the following notes as your primary reference to answer the user's questions. If the answer isn't in the notes, use your general knowledge but mention it's not in the provided material.
          
          NOTES:
          ${notes}`
        },
        ...history.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text
        })),
        { role: "user", content: message }
      ]
    });

    res.json({ text: response.choices[0].message.content });
  } catch (error: any) {
    const detail = error?.response?.data || error?.message || String(error);
    console.error("OpenRouter Error:", detail);
    res.status(500).json({ error: typeof detail === 'string' ? detail : JSON.stringify(detail) });
  }
});

// For local development only, Vite handles serving index.html in Vercel production
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

// In standard production environments (like locally), we listen. 
// Vercel instead calls this via serverless functions handler.
if (process.env.VERCEL !== "1") {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
