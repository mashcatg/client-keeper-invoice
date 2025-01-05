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
import { Trash2, Brain, Volume2, VolumeX, Star } from "lucide-react";
import QuestionFilter from "./QuestionFilter";
import { QuestionControls } from "./QuestionControls";
import CustomRichTextEditor from "./CustomRichTextEditor";

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
  ai_importance_analysis: string | null;
  ai_solution_steps: string | null;
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
  const [editingSolution, setEditingSolution] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioInstance, setAudioInstance] = useState<SpeechSynthesisUtterance | null>(null);

  const handleSolutionSave = async (questionId: string, solutionText: string) => {
    const { error } = await supabase
      .from('questions')
      .update({ solution_text: solutionText })
      .eq('id', questionId);

    if (error) {
      toast({
        title: "Failed to save solution",
        variant: "destructive",
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["questions"] });
    setEditingSolution(null);
    toast({
      title: "Solution saved successfully",
    });
  };

  const handleBulkAnalyze = async () => {
    try {
      const { error } = await supabase.functions.invoke('analyze-questions', {
        body: { questionIds: selectedQuestions }
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast({
        title: "Questions analyzed successfully",
      });
    } catch (error) {
      console.error('Error analyzing questions:', error);
      toast({
        title: "Failed to analyze questions",
        variant: "destructive",
      });
    }
  };

  const toggleSpeech = (text: string, lang: string = 'en-US') => {
    if (isPlaying && audioInstance) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setAudioInstance(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.lang = lang;
    utterance.onend = () => {
      setIsPlaying(false);
      setAudioInstance(null);
    };

    setAudioInstance(utterance);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

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
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
        <div className="flex gap-2">
          <Button
            onClick={handleBulkAnalyze}
            disabled={selectedQuestions.length === 0}
          >
            <Brain className="h-4 w-4 mr-2" />
            Analyze Selected Questions
          </Button>
          <Button
            onClick={() => {
              const text = questions.map(q => 
                `Question: ${q.question_text}\nOptions: ${q.options.map(o => o.option_text).join(', ')}`
              ).join('\n\n');
              toggleSpeech(text);
            }}
          >
            {isPlaying ? (
              <VolumeX className="h-4 w-4 mr-2" />
            ) : (
              <Volume2 className="h-4 w-4 mr-2" />
            )}
            {isPlaying ? 'Stop Reading' : 'Read Questions'}
          </Button>
        </div>
      </div>

      <QuestionFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        referenceFilter={referenceFilter}
        onReferenceFilterChange={setReferenceFilter}
        references={[]}
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
                <Star className="h-4 w-4 mr-2" />
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
                    <div>
                      <div 
                        className="flex-1"
                        dangerouslySetInnerHTML={{ __html: question.question_text }}
                      />
                      {question.ai_importance_analysis && (
                        <div className="flex items-center mt-2">
                          {[1,2,3,4,5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                parseFloat(question.ai_importance_analysis!) >= star 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSpeech(
                        `${question.question_text}. Options: ${question.options.map(o => o.option_text).join('. ')}`,
                        'en-US'
                      )}
                    >
                      {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
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
                </div>

                <QuestionControls
                  questionId={question.id}
                  questionText={question.question_text}
                  onAnalysisComplete={() => queryClient.invalidateQueries({ queryKey: ["questions"] })}
                />

                {question.ai_importance_analysis && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-md">
                    <h4 className="font-semibold mb-2">Importance Analysis:</h4>
                    <div className="text-sm text-gray-600 whitespace-pre-wrap">
                      {question.ai_importance_analysis}
                    </div>
                  </div>
                )}

                {question.ai_solution_steps && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">AI Generated Solution:</h4>
                    {editingSolution === question.id ? (
                      <div className="space-y-4">
                        <CustomRichTextEditor
                          value={question.solution_text || question.ai_solution_steps}
                          onChange={(value) => handleSolutionSave(question.id, value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSolutionSave(question.id, question.solution_text || '')}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditingSolution(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="p-4 bg-gray-50 rounded-md cursor-pointer"
                        onClick={() => setEditingSolution(question.id)}
                      >
                        <div
                          className="text-sm text-gray-600"
                          dangerouslySetInnerHTML={{
                            __html: question.solution_text || question.ai_solution_steps
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

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
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuestionList;
