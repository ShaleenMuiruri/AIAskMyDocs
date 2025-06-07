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
    console.log("🔍 Searching for similar chunks with embedding length:", embedding.length);
    
    const result = await db.execute(sql`
      SELECT 
        id,
        document_id as "documentId",
        content,
        page_number as "pageNumber",
        embedding,
        created_at as "createdAt"
      FROM ${documentChunks}
      ORDER BY embedding <-> ${JSON.stringify(embedding)}::vector
      LIMIT ${limit}
    `);
    
    console.log("📊 Query result details:", {
      rowCount: result.rowCount,
      fields: result.fields?.map(f => ({ name: f.name })),
      firstRow: result.rows?.[0] ? {
        keys: Object.keys(result.rows[0]),
        values: Object.entries(result.rows[0]).map(([key, value]) => ({
          key,
          value: typeof value,
          sample: typeof value === 'string' ? value.substring(0, 50) : value
        }))
      } : null
    });
    
    if (!result.rows || result.rows.length === 0) {
      console.log("⚠️ No chunks found in the database");
      return [];
    }
    
    // Parse the result into DocumentChunk objects
    const chunks = result.rows.map((row, index) => {
      console.log(`📝 Processing row ${index + 1}:`, {
        rawRow: row,
        documentId: row.documentId,
        document_id: row.document_id,
        hasDocumentId: 'documentId' in row,
        hasDocument_id: 'document_id' in row
      });
      
      const chunk = {
        id: row.id,
        documentId: row.documentId || row.document_id, // Try both camelCase and snake_case
        content: row.content,
        pageNumber: row.pageNumber || row.page_number, // Try both camelCase and snake_case
        embedding: row.embedding,
        createdAt: row.createdAt || row.created_at // Try both camelCase and snake_case
      };
      
      console.log(`✅ Parsed chunk ${index + 1}:`, chunk);
      return chunk;
    }) as DocumentChunk[];
    
    console.log("✅ Final parsed chunks:", chunks.map(c => ({
      id: c.id,
      documentId: c.documentId,
      contentLength: c.content.length
    })));
    return chunks;
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
