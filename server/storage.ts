import { 
  documents, 
  documentChunks, 
  answers, 
  answerContexts,
  type Document, 
  type InsertDocument, 
  type DocumentChunk, 
  type InsertDocumentChunk,
  type Answer,
  type InsertAnswer,
  type AnswerContext,
  type InsertAnswerContext
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Document operations
  createDocument(insertDoc: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  updateDocumentStatus(id: string, status: 'processing' | 'ready' | 'failed'): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;
  
  // Document chunk operations
  createDocumentChunk(insertChunk: InsertDocumentChunk): Promise<DocumentChunk>;
  getDocumentChunks(documentId: string): Promise<DocumentChunk[]>;
  
  // Vector search
  searchSimilarChunks(embedding: number[], limit: number): Promise<DocumentChunk[]>;

  // Answer operations
  createAnswer(insertAnswer: InsertAnswer): Promise<Answer>;
  getAnswer(id: string): Promise<Answer | undefined>;
  getRecentAnswers(limit: number): Promise<Answer[]>;
  getAnswersByDocumentId(documentId: string): Promise<Answer[]>;
  
  // Answer context operations
  createAnswerContext(insertContext: InsertAnswerContext): Promise<AnswerContext>;
  getAnswerContexts(answerId: string): Promise<AnswerContext[]>;
}

export class DatabaseStorage implements IStorage {
  // Document operations
  async createDocument(insertDoc: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDoc)
      .returning();
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    return document;
  }

  async getAllDocuments(): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .orderBy(desc(documents.createdAt));
  }

  async updateDocumentStatus(id: string, status: 'processing' | 'ready' | 'failed'): Promise<Document | undefined> {
    const [document] = await db
      .update(documents)
      .set({ status })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const [deleted] = await db
      .delete(documents)
      .where(eq(documents.id, id))
      .returning();
    return !!deleted;
  }

  // Document chunk operations
  async createDocumentChunk(insertChunk: InsertDocumentChunk): Promise<DocumentChunk> {
    const [chunk] = await db
      .insert(documentChunks)
      .values(insertChunk)
      .returning();
    return chunk;
  }

  async getDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
    return await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.documentId, documentId));
  }

  // Vector search
  async searchSimilarChunks(embedding: number[], limit: number): Promise<DocumentChunk[]> {
    const result = await db.execute(sql`
      SELECT * FROM ${documentChunks}
      ORDER BY embedding <-> ${JSON.stringify(embedding)}::vector
      LIMIT ${limit}
    `);
    return result as DocumentChunk[];
  }

  // Answer operations
  async createAnswer(insertAnswer: InsertAnswer): Promise<Answer> {
    const [answer] = await db
      .insert(answers)
      .values(insertAnswer)
      .returning();
    return answer;
  }

  async getAnswer(id: string): Promise<Answer | undefined> {
    const [answer] = await db
      .select()
      .from(answers)
      .where(eq(answers.id, id));
    return answer;
  }

  async getRecentAnswers(limit: number): Promise<Answer[]> {
    return await db
      .select()
      .from(answers)
      .orderBy(desc(answers.createdAt))
      .limit(limit);
  }

  async getAnswersByDocumentId(documentId: string): Promise<Answer[]> {
    return await db
      .select()
      .from(answers)
      .where(eq(answers.documentId, documentId))
      .orderBy(desc(answers.createdAt));
  }

  // Answer context operations
  async createAnswerContext(insertContext: InsertAnswerContext): Promise<AnswerContext> {
    const [context] = await db
      .insert(answerContexts)
      .values(insertContext)
      .returning();
    return context;
  }

  async getAnswerContexts(answerId: string): Promise<AnswerContext[]> {
    return await db
      .select()
      .from(answerContexts)
      .where(eq(answerContexts.answerId, answerId));
  }
}

export const storage = new DatabaseStorage();
