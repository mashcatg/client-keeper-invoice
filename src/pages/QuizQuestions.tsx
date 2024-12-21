import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Image } from "lucide-react";
import QuestionForm from "@/components/quiz/QuestionForm";
import QuestionList from "@/components/quiz/QuestionList";

const QuizQuestions = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const { data: questions, isLoading } = useQuery({
    queryKey: ["questions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select(`
          *,
          options (*)
        `)
        .eq("quiz_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <header className="container py-4">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Questions</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
              <Button variant="outline">
                <Image className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
            </div>
          </div>
        </header>
      </div>

      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          {showForm && (
            <QuestionForm
              quizId={id!}
              onClose={() => setShowForm(false)}
            />
          )}
          <QuestionList questions={questions || []} />
        </div>
      </main>
    </div>
  );
};

export default QuizQuestions;