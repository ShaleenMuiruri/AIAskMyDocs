import OpenAI from "openai";
import { DocumentChunk } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY=REMOVED  || '',
});

// Generate embeddings for text
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

// Generate answer from question and context
export async function generateAnswer(
  question: string,
  contextChunks: DocumentChunk[]
): Promise<string> {
  try {
    // Format chunks for prompt
    const formattedChunks = contextChunks
      .map((chunk, index) => {
        const pageInfo = chunk.pageNumber ? ` (page ${chunk.pageNumber})` : '';
        return `Context ${index + 1}${pageInfo}:\n${chunk.content}\n`;
      })
      .join("\n");

    // Create prompt
    const prompt = `
You are an intelligent assistant helping users answer questions based on uploaded documents.
Here's the question: "${question}"
Here's the relevant context from the document:
${formattedChunks}

Answer the question as clearly as possible using only the document.
If the answer is not found in the document, say "I couldn't find information about that in your documents."
Format your answer to be reader-friendly, using bullet points or numbered lists when appropriate.
`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an AI assistant specialized in answering questions about documents." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "Sorry, I was unable to generate an answer.";
  } catch (error) {
    console.error("Error generating answer:", error);
    throw new Error(`Failed to generate answer: ${error.message}`);
  }
}

// Split text into chunks
export function splitTextIntoChunks(
  text: string,
  maxChunkSize: number = 1000,
  overlap: number = 200
): string[] {
  const words = text.split(/\s+/);
  const chunks = [];
  let currentChunkWords = [];
  let currentChunkSize = 0;

  for (const word of words) {
    currentChunkWords.push(word);
    currentChunkSize += word.length + 1; // +1 for the space

    if (currentChunkSize >= maxChunkSize) {
      chunks.push(currentChunkWords.join(' '));
      const overlapWords = currentChunkWords.slice(-Math.floor(overlap / 5)); // approximate word count for overlap
      currentChunkWords = [...overlapWords];
      currentChunkSize = overlapWords.join(' ').length;
    }
  }

  if (currentChunkWords.length > 0) {
    chunks.push(currentChunkWords.join(' '));
  }

  return chunks;
}
