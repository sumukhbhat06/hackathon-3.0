import { Flashcard, StudyContent } from "../types";
import { ThemeId } from "../themes/themes";

const MAX_CHARS = 60_000;

export async function generateStudyMaterials(
  content: string,
  type: 'pdf' | 'youtube',
  theme: ThemeId = 'normal'
): Promise<StudyContent> {
  const truncated = content.length > MAX_CHARS
    ? content.slice(0, MAX_CHARS) + '\n\n[Content truncated for processing...]'
    : content;

  const response = await fetch("/api/ai/study-materials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: truncated, type, theme })
  });

  if (!response.ok) {
    let serverMsg = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      serverMsg = errBody.error || errBody.message || serverMsg;
    } catch { /* ignore */ }
    throw new Error(serverMsg);
  }

  const data = await response.json();

  const flashcards: Flashcard[] = Array.isArray(data.flashcards)
    ? data.flashcards.map((f: any, i: number) => ({ ...f, id: String(i) }))
    : [];

  const relatedVideos = Array.isArray(data.relatedVideos)
    ? data.relatedVideos.map((v: any) => ({
        title: v.title,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(v.searchQuery || v.title)}`,
        thumbnail: `https://picsum.photos/seed/${encodeURIComponent(v.title)}/320/180`
      }))
    : [];

  return {
    notes: data.notes || '*(No notes generated)*',
    flashcards,
    flowchartData: data.flowchartData || '',
    relatedVideos
  };
}

export async function chatWithNotes(notes: string, history: {role: string, text: string}[], message: string) {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes, history, message })
  });

  if (!response.ok) {
    let serverMsg = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      serverMsg = errBody.error || errBody.message || serverMsg;
    } catch { /* ignore */ }
    throw new Error(serverMsg);
  }

  const data = await response.json();
  return data.text;
}
