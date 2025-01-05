import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import CustomRichTextEditor from "./CustomRichTextEditor";
import { useState } from "react";

interface GeneratedQuestionCardProps {
  question: any;
  index: number;
  isLoading: boolean;
  onQuestionChange: (index: number, updatedQuestion: any) => void;
}

const GeneratedQuestionCard = ({
  question,
  index,
  isLoading,
  onQuestionChange,
}: GeneratedQuestionCardProps) => {
  const [editedSolution, setEditedSolution] = useState(question.solution_text || question.ai_solution_steps || '');

  const handleSaveSolution = () => {
    onQuestionChange(index, { ...question, solution_text: editedSolution });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Question Text</Label>
          <CustomRichTextEditor
            value={question.questionText}
            onChange={(value) => {
              onQuestionChange(index, { ...question, questionText: value });
            }}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label>Reference Text (Optional)</Label>
          <CustomRichTextEditor
            value={question.referenceText}
            onChange={(value) => {
              onQuestionChange(index, { ...question, referenceText: value });
            }}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label>Solution Text (Optional)</Label>
          <CustomRichTextEditor
            value={editedSolution}
            onChange={setEditedSolution}
            disabled={isLoading}
          />
          <Button 
            onClick={handleSaveSolution}
            disabled={isLoading}
          >
            Save Solution
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Options</Label>
          {question.options.map((option: any, optIndex: number) => (
            <div key={optIndex} className="flex gap-2">
              <div className="flex-1">
                <CustomRichTextEditor
                  value={option.text}
                  onChange={(value) => {
                    const newOptions = [...question.options];
                    newOptions[optIndex] = { ...option, text: value };
                    onQuestionChange(index, { ...question, options: newOptions });
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
                  onQuestionChange(index, { ...question, options: newOptions });
                }}
                disabled={isLoading}
              >
                Correct
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default GeneratedQuestionCard;