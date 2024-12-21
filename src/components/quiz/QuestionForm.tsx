import { useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { X, Plus, Minus } from "lucide-react";

interface QuestionFormProps {
  quizId: string;
  onClose: () => void;
}

const QuestionForm = ({ quizId, onClose }: QuestionFormProps) => {
  const [questionText, setQuestionText] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [solutionText, setSolutionText] = useState("");
  const [options, setOptions] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);
  const [stamp, setStamp] = useState("");

  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createQuestionMutation = useMutation({
    mutationFn: async () => {
      // First create the question
      const { data: question, error: questionError } = await supabase
        .from("questions")
        .insert({
          quiz_id: quizId,
          question_text: questionText,
          reference_text: referenceText,
          solution_text: solutionText,
          stamp,
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // Then create all options
      const { error: optionsError } = await supabase
        .from("options")
        .insert(
          options.map((option) => ({
            question_id: question.id,
            option_text: option.text,
            is_correct: option.isCorrect,
          }))
        );

      if (optionsError) throw optionsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", quizId] });
      toast({
        title: "Question created successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Failed to create question",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    if (!options.some((option) => option.isCorrect)) {
      toast({
        title: "Please mark at least one correct option",
        variant: "destructive",
      });
      return;
    }
    createQuestionMutation.mutate();
  };

  const addOption = () => {
    setOptions([...options, { text: "", isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  return (
    <Card className="p-6 mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New Question</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Question Text</Label>
          <Textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter your question"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Reference Text (Optional)</Label>
          <Textarea
            value={referenceText}
            onChange={(e) => setReferenceText(e.target.value)}
            placeholder="Add any reference material"
          />
        </div>

        <div className="space-y-4">
          <Label>Options</Label>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={option.text}
                onChange={(e) =>
                  setOptions(
                    options.map((o, i) =>
                      i === index ? { ...o, text: e.target.value } : o
                    )
                  )
                }
                placeholder={`Option ${index + 1}`}
                required
              />
              <Button
                type="button"
                variant={option.isCorrect ? "default" : "outline"}
                onClick={() =>
                  setOptions(
                    options.map((o, i) =>
                      i === index ? { ...o, isCorrect: !o.isCorrect } : o
                    )
                  )
                }
              >
                Correct
              </Button>
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeOption(index)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addOption}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Solution Text (Optional)</Label>
          <Textarea
            value={solutionText}
            onChange={(e) => setSolutionText(e.target.value)}
            placeholder="Explain the solution"
          />
        </div>

        <div className="space-y-2">
          <Label>Stamp (Optional)</Label>
          <Input
            value={stamp}
            onChange={(e) => setStamp(e.target.value)}
            placeholder="Add a stamp to group questions"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit">Create Question</Button>
        </div>
      </form>
    </Card>
  );
};

export default QuestionForm;