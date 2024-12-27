import { useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import { QuestionFormProps } from "./types";
import { useQuestionFormState } from "./useQuestionFormState";
import { handleQuestionSubmit } from "./questionFormHandlers";
import { QuestionOptions } from "./QuestionOptions";
import RichTextEditor from "./RichTextEditor";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const QuestionForm = ({ quizId, onQuestionCreated, onClose }: QuestionFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [showManualForm, setShowManualForm] = useState(false);
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
      for (const question of generatedQuestions) {
        await handleQuestionSubmit({
          questionState: {
            questionText: question.questionText,
            referenceText: question.referenceText,
            solutionText: question.solutionText,
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
        title: `${generatedQuestions.length} questions saved successfully`,
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

  const updateGeneratedQuestion = (index: number, updates: any) => {
    setGeneratedQuestions(prev => 
      prev.map((q, i) => i === index ? { ...q, ...updates } : q)
    );
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
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Question Text</Label>
              <RichTextEditor
                value={questionState.questionText}
                onChange={(value) => updateQuestionState({ questionText: value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Reference Text (Optional)</Label>
              <RichTextEditor
                value={questionState.referenceText}
                onChange={(value) => updateQuestionState({ referenceText: value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Solution Text (Optional)</Label>
              <RichTextEditor
                value={questionState.solutionText}
                onChange={(value) => updateQuestionState({ solutionText: value })}
                disabled={isLoading}
              />
            </div>

            <QuestionOptions
              options={questionState.options}
              onOptionsChange={(options) => updateQuestionState({ options })}
              isLoading={isLoading}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Question"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowManualForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {generatedQuestions.length > 0 && (
          <>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {generatedQuestions.map((question, index) => (
                <AccordionItem key={index} value={`question-${index}`}>
                  <AccordionTrigger>Question {index + 1}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Question Text</Label>
                        <RichTextEditor
                          value={question.questionText}
                          onChange={(value) => updateGeneratedQuestion(index, { questionText: value })}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Reference Text (Optional)</Label>
                        <RichTextEditor
                          value={question.referenceText}
                          onChange={(value) => updateGeneratedQuestion(index, { referenceText: value })}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Solution Text (Optional)</Label>
                        <RichTextEditor
                          value={question.solutionText}
                          onChange={(value) => updateGeneratedQuestion(index, { solutionText: value })}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Options</Label>
                        {question.options.map((option: any, optIndex: number) => (
                          <div key={optIndex} className="flex gap-2">
                            <div className="flex-1">
                              <RichTextEditor
                                value={option.text}
                                onChange={(value) => {
                                  const newOptions = [...question.options];
                                  newOptions[optIndex] = { ...option, text: value };
                                  updateGeneratedQuestion(index, { options: newOptions });
                                }}
                                disabled={isLoading}
                              />
                            </div>
                            <Button
                              type="button"
                              variant={option.isCorrect ? "default" : "outline"}
                              onClick={() => {
                                const newOptions = question.options.map((opt: any, i: number) => ({
                                  ...opt,
                                  isCorrect: i === optIndex,
                                }));
                                updateGeneratedQuestion(index, { options: newOptions });
                              }}
                              disabled={isLoading}
                            >
                              Correct
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

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
          </>
        )}
      </div>
    </Card>
  );
};

export default QuestionForm;