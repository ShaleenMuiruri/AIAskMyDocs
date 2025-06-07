import { OpenAI } from "openai";
import { DocumentChunk } from "@shared/schema";

// Initialize Anthropic client
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY || '',
});

// Generate embeddings for text using OpenAI
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
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

    // Using OpenAI model for text generation
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here's the question: "${question}"
Here's the relevant context from the document:
${formattedChunks}` }
      ],
    });

    // Check if we have a response
    if (response.choices && response.choices.length > 0 && response.choices[0].message.content) {
      return response.choices[0].message.content;
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