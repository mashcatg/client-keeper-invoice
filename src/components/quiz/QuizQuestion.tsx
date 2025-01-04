import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface QuizQuestionProps {
  question: any;
  selectedOption: string;
  onSelectOption: (optionId: string) => void;
}

export const QuizQuestion = ({ question, selectedOption, onSelectOption }: QuizQuestionProps) => {
  return (
    <div className="space-y-6">
      <div 
        className="text-lg font-medium"
        dangerouslySetInnerHTML={{ __html: question.question_text }}
      />

      {question.reference_text && (
        <Card className="p-4 bg-gray-50">
          <div
            className="text-sm text-gray-600"
            dangerouslySetInnerHTML={{ __html: question.reference_text }}
          />
        </Card>
      )}

      <RadioGroup
        value={selectedOption}
        onValueChange={onSelectOption}
        className="space-y-4"
      >
        {question.options.map((option: any) => (
          <div key={option.id} className="flex items-center space-x-3">
            <RadioGroupItem value={option.id} id={option.id} />
            <Label
              htmlFor={option.id}
              className="text-base"
              dangerouslySetInnerHTML={{ __html: option.option_text }}
            />
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};