import { pgTable, text, serial, uuid, timestamp, pgEnum, vector } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enum for document status
export const documentStatusEnum = pgEnum('document_status', ['processing', 'ready', 'failed']);

// Table to store documents
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  s3Url: text("s3_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: documentStatusEnum("status").default('processing').notNull(),
});

// Document relations
export const documentsRelations = relations(documents, ({ many }) => ({
  chunks: many(documentChunks),
  answers: many(answers),
}));

// Table to store document chunks with embeddings
export const documentChunks = pgTable("document_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  content: text("content").notNull(),
  pageNumber: text("page_number"),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Document chunks relations
export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, {
    fields: [documentChunks.documentId],
    references: [documents.id],
  }),
}));

// Table to store questions and answers
export const answers = pgTable("answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Answer relations
export const answersRelations = relations(answers, ({ one, many }) => ({
  document: one(documents, {
    fields: [answers.documentId],
    references: [documents.id],
  }),
  contexts: many(answerContexts),
}));

// Table to store answer contexts (chunks used to generate answers)
export const answerContexts = pgTable("answer_contexts", {
  id: uuid("id").defaultRandom().primaryKey(),
  answerId: uuid("answer_id").references(() => answers.id, { onDelete: 'cascade' }).notNull(),
  chunkId: uuid("chunk_id").references(() => documentChunks.id, { onDelete: 'cascade' }).notNull(),
});

// Answer contexts relations
export const answerContextsRelations = relations(answerContexts, ({ one }) => ({
  answer: one(answers, {
    fields: [answerContexts.answerId],
    references: [answers.id],
  }),
  chunk: one(documentChunks, {
    fields: [answerContexts.chunkId],
    references: [documentChunks.id],
  }),
}));

// Insert schemas
export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentChunkSchema = createInsertSchema(documentChunks).omit({
  id: true,
  createdAt: true,
});

export const insertAnswerSchema = createInsertSchema(answers).omit({
  id: true,
  createdAt: true,
});

export const insertAnswerContextSchema = createInsertSchema(answerContexts).omit({
  id: true,
});

// Select schemas
export const selectDocumentSchema = createSelectSchema(documents);
export const selectDocumentChunkSchema = createSelectSchema(documentChunks);
export const selectAnswerSchema = createSelectSchema(answers);
export const selectAnswerContextSchema = createSelectSchema(answerContexts);

// Question schema
export const questionSchema = z.object({
  question: z.string().min(1, "Question is required"),
});

// Export types
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type InsertDocumentChunk = z.infer<typeof insertDocumentChunkSchema>;
export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type AnswerContext = typeof answerContexts.$inferSelect;
export type InsertAnswerContext = z.infer<typeof insertAnswerContextSchema>;
export type Question = z.infer<typeof questionSchema>;
