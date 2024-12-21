import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import QuizList from "@/components/quiz/QuizList";
import CreateQuizDialog from "@/components/quiz/CreateQuizDialog";

const Dashboard = () => {
  const session = useSession();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["quizzes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out successfully",
    });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <header className="container py-4">
          <nav className="flex items-center justify-between">
            <div className="text-xl font-semibold text-primary">QuizMaster</div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session?.user.email}
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          </nav>
        </header>
      </div>
      
      <main className="container py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">My Quizzes</h1>
            <CreateQuizDialog />
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">Loading quizzes...</div>
          ) : (
            <QuizList quizzes={quizzes || []} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;