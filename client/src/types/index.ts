// Document types
export interface Document {
  id: string;
  filename: string;
  fileType: string;
  s3Url: string;
  createdAt: string;
  status: 'processing' | 'ready' | 'failed';
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  pageNumber?: string;
  embedding?: number[];
  createdAt: string;
}

// Answer types
export interface Answer {
  id: string;
  question: string;
  answer: string;
  documentId: string;
  createdAt: string;
  document?: Document;
  contexts?: DocumentChunk[];
}

// Chat types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
  answerId?: string;
  sources?: {
    filename: string;
    fileType: string;
    page?: string;
    content: string;
  }[];
}

// API Responses
export interface AskQuestionResponse {
  id: string;
  question: string;
  answer: string;
  document: Document;
  contexts: DocumentChunk[];
}
