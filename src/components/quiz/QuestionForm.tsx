import { useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { QuestionFormProps, QuestionData } from "./types";
import { useQuestionFormState } from "./useQuestionFormState";
import { handleQuestionSubmit } from "./questionFormHandlers";
import { QuestionOptions } from "./QuestionOptions";

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
      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('question_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('question_images')
        .getPublicUrl(filePath);

      // Call the Edge Function to generate question
      const { data, error } = await supabase.functions.invoke('generate-question', {
        body: { imageUrl: publicUrl }
      });

      if (error) throw error;

      console.log('Processed questions:', data);

      // Handle the response - we expect an array with one question
      if (Array.isArray(data) && data.length > 0) {
        const generatedQuestion = data[0];
        updateQuestionState({
          questionText: generatedQuestion.questionText,
          referenceText: generatedQuestion.referenceText || '',
          solutionText: generatedQuestion.solutionText || '',
          options: generatedQuestion.options.map((opt: any) => ({
            option_text: opt.text,
            is_correct: opt.isCorrect
          }))
        });

        toast({
          title: "Question generated successfully",
        });
      } else {
        throw new Error('Invalid response format from question generation');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Failed to generate question",
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
          <Label>Upload Image to Generate Question</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="questionText">Question Text</Label>
          <Textarea
            id="questionText"
            value={questionState.questionText}
            onChange={(e) => updateQuestionState({ questionText: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="referenceText">Reference Text (Optional)</Label>
          <Textarea
            id="referenceText"
            value={questionState.referenceText}
            onChange={(e) => updateQuestionState({ referenceText: e.target.value })}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="solutionText">Solution Text (Optional)</Label>
          <Textarea
            id="solutionText"
            value={questionState.solutionText}
            onChange={(e) => updateQuestionState({ solutionText: e.target.value })}
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