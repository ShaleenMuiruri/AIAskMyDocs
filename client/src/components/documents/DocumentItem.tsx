import { useState } from "react";
import { FileText, FileIcon, Trash2Icon, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Document = {
  id: string;
  filename: string;
  fileType: string;
  s3Url: string;
  createdAt: Date | string;
  status: 'processing' | 'ready' | 'failed';
};

interface DocumentItemProps {
  document: Document;
  view?: "list" | "table";
}

const DocumentItem = ({ document: initialDocument, view = "list" }: DocumentItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Fetch and subscribe to document updates
  const queryOptions: UseQueryOptions<Document, Error, Document> = {
    queryKey: ['/api/documents', initialDocument.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/documents/${initialDocument.id}`);
      const data = await response.json() as Document;
      // Convert createdAt string to Date if needed
      if (typeof data.createdAt === 'string') {
        data.createdAt = new Date(data.createdAt);
      }
      return data;
    },
    initialData: initialDocument,
    refetchInterval: (query) => {
      const data = query.state.data as Document | undefined;
      return data?.status === 'processing' ? 2000 : false;
    },
  };

  const { data } = useQuery(queryOptions);
  // We can safely assert non-null here because we have initialData
  const document = data!;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      // Optimistically update the UI
      queryClient.setQueryData<Document[]>(['/api/documents'], (old) => 
        old?.filter(d => d.id !== document.id) ?? []
      );
      
      await apiRequest('DELETE', `/api/documents/${document.id}`);
      
      // Invalidate documents query
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
      toast({
        title: "Document deleted",
        description: `${document.filename} has been deleted.`,
      });
    } catch (error) {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: (error as Error).message || "An error occurred while deleting the document.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getFileIcon = () => {
    switch (document.fileType) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'txt':
        return <FileText className="h-5 w-5 text-gray-500" />;
      default:
        return <FileIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (document.status) {
      case 'ready':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Ready</span>;
      case 'processing':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 animate-pulse">Processing</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Failed</span>;
      default:
        return null;
    }
  };

  const timeAgo = formatDistanceToNow(
    typeof document.createdAt === 'string' ? new Date(document.createdAt) : document.createdAt,
    { addSuffix: true }
  );

  if (view === "table") {
    return (
      <tr>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            {getFileIcon()}
            <span className="text-sm font-medium text-gray-900 ml-3">{document.filename}</span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-sm text-gray-600">{document.fileType?.toUpperCase()}</span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-sm text-gray-600">{timeAgo}</span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {getStatusBadge()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <div className="flex space-x-3">
            <button 
              className="text-primary-600 hover:text-primary-800"
              onClick={() => { /* View functionality */ }}
            >
              View
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-red-600 hover:text-red-800">
                  Delete
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Document</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{document.filename}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </td>
      </tr>
    );
  }

  // List view
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
      <div className="flex items-center">
        {getFileIcon()}
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">{document.filename}</p>
          <p className="text-xs text-gray-500">
            {document.fileType?.toUpperCase()} • Uploaded {timeAgo}
          </p>
        </div>
      </div>
      {getStatusBadge()}
    </div>
  );
};

export default DocumentItem;
