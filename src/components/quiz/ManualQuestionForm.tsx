import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import CKEditorWrapper from "./CKEditorWrapper";
import { QuestionOptions } from "./QuestionOptions";

interface ManualQuestionFormProps {
  questionState: any;
  updateQuestionState: (updates: any) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
}

const ManualQuestionForm = ({
  questionState,
  updateQuestionState,
  isLoading,
  onSubmit,
  onCancel,
}: ManualQuestionFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Question Text</Label>
        <CKEditorWrapper
          value={questionState.questionText}
          onChange={(value) => updateQuestionState({ questionText: value })}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label>Reference Text (Optional)</Label>
        <CKEditorWrapper
          value={questionState.referenceText}
          onChange={(value) => updateQuestionState({ referenceText: value })}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label>Solution Text (Optional)</Label>
        <CKEditorWrapper
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
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ManualQuestionForm;