import { useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Trash2, Link } from "lucide-react";

interface Option {
  id: string;
  option_text: string;
  is_correct: boolean;
}

interface Question {
  id: string;
  question_text: string;
  reference_text: string | null;
  solution_text: string | null;
  stamp: string | null;
  options: Option[];
}

interface QuestionListProps {
  questions: Question[];
}

const QuestionList = ({ questions }: QuestionListProps) => {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  const handleDelete = async (questionId: string) => {
    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId);

    if (error) {
      toast({
        title: "Failed to delete question",
        variant: "destructive",
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["questions"] });
    toast({
      title: "Question deleted successfully",
    });
    setQuestionToDelete(null);
  };

  const handleLinkQuestions = async () => {
    if (selectedQuestions.length < 2) {
      toast({
        title: "Please select at least 2 questions to link",
        variant: "destructive",
      });
      return;
    }

    const stamp = `Linked Group ${new Date().toISOString()}`;
    const { error } = await supabase
      .from("questions")
      .update({ stamp })
      .in("id", selectedQuestions);

    if (error) {
      toast({
        title: "Failed to link questions",
        variant: "destructive",
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["questions"] });
    toast({
      title: "Questions linked successfully",
    });
    setSelectedQuestions([]);
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No questions added yet. Start by adding your first question!
      </div>
    );
  }

  // Group questions by stamp
  const groupedQuestions = questions.reduce((acc, question) => {
    const stamp = question.stamp || "Ungrouped";
    if (!acc[stamp]) {
      acc[stamp] = [];
    }
    acc[stamp].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  return (
    <div className="space-y-6">
      {selectedQuestions.length > 0 && (
        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
          <span>{selectedQuestions.length} questions selected</span>
          <Button onClick={handleLinkQuestions}>
            <Link className="h-4 w-4 mr-2" />
            Link Questions
          </Button>
        </div>
      )}
      
      {Object.entries(groupedQuestions).map(([stamp, questions]) => (
        <div key={stamp} className="space-y-4">
          <h3 className="text-lg font-semibold">{stamp}</h3>
          <div className="space-y-4">
            {questions.map((question) => (
              <Card key={question.id} className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedQuestions.includes(question.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedQuestions([...selectedQuestions, question.id]);
                        } else {
                          setSelectedQuestions(selectedQuestions.filter(id => id !== question.id));
                        }
                      }}
                    />
                    <div 
                      className="flex-1"
                      dangerouslySetInnerHTML={{ __html: question.question_text }}
                    />
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuestionToDelete(question.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the
                          question and all its options.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(question.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {question.reference_text && (
                  <div>
                    <h4 className="font-semibold">Reference:</h4>
                    <div
                      className="text-gray-600"
                      dangerouslySetInnerHTML={{ __html: question.reference_text }}
                    />
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Options:</h4>
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div
                        key={option.id}
                        className={`p-2 rounded ${
                          option.is_correct
                            ? "bg-green-50 border border-green-200"
                            : "bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <div dangerouslySetInnerHTML={{ __html: option.option_text }} />
                        {option.is_correct && (
                          <span className="text-green-600 text-sm ml-2">
                            (Correct)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {question.solution_text && (
                  <div>
                    <h4 className="font-semibold">Solution:</h4>
                    <div
                      className="text-gray-600"
                      dangerouslySetInnerHTML={{ __html: question.solution_text }}
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuestionList;