import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { DocumentChunk } from "@shared/schema";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Initialize OpenAI client just for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY=REMOVED  || '',
});

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Using OpenAI for embeddings as it's more established for this purpose
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error: any) {
    console.error("Error generating embedding:", error);
    throw new Error(`Failed to generate embedding: ${error.message || 'Unknown error'}`);
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

    // Create system prompt
    const systemPrompt = `You are an intelligent assistant helping users answer questions based on uploaded documents.
Answer the question as clearly as possible using only the provided document context.
If the answer is not found in the document context, say "I couldn't find information about that in your documents."
Format your answer to be reader-friendly, using bullet points or numbered lists when appropriate.`;

    // Create user prompt
    const userPrompt = `Here's the question: "${question}"
Here's the relevant context from the document:
${formattedChunks}`;

    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      temperature: 0.5,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ],
    });

    // Check if we have a text response
    if (response.content && response.content.length > 0 && 'text' in response.content[0]) {
      return response.content[0].text;
    }
    
    return "Sorry, I was unable to generate an answer.";
  } catch (error: any) {
    console.error("Error generating answer:", error);
    throw new Error(`Failed to generate answer: ${error.message || 'Unknown error'}`);
  }
}

// Split text into chunks
export function splitTextIntoChunks(
  text: string,
  maxChunkSize: number = 1000,
  overlap: number = 200
): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunkWords: string[] = [];
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
