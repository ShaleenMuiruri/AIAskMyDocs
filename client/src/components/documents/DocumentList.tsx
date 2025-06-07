import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2 } from "lucide-react";
import DocumentItem from "./DocumentItem";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/ui/file-upload";
import { Document } from "@shared/schema";

interface DocumentsListProps {
  view?: "recent" | "full";
  limit?: number;
  showUpload?: boolean;
}

const DocumentsList = ({ view = "full", limit = 3, showUpload = false }: DocumentsListProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const { 
    data: documents, 
    isLoading, 
    error, 
    refetch
  } = useQuery<Document[]>({ 
    queryKey: ['/api/documents'],
    // Let the queryClient handle the fetching consistently with proper error handling
  });


  // Handle document upload completion
  const handleUploadComplete = () => {
    setIsUploading(false);
    refetch();
  };

  // Handle document upload start
  const handleUploadStart = () => {
    setIsUploading(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">Error loading documents: {error.message}</p>
      </div>
    );
  }

  const displayedDocuments = view === "recent" && documents ? documents.slice(0, limit) : documents;
  const hasDocuments = displayedDocuments && displayedDocuments.length > 0;

  return (
    <div className="space-y-6">
      {showUpload && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Upload Documents</h2>
          <FileUpload 
            onUploadComplete={handleUploadComplete}
            onUploadStart={handleUploadStart}
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {view === "recent" ? "Recent Documents" : "All Documents"}
          </h2>
          {view === "recent" && hasDocuments && (
            <a href="/documents" className="text-primary-600 text-sm font-medium hover:text-primary-700">
              View All
            </a>
          )}
        </div>

        {isUploading && (
          <div className="flex items-center justify-center p-4 mb-4 bg-blue-50 rounded-md">
            <Loader2 className="animate-spin h-5 w-5 mr-2 text-primary-600" />
            <p className="text-primary-600">Uploading and processing document...</p>
          </div>
        )}

        {hasDocuments ? (
          <div className="space-y-3">
            {displayedDocuments.map((doc: Document) => (
              <DocumentItem key={doc.id} document={doc} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
            <p className="mt-1 text-sm text-gray-500">
              {showUpload 
                ? "Upload a document to get started" 
                : "No documents have been uploaded yet"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsList;
