import { useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { QuestionFormProps } from "./types";
import { useQuestionFormState } from "./useQuestionFormState";
import { handleQuestionSubmit } from "./questionFormHandlers";
import { QuestionOptions } from "./QuestionOptions";
import RichTextEditor from "./RichTextEditor";

const QuestionForm = ({ quizId, onQuestionCreated, onClose }: QuestionFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const { questionState, updateQuestionState, resetForm } = useQuestionFormState();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      console.log('Processed questions:', data);

      // Handle multiple questions
      if (Array.isArray(data) && data.length > 0) {
        // Create all questions sequentially
        for (const question of data) {
          await handleQuestionSubmit({
            questionState: {
              questionText: question.questionText,
              referenceText: question.referenceText || '',
              solutionText: question.solutionText || '',
              options: question.options.map((opt: any) => ({
                option_text: opt.text,
                is_correct: opt.isCorrect
              }))
            },
            quizId,
            supabase,
            toast,
          });
        }

        toast({
          title: `${data.length} questions generated successfully`,
        });
        
        resetForm();
        onQuestionCreated?.();
        onClose?.();
      }
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleQuestionSubmit({
      questionState,
      quizId,
      supabase,
      toast,
      onSuccess: () => {
        resetForm();
        onQuestionCreated?.();
        onClose?.();
      },
    });
  };

  return (
    <Card className="p-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Upload Image to Generate Questions</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="questionText">Question Text</Label>
          <RichTextEditor
            value={questionState.questionText}
            onChange={(value) => updateQuestionState({ questionText: value })}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="referenceText">Reference Text (Optional)</Label>
          <RichTextEditor
            value={questionState.referenceText}
            onChange={(value) => updateQuestionState({ referenceText: value })}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="solutionText">Solution Text (Optional)</Label>
          <RichTextEditor
            value={questionState.solutionText}
            onChange={(value) => updateQuestionState({ solutionText: value })}
            disabled={isLoading}
          />
        </div>

        <QuestionOptions
          options={questionState.options}
          onOptionsChange={(newOptions) => updateQuestionState({ options: newOptions })}
          isLoading={isLoading}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Question"
            )}
          </Button>
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
};

export default QuestionForm;