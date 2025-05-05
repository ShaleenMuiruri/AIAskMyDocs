import { useState, useRef } from "react";
import { UploadCloud } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onUploadComplete: (document: any) => void;
  onUploadStart: () => void;
}

const FileUpload = ({ onUploadComplete, onUploadStart }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const uploadFiles = async (files: FileList) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Only PDF, DOCX, and TXT files are allowed.",
          variant: "destructive",
        });
        continue;
      }
      
      // Check file size
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Maximum file size is 50MB.",
          variant: "destructive",
        });
        continue;
      }
      
      try {
        setIsUploading(true);
        onUploadStart();
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        const document = await response.json();
        
        toast({
          title: "File uploaded",
          description: `${file.name} has been uploaded successfully.`,
        });
        
        onUploadComplete(document);
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description: error.message || "An error occurred during upload.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
        isDragging ? "border-primary-400 bg-primary-50" : "border-gray-300 hover:bg-gray-50"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleButtonClick}
    >
      <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">Drag and drop files here, or click to browse</p>
      <p className="mt-1 text-xs text-gray-500">PDF, DOCX, TXT (max 50MB)</p>
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
      />
      <Button 
        variant="default" 
        className="mt-4"
        disabled={isUploading}
        onClick={(e) => {
          e.stopPropagation();
          handleButtonClick();
        }}
      >
        {isUploading ? "Uploading..." : "Browse Files"}
      </Button>
    </div>
  );
};

export default FileUpload;
