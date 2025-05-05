import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";

const AnswerDetailPage = () => {
  const [match, params] = useRoute("/answers/:id");
  const answerId = params?.id;

  const { 
    data: answerData, 
    isLoading, 
    error 
  } = useQuery({ 
    queryKey: [`/api/answers/${answerId}`],
    enabled: !!answerId
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (error || !answerData) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <a className="inline-flex items-center text-primary-600 hover:text-primary-800">
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to Home
            </a>
          </Link>
        </div>
        <div className="bg-red-50 p-6 rounded-lg text-red-800">
          <h2 className="text-xl font-semibold mb-2">Error Loading Answer</h2>
          <p>{error?.message || "The answer could not be loaded."}</p>
        </div>
      </div>
    );
  }

  const { answer, question, document, contexts, createdAt } = answerData;
  const formattedDate = createdAt ? format(new Date(createdAt), 'MMMM d, yyyy') : 'Unknown date';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/">
          <a className="inline-flex items-center text-primary-600 hover:text-primary-800">
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Home
          </a>
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Answer Detail</h1>
        <p className="text-gray-600 mt-2">View the complete answer with source context from your documents.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-primary-100 rounded-full p-2">
                  <FileText className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{question}</h2>
                  <p className="text-sm text-gray-500 mt-1">Asked on {formattedDate}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">AI-Generated Answer</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="prose prose-sm text-gray-800">
                    {answer.split("\n").map((line, i) => {
                      // Handle bullet points
                      if (line.trim().startsWith("•") || line.trim().startsWith("-") || line.trim().match(/^\d+\./)) {
                        return <p key={i} className="mb-1">{line}</p>;
                      }
                      return line ? <p key={i} className="mb-1">{line}</p> : <br key={i} />;
                    })}
                  </div>
                </div>
              </div>

              {contexts && contexts.length > 0 && (
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">Source Context</h3>
                  <div className="space-y-4">
                    {contexts.map((context, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <FileText className="h-5 w-5 text-red-500 mr-2" />
                              <span className="text-sm font-medium">{document?.filename || "Document"}</span>
                            </div>
                            {context.pageNumber && <span className="text-xs text-gray-500">Page {context.pageNumber}</span>}
                          </div>
                        </div>
                        <div className="p-4 bg-white">
                          <p className="text-sm text-gray-800">
                            {context.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Document Source</h3>
              {document && (
                <div className="flex items-center p-3 bg-gray-50 rounded-md">
                  <FileText className="h-10 w-10 text-red-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{document.filename}</p>
                    <p className="text-xs text-gray-500">
                      {document.fileType.toUpperCase()} • Uploaded {document.createdAt ? format(new Date(document.createdAt), 'MMM d, yyyy') : 'recently'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Related questions section would go here - requires implementation of related questions feature */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnswerDetailPage;
