import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";

interface ChatInputProps {
  onSend: (question: string, response: any) => void;
  isLoading: boolean;
}

const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [question, setQuestion] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim() || isLoading) {
      return;
    }
    
    try {
      // Send the question to the API
      const response = await apiRequest("POST", "/api/ask-question", { question });
      
      // Pass the question and response to the parent component
      onSend(question, await response.json());
      
      // Clear the input
      setQuestion("");
    } catch (error) {
      console.error("Error asking question:", error);
      // You could handle errors here or pass them to the parent
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center">
      <Input
        type="text"
        placeholder="Ask a question about your documents..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="flex-1 py-2 px-4 block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 text-sm"
        disabled={isLoading}
      />
      <Button 
        type="submit" 
        className="ml-3 inline-flex items-center"
        disabled={!question.trim() || isLoading}
      >
        <Send className="h-5 w-5 mr-1" />
        {isLoading ? "Processing..." : "Ask"}
      </Button>
    </form>
  );
};

export default ChatInput;
