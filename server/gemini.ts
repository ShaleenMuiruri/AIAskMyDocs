import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { DocumentChunk } from "@shared/schema";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// List available models and their supported methods
export async function listAvailableModels() {
  try {
    // Note: The listModels method is not directly available in the current version
    // We'll use the models we know are available
    const availableModels = [
      {
        name: "embedding-001",
        displayName: "Embedding Model",
        description: "Model for generating embeddings",
        supportedGenerationMethods: ["embedContent"]
      },
      {
        name: "gemini-1.0-pro",
        displayName: "Gemini Pro",
        description: "Model for text generation",
        supportedGenerationMethods: ["generateContent"]
      }
    ];
    
    console.log("📋 Available Gemini models:", availableModels);
    return availableModels;
  } catch (error: any) {
    console.error("Error listing models:", error);
    throw new Error(`Failed to list models: ${error.message || 'Unknown error'}`);
  }
}

// Generate embeddings for text using Gemini
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(text);
    
    return result.embedding.values;
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

    // Using Gemini model for text generation (free tier)
    console.log("🤖 Initializing Gemini model...");
    const model: GenerativeModel = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
    
    const prompt = `${systemPrompt}

Here's the question: "${question}"

Here's the relevant context from the document:
${formattedChunks}`;

    console.log("🤖 Generating answer using Gemini model:", {
      modelName: "gemini-1.0-pro",
      questionLength: question.length,
      contextChunksCount: contextChunks.length,
      totalContextLength: formattedChunks.length,
      apiKey: process.env.GEMINI_API_KEY ? "Set" : "Not set"
    });

    try {
      console.log("🤖 Calling generateContent...");
      const result = await model.generateContent(prompt);
      console.log("✅ Content generated, getting response...");
      const response = await result.response;
      const text = response.text();

      if (text) {
        console.log("✅ Answer generated successfully");
        return text;
      }
      
      console.log("⚠️ No text in response");
      return "Sorry, I was unable to generate an answer.";
    } catch (generateError: any) {
      console.error("Error in generateContent:", {
        error: generateError,
        message: generateError.message,
        status: generateError.status,
        details: generateError.details
      });
      throw generateError;
    }
  } catch (error: any) {
    console.error("Error generating answer:", {
      error,
      message: error.message,
      status: error.status,
      details: error.details
    });
    throw new Error(`Failed to generate answer: ${error.message || 'Unknown error'}`);
  }
}

// Split text into chunks (keeping the same implementation as it's model-agnostic)
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