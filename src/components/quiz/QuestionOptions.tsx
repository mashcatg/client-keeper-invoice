import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { QuestionOption } from "./types";
import RichTextEditor from "./RichTextEditor";

interface QuestionOptionsProps {
  options: QuestionOption[];
  onOptionsChange: (newOptions: QuestionOption[]) => void;
  isLoading: boolean;
}

export const QuestionOptions = ({
  options,
  onOptionsChange,
  isLoading,
}: QuestionOptionsProps) => {
  return (
    <div className="space-y-4">
      <Label>Options</Label>
      {options.map((option, index) => (
        <div key={index} className="flex gap-2">
          <div className="flex-1">
            <RichTextEditor
              value={option.option_text}
              onChange={(value) =>
                onOptionsChange(
                  options.map((opt, i) =>
                    i === index
                      ? { ...opt, option_text: value }
                      : opt
                  )
                )
              }
              disabled={isLoading}
            />
          </div>
          <Button
            type="button"
            variant={option.is_correct ? "default" : "outline"}
            onClick={() =>
              onOptionsChange(
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
  );
};