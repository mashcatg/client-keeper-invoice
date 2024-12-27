import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuestionOption } from "./types";

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
          <Input
            value={option.option_text}
            onChange={(e) =>
              onOptionsChange(
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