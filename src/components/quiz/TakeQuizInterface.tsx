import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer } from "./Timer";
import { QuizQuestion } from "./QuizQuestion";

interface TakeQuizInterfaceProps {
  quiz: any;
  questions: any[];
  responseId: string;
}

export const TakeQuizInterface = ({ quiz, questions, responseId }: TakeQuizInterfaceProps) => {
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);
  const [tabSwitches, setTabSwitches] = useState(0);

  // Initialize shuffled questions
  useEffect(() => {
    const shuffled = quiz.shuffle_questions
      ? [...questions].sort(() => Math.random() - 0.5)
      : questions;
    setShuffledQuestions(shuffled.slice(0, quiz.questions_per_quiz || questions.length));
  }, [questions, quiz.shuffle_questions, quiz.questions_per_quiz]);

  // Handle tab visibility change
  useEffect(() => {
    if (!quiz.prevent_tab_switch) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1);
        if (tabSwitches >= 2) {
          await handleSubmit();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [quiz.prevent_tab_switch, tabSwitches]);

  // Prevent inspection and keyboard shortcuts
  useEffect(() => {
    if (!quiz.prevent_inspection) return;

    const preventInspect = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault();
      }
    };

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", preventInspect);
    window.addEventListener("contextmenu", preventContextMenu);

    return () => {
      window.removeEventListener("keydown", preventInspect);
      window.removeEventListener("contextmenu", preventContextMenu);
    };
  }, [quiz.prevent_inspection]);

  const handleAnswer = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmit = async () => {
    try {
      // Update response with tab switches
      await supabase
        .from("responses")
        .update({ tab_switches: tabSwitches })
        .eq("id", responseId);

      // Save all answers
      const answerPromises = Object.entries(answers).map(([questionId, optionId]) => {
        return supabase
          .from("response_details")
          .insert({
            response_id: responseId,
            question_id: questionId,
            selected_option_id: optionId
          });
      });

      await Promise.all(answerPromises);

      // Mark response as completed
      await supabase
        .from("responses")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", responseId);

      // Send email if enabled
      if (quiz.email_enabled) {
        await supabase.functions.invoke("send-quiz-email", {
          body: { responseId }
        });
      }

      toast({
        title: "Quiz submitted successfully",
      });

      navigate("/");
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast({
        title: "Failed to submit quiz",
        variant: "destructive",
      });
    }
  };

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  if (!currentQuestion) return null;

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500">
          Question {currentQuestionIndex + 1} of {shuffledQuestions.length}
        </div>
        <Timer
          duration={quiz.time_duration}
          onTimeUp={handleSubmit}
        />
      </div>

      <Card className="p-6">
        <QuizQuestion
          question={currentQuestion}
          selectedOption={answers[currentQuestion.id]}
          onSelectOption={(optionId) => handleAnswer(currentQuestion.id, optionId)}
        />

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          {currentQuestionIndex === shuffledQuestions.length - 1 ? (
            <Button onClick={handleSubmit}>Submit Quiz</Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(shuffledQuestions.length - 1, prev + 1))}
            >
              Next
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};