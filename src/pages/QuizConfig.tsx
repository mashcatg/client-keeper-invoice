import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

const QuizConfig = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const updateQuizMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase
        .from("quizzes")
        .update(values)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz", id] });
      toast({
        title: "Quiz settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update quiz settings",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;

    updateQuizMutation.mutate(quiz);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!quiz) {
    return <div>Quiz not found</div>;
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
          <h1 className="text-2xl font-bold">{quiz.title} - Configuration</h1>
        </header>
      </div>

      <main className="container py-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Marks per Question</Label>
                <Input
                  type="number"
                  value={quiz.marks_per_question}
                  onChange={(e) =>
                    updateQuizMutation.mutate({
                      ...quiz,
                      marks_per_question: parseFloat(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Label>Negative Marks</Label>
                <Input
                  type="number"
                  value={quiz.negative_marks}
                  onChange={(e) =>
                    updateQuizMutation.mutate({
                      ...quiz,
                      negative_marks: parseFloat(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Label>Questions per Quiz</Label>
                <Input
                  type="number"
                  value={quiz.questions_per_quiz}
                  onChange={(e) =>
                    updateQuizMutation.mutate({
                      ...quiz,
                      questions_per_quiz: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Label>Time Duration (minutes)</Label>
                <Input
                  type="number"
                  value={Math.floor(quiz.time_duration / 60)}
                  onChange={(e) =>
                    updateQuizMutation.mutate({
                      ...quiz,
                      time_duration: parseInt(e.target.value) * 60,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Shuffle Questions</Label>
                <Switch
                  checked={quiz.shuffle_questions}
                  onCheckedChange={(checked) =>
                    updateQuizMutation.mutate({
                      ...quiz,
                      shuffle_questions: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Available Now</Label>
                <Switch
                  checked={quiz.is_available}
                  onCheckedChange={(checked) =>
                    updateQuizMutation.mutate({
                      ...quiz,
                      is_available: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Multiple Attempts Allowed</Label>
                <Switch
                  checked={quiz.multiple_attempts}
                  onCheckedChange={(checked) =>
                    updateQuizMutation.mutate({
                      ...quiz,
                      multiple_attempts: checked,
                    })
                  }
                />
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default QuizConfig;