import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DocumentItem from "@/components/documents/DocumentItem";
import FileUpload from "@/components/ui/file-upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DocumentsPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const { 
    data: documents, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({ 
    queryKey: ['/api/documents'] 
  });

  // Handle document upload completion
  const handleUploadComplete = () => {
    setIsUploading(false);
    refetch();
    setIsDialogOpen(false);
  };

  // Handle document upload start
  const handleUploadStart = () => {
    setIsUploading(true);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Documents</h1>
        <p className="text-gray-600 mt-2">Manage your uploaded documents and see their processing status.</p>
      </header>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">All Documents</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-5 w-5 mr-1" />
                Upload New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
              </DialogHeader>
              <FileUpload 
                onUploadComplete={handleUploadComplete}
                onUploadStart={handleUploadStart}
              />
              {isUploading && (
                <div className="flex items-center justify-center p-4 mt-4 bg-blue-50 rounded-md">
                  <Loader2 className="animate-spin h-5 w-5 mr-2 text-primary-600" />
                  <p className="text-primary-600">Uploading and processing document...</p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">
            Error loading documents: {error.message}
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <DocumentItem key={doc.id} document={doc} view="table" />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">No documents found. Upload a document to get started.</p>
          </div>
        )}
        
        {/* Pagination would go here */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              {documents && documents.length > 0 && (
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{documents.length}</span> of <span className="font-medium">{documents.length}</span> results
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
