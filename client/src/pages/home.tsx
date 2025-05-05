import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DocumentsList from "@/components/documents/DocumentList";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  sources?: any[];
  answerId?: string;
}

const HomePage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: "I'm your document assistant. Upload documents and ask me questions about them. I'll analyze your files and provide accurate answers based on their content."
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle sending a question
  const handleSendQuestion = (question: string, response: any) => {
    // Add the user message
    setMessages(prev => [
      ...prev,
      { role: "user", content: question }
    ]);
    
    setIsProcessing(true);
    
    // Simulate delay for processing
    setTimeout(() => {
      // Add the assistant's response
      setMessages(prev => [
        ...prev,
        { 
          role: "assistant", 
          content: response.answer,
          sources: response.contexts?.map(context => ({
            filename: response.document?.filename || "Document",
            fileType: response.document?.fileType || "unknown",
            page: context.pageNumber,
            content: context.content
          })),
          answerId: response.id
        }
      ]);
      setIsProcessing(false);
    }, 500);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Upload & Ask Questions</h1>
        <p className="text-gray-600 mt-2">Upload documents and ask questions to get AI-powered answers.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload and Recent Documents Section */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upload and Documents sections */}
          <DocumentsList view="recent" showUpload={true} />
        </div>

        {/* Q&A Section */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Ask Questions About Your Documents</h2>
              <p className="text-sm text-gray-600 mt-1">Get instant AI-powered answers based on your uploaded files.</p>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6" style={{ maxHeight: "500px" }}>
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                  sources={message.sources}
                  answerId={message.answerId}
                />
              ))}
              
              {isProcessing && (
                <div className="flex justify-center">
                  <div className="bg-primary-50 text-primary-600 text-sm px-4 py-2 rounded-md animate-pulse">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Question Input Area */}
            <div className="p-4 border-t border-gray-200">
              <ChatInput onSend={handleSendQuestion} isLoading={isProcessing} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
