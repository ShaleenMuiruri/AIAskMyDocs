import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { FileText, Home, MessageSquare, MenuIcon, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const isMobile = useIsMobile();
  const [isNavOpen, setIsNavOpen] = useState(!isMobile);
  const [location] = useLocation();

  // Close nav on mobile when changing routes
  useEffect(() => {
    if (isMobile) {
      setIsNavOpen(false);
    }
  }, [location, isMobile]);

  // Handle window resize
  useEffect(() => {
    setIsNavOpen(!isMobile);
  }, [isMobile]);

  // Fetch recent answers
  const { data: recentAnswers = [] } = useQuery<any[]>({
    queryKey: ['/api/recent-answers'],
    enabled: !isMobile || isNavOpen, // Only fetch when needed
  });

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Sidebar Navigation */}
      <nav className="bg-white md:w-64 w-full border-r border-gray-200 md:h-screen flex-shrink-0">
        <div className="p-4 flex justify-between items-center md:justify-start">
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-primary-600" />
            <h1 className="text-xl font-bold text-gray-900">AskMyDocs</h1>
          </div>
          <button 
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="md:hidden p-2 rounded-md hover:bg-gray-100"
          >
            {isNavOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
        
        <div className={`${isNavOpen ? 'block' : 'hidden'} md:block`}>
          <div className="px-4 py-2">
            <div className="py-2 text-sm font-medium text-gray-600">MAIN</div>
            <ul>
              <li>
                <Link href="/">
                  <a className={`flex items-center px-4 py-2 rounded-md ${
                    location === "/" 
                      ? "text-primary-600 bg-primary-50" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}>
                    <Home className="h-5 w-5 mr-3" />
                    Home
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/documents">
                  <a className={`flex items-center px-4 py-2 rounded-md ${
                    location === "/documents" 
                      ? "text-primary-600 bg-primary-50" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}>
                    <FileText className="h-5 w-5 mr-3" />
                    My Documents
                  </a>
                </Link>
              </li>
            </ul>
          </div>
          
          {recentAnswers && recentAnswers.length > 0 && (
            <div className="px-4 py-2">
              <div className="py-2 text-sm font-medium text-gray-600">RECENT ANSWERS</div>
              <ul>
                {recentAnswers.map((answer) => (
                  <li key={answer.id}>
                    <Link href={`/answers/${answer.id}`}>
                      <a className={`flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md`}>
                        <MessageSquare className="h-5 w-5 mr-3" />
                        {answer.question.length > 25 
                          ? `${answer.question.substring(0, 25)}...` 
                          : answer.question}
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
