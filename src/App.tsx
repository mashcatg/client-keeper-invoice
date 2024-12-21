import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import QuizConfig from "./pages/QuizConfig";
import QuizQuestions from "./pages/QuizQuestions";
import QuizResponses from "./pages/QuizResponses";
import TakeQuiz from "./pages/TakeQuiz";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SessionContextProvider supabaseClient={supabase}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Index />} />
            <Route path="/quiz/:id/take" element={<TakeQuiz />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:id/config"
              element={
                <ProtectedRoute>
                  <QuizConfig />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:id/questions"
              element={
                <ProtectedRoute>
                  <QuizQuestions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:id/responses"
              element={
                <ProtectedRoute>
                  <QuizResponses />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SessionContextProvider>
  </QueryClientProvider>
);

export default App;