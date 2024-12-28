import { useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import { QuestionFormProps } from "./types";
import { useQuestionFormState } from "./useQuestionFormState";
import { handleQuestionSubmit } from "./questionFormHandlers";
import ManualQuestionForm from "./ManualQuestionForm";
import GeneratedQuestionCard from "./GeneratedQuestionCard";

const QuestionForm = ({ quizId, onQuestionCreated, onClose }: QuestionFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [showManualForm, setShowManualForm] = useState(false);
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { questionState, updateQuestionState, resetForm } = useQuestionFormState();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGeneratedQuestions([]);
    setShowManualForm(false);
    resetForm();

    setIsLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('question_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('question_images')
        .getPublicUrl(filePath);

      const { data, error } = await supabase.functions.invoke('generate-question', {
        body: { imageUrl: publicUrl }
      });

      if (error) throw error;

      setGeneratedQuestions(data.map((q: any) => ({
        ...q,
        referenceText: q.referenceText || '',
        solutionText: q.solutionText || '',
      })));

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Failed to generate questions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await handleQuestionSubmit({
        questionState,
        quizId,
        supabase,
        toast,
        onSuccess: () => {
          resetForm();
          setShowManualForm(false);
          queryClient.invalidateQueries({ queryKey: ["questions", quizId] });
          onQuestionCreated?.();
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setIsLoading(true);
    try {
      const questionsToSave = generatedQuestions.map(question => ({
        questionText: question.questionText,
        referenceText: question.referenceText,
        solutionText: question.solutionText,
        options: question.options.map((opt: any) => ({
          option_text: opt.text,
          is_correct: opt.isCorrect
        }))
      }));

      for (const question of questionsToSave) {
        await handleQuestionSubmit({
          questionState: question,
          quizId,
          supabase,
          toast,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["questions", quizId] });
      toast({
        title: `${questionsToSave.length} questions saved successfully`,
      });
      
      setGeneratedQuestions([]);
      resetForm();
      onQuestionCreated?.();
      onClose?.();
    } catch (error) {
      console.error('Error saving questions:', error);
      toast({
        title: "Failed to save questions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label>Upload Image to Generate Questions</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isLoading}
              className="mt-1"
            />
          </div>
          <Button
            onClick={() => setShowManualForm(!showManualForm)}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Manual Question
          </Button>
        </div>

        {showManualForm && (
          <ManualQuestionForm
            questionState={questionState}
            updateQuestionState={updateQuestionState}
            isLoading={isLoading}
            onSubmit={handleManualSubmit}
            onCancel={() => setShowManualForm(false)}
          />
        )}

        {generatedQuestions.length > 0 && (
          <div className="space-y-4">
            {generatedQuestions.map((question, index) => (
              <GeneratedQuestionCard
                key={index}
                question={question}
                index={index}
                isLoading={isLoading}
                onQuestionChange={(index, updatedQuestion) => {
                  const newQuestions = [...generatedQuestions];
                  newQuestions[index] = updatedQuestion;
                  setGeneratedQuestions(newQuestions);
                }}
              />
            ))}

            <div className="flex gap-2">
              <Button 
                onClick={handleSaveAll} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save All Questions"
                )}
              </Button>
              {onClose && (
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default QuestionForm;