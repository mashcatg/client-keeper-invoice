import { useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";

interface QuestionFormProps {
  quizId: string;
  onQuestionCreated?: () => void;
  onClose?: () => void;  // Added this prop
}

const QuestionForm = ({ quizId, onQuestionCreated, onClose }: QuestionFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [solutionText, setSolutionText] = useState("");
  const [options, setOptions] = useState([
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
  ]);
  const supabase = useSupabaseClient();
  const { toast } = useToast();

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

      // Generate question using the Edge Function
      const response = await fetch('/api/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: publicUrl })
      });

      if (!response.ok) throw new Error('Failed to generate question');

      const questionData = await response.json();

      // Update form with generated data
      setQuestionText(questionData.questionText);
      setReferenceText(questionData.referenceText);
      setSolutionText(questionData.solutionText);
      setOptions(questionData.options.map((opt: any) => ({
        option_text: opt.text,
        is_correct: opt.isCorrect
      })));

      toast({
        title: "Question generated successfully",
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setIsLoading(true);
    try {
      // Insert question
      const { data: questionData, error: questionError } = await supabase
        .from("questions")
        .insert([
          {
            quiz_id: quizId,
            question_text: questionText,
            reference_text: referenceText,
            solution_text: solutionText,
          },
        ])
        .select()
        .single();

      if (questionError) throw questionError;

      // Insert options
      const { error: optionsError } = await supabase.from("options").insert(
        options.map((option) => ({
          question_id: questionData.id,
          option_text: option.option_text,
          is_correct: option.is_correct,
        }))
      );

      if (optionsError) throw optionsError;

      toast({
        title: "Question created successfully",
      });

      // Reset form
      setQuestionText("");
      setReferenceText("");
      setSolutionText("");
      setOptions([
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
      ]);

      onQuestionCreated?.();
      onClose?.();  // Call onClose after successful submission
    } catch (error) {
      console.error("Error creating question:", error);
      toast({
        title: "Failed to create question",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="referenceText">Reference Text (Optional)</Label>
          <Textarea
            id="referenceText"
            value={referenceText}
            onChange={(e) => setReferenceText(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="solutionText">Solution Text (Optional)</Label>
          <Textarea
            id="solutionText"
            value={solutionText}
            onChange={(e) => setSolutionText(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-4">
          <Label>Options</Label>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={option.option_text}
                onChange={(e) =>
                  setOptions(
                    options.map((opt, i) =>
                      i === index
                        ? { ...opt, option_text: e.target.value }
                        : opt
                    )
                  )
                }
                placeholder={`Option ${index + 1}`}
                required
                disabled={isLoading}
              />
              <Button
                type="button"
                variant={option.is_correct ? "default" : "outline"}
                onClick={() =>
                  setOptions(
                    options.map((opt, i) => ({
                      ...opt,
                      is_correct: i === index,
                    }))
                  )
                }
                disabled={isLoading}
              >
                Correct
              </Button>
            </div>
          ))}
        </div>

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
