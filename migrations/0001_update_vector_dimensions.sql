-- Drop existing vector column
ALTER TABLE "document_chunks" DROP COLUMN "embedding";

-- Recreate vector column with new dimensions
ALTER TABLE "document_chunks" ADD COLUMN "embedding" vector(768); 