import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { uploadFileToS3, getSignedDownloadUrl, deleteFileFromS3, getFileFromS3 } from "./s3";
import { generateEmbedding, generateAnswer, splitTextIntoChunks } from "./ai";
import { questionSchema } from "@shared/schema";
import { z } from "zod";
import * as mammoth from "mammoth";
import { ZodError } from "zod";

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  
  // Upload document
  app.post("/api/upload", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const file = req.file;
      const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
      
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: "Invalid file type. Only PDF, DOCX, and TXT files are allowed." });
      }

      // Map MIME types to file types
      const fileTypeMap: Record<string, string> = {
        "application/pdf": "pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "text/plain": "txt",
      };
      
      const fileType = fileTypeMap[file.mimetype];
      
      // Upload file to S3
      const s3Url = await uploadFileToS3(file.buffer, file.originalname, file.mimetype);
      
      // Create document record
      const document = await storage.createDocument({
        filename: file.originalname,
        fileType,
        s3Url,
        status: "processing",
      });

      // Process document asynchronously
      processDocument(document.id, file.buffer, fileType, file.mimetype).catch(err => {
        console.error(`Error processing document ${document.id}:`, err);
        storage.updateDocumentStatus(document.id, "failed");
      });

      return res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      return res.status(500).json({ message: `Error uploading document: ${error.message}` });
    }
  });

  // Get all documents
  app.get("/api/documents", async (req: Request, res: Response) => {
    try {
      const documents = await storage.getAllDocuments();
      return res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      return res.status(500).json({ message: `Error fetching documents: ${error.message}` });
    }
  });

  // Get document by ID
  app.get("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const document = await storage.getDocument(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      return res.json(document);
    } catch (error) {
      console.error(`Error fetching document ${req.params.id}:`, error);
      return res.status(500).json({ message: `Error fetching document: ${error.message}` });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const document = await storage.getDocument(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Delete file from S3
      await deleteFileFromS3(document.s3Url);
      
      // Delete document from database
      await storage.deleteDocument(req.params.id);
      
      return res.json({ success: true });
    } catch (error) {
      console.error(`Error deleting document ${req.params.id}:`, error);
      return res.status(500).json({ message: `Error deleting document: ${error.message}` });
    }
  });

  // Ask a question
  app.post("/api/ask-question", async (req: Request, res: Response) => {
    try {
      // Validate question
      const { question } = questionSchema.parse(req.body);
      
      // Generate embedding for the question
      const questionEmbedding = await generateEmbedding(question);
      
      // Find relevant document chunks
      const similarChunks = await storage.searchSimilarChunks(questionEmbedding, 5);
      
      if (similarChunks.length === 0) {
        return res.json({
          answer: "I couldn't find any relevant information in your documents to answer that question.",
          documentId: null,
          contexts: []
        });
      }
      
      // Get the document ID from the first chunk
      const documentId = similarChunks[0].documentId;
      
      // Generate answer
      const answer = await generateAnswer(question, similarChunks);
      
      // Store the answer
      const savedAnswer = await storage.createAnswer({
        question,
        answer,
        documentId,
      });
      
      // Store the contexts used for the answer
      for (const chunk of similarChunks) {
        await storage.createAnswerContext({
          answerId: savedAnswer.id,
          chunkId: chunk.id,
        });
      }
      
      // Get the document
      const document = await storage.getDocument(documentId);
      
      return res.json({
        id: savedAnswer.id,
        question,
        answer,
        document,
        contexts: similarChunks
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid question format", errors: error.errors });
      }
      
      console.error("Error processing question:", error);
      return res.status(500).json({ message: `Error processing question: ${error.message}` });
    }
  });

  // Get answer by ID
  app.get("/api/answers/:id", async (req: Request, res: Response) => {
    try {
      const answer = await storage.getAnswer(req.params.id);
      
      if (!answer) {
        return res.status(404).json({ message: "Answer not found" });
      }
      
      // Get the document
      const document = await storage.getDocument(answer.documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Associated document not found" });
      }
      
      // Get answer contexts
      const answerContexts = await storage.getAnswerContexts(answer.id);
      
      // Get the actual chunks
      const chunkIds = answerContexts.map(context => context.chunkId);
      const chunks = [];
      
      for (const chunkId of chunkIds) {
        const [chunk] = await storage.searchSimilarChunks([0], 1);
        if (chunk) {
          chunks.push(chunk);
        }
      }
      
      return res.json({
        ...answer,
        document,
        contexts: chunks
      });
    } catch (error) {
      console.error(`Error fetching answer ${req.params.id}:`, error);
      return res.status(500).json({ message: `Error fetching answer: ${error.message}` });
    }
  });

  // Get recent answers
  app.get("/api/recent-answers", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const answers = await storage.getRecentAnswers(limit);
      return res.json(answers);
    } catch (error) {
      console.error("Error fetching recent answers:", error);
      return res.status(500).json({ message: `Error fetching recent answers: ${error.message}` });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Process uploaded document
async function processDocument(documentId: string, fileBuffer: Buffer, fileType: string, mimeType: string): Promise<void> {
  try {
    let extractedText = "";
    let chunks = [];
    
    // Extract text based on file type
    if (fileType === "pdf") {
      extractedText = await extractPdfText(fileBuffer);
    } else if (fileType === "docx") {
      extractedText = await extractDocxText(fileBuffer);
    } else if (fileType === "txt") {
      extractedText = fileBuffer.toString("utf-8");
    }
    
    // Split text into chunks
    chunks = splitTextIntoChunks(extractedText);
    
    // Generate embeddings and store chunks
    for (const [index, chunk] of chunks.entries()) {
      const embedding = await generateEmbedding(chunk);
      
      await storage.createDocumentChunk({
        documentId,
        content: chunk,
        pageNumber: `${Math.floor(index / 2) + 1}`,
        embedding,
      });
    }
    
    // Update document status
    await storage.updateDocumentStatus(documentId, "ready");
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);
    await storage.updateDocumentStatus(documentId, "failed");
    throw error;
  }
}

// Extract text from PDF
async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  try {
    // Dynamically import pdf-parse to avoid startup issues
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error: any) {
    console.error("Error extracting PDF text:", error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

// Extract text from DOCX
async function extractDocxText(docxBuffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: docxBuffer });
    return result.value;
  } catch (error) {
    console.error("Error extracting DOCX text:", error);
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
}
