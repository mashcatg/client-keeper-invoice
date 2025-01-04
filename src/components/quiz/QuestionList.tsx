import { useState, useMemo } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { Trash2, Link, Stamp } from "lucide-react";
import QuestionFilter from "./QuestionFilter";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [referenceFilter, setReferenceFilter] = useState("");
  const [stampName, setStampName] = useState("");
  const [showStampInput, setShowStampInput] = useState(false);

  // Extract unique references
  const references = useMemo(() => {
    const refs = questions
      .map((q) => q.reference_text)
      .filter((ref): ref is string => ref !== null && ref !== "");
    return Array.from(new Set(refs));
  }, [questions]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchesSearch = question.question_text
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesReference = !referenceFilter || question.reference_text === referenceFilter;
      return matchesSearch && matchesReference;
    });
  }, [questions, searchQuery, referenceFilter]);

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

  const handleCreateStamp = async () => {
    if (!stampName.trim() || selectedQuestions.length === 0) {
      toast({
        title: "Please enter a stamp name and select questions",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("questions")
      .update({ stamp: stampName })
      .in("id", selectedQuestions);

    if (error) {
      toast({
        title: "Failed to create stamp",
        variant: "destructive",
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["questions"] });
    toast({
      title: "Stamp created successfully",
    });
    setSelectedQuestions([]);
    setStampName("");
    setShowStampInput(false);
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No questions added yet. Start by adding your first question!
      </div>
    );
  }

  // Group questions by stamp
  const groupedQuestions = filteredQuestions.reduce((acc, question) => {
    const stamp = question.stamp || "Ungrouped";
    if (!acc[stamp]) {
      acc[stamp] = [];
    }
    acc[stamp].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  return (
    <div className="space-y-6">
      <QuestionFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        referenceFilter={referenceFilter}
        onReferenceFilterChange={setReferenceFilter}
        references={references}
      />

      {selectedQuestions.length > 0 && (
        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
          <span>{selectedQuestions.length} questions selected</span>
          <div className="flex gap-2">
            {showStampInput ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter stamp name"
                  value={stampName}
                  onChange={(e) => setStampName(e.target.value)}
                  className="w-48"
                />
                <Button onClick={handleCreateStamp}>
                  Create Stamp
                </Button>
                <Button variant="outline" onClick={() => setShowStampInput(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowStampInput(true)}>
                <Stamp className="h-4 w-4 mr-2" />
                Create Stamp
              </Button>
            )}
          </div>
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