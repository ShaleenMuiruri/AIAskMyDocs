import { MessageSquare, Zap, User } from "lucide-react";
import { format } from "date-fns";

interface ChatMessageProps {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: string;
  sources?: {
    filename: string;
    fileType: string;
    page?: string;
    content: string;
  }[];
  answerId?: string;
}

const ChatMessage = ({ role, content, timestamp, sources, answerId }: ChatMessageProps) => {
  const isUser = role === "user";
  const isSystem = role === "system";
  
  return (
    <div className={`flex items-start ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="flex-shrink-0 bg-primary-100 rounded-full p-2">
          {isSystem ? (
            <Zap className="h-6 w-6 text-primary-600" />
          ) : (
            <MessageSquare className="h-6 w-6 text-primary-600" />
          )}
        </div>
      )}
      
      <div className={`${isUser ? "mr-3 bg-primary-600 text-white" : "ml-3 bg-gray-100 text-gray-800"} rounded-lg p-4 max-w-3xl`}>
        {/* Format the content with proper markdown/formatting */}
        <div className="prose prose-sm">
          {content.split("\n").map((line, i) => {
            // Handle bullet points
            if (line.trim().startsWith("•") || line.trim().startsWith("-") || line.trim().match(/^\d+\./)) {
              return <p key={i} className="mb-1">{line}</p>;
            }
            return line ? <p key={i} className="mb-1">{line}</p> : <br key={i} />;
          })}
        </div>
        
        {/* Source references */}
        {sources && sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">Sources:</p>
            <ul className="mt-1 space-y-1">
              {sources.map((source, index) => (
                <li key={index} className="text-xs">
                  <span className="text-gray-500">
                    {source.filename}
                    {source.page && ` (page ${source.page})`}
                  </span>
                </li>
              ))}
            </ul>
            {answerId && (
              <a href={`/answers/${answerId}`} className="text-xs text-primary-600 hover:underline block mt-1">
                View full answer with context
              </a>
            )}
          </div>
        )}
      </div>
      
      {isUser && (
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
            <User className="h-6 w-6 text-gray-600" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
