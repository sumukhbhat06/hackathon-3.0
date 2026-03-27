export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface StudyContent {
  notes: string;
  flashcards: Flashcard[];
  flowchartData?: string; // Mermaid format
  relatedVideos: {
    title: string;
    url: string;
    thumbnail: string;
  }[];
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
