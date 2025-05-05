import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AppLayout from "@/components/layout/AppLayout";
import HomePage from "@/pages/home";
import DocumentsPage from "@/pages/documents";
import AnswerDetailPage from "@/pages/answer-detail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/documents" component={DocumentsPage} />
      <Route path="/answers/:id" component={AnswerDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppLayout>
          <Router />
        </AppLayout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
