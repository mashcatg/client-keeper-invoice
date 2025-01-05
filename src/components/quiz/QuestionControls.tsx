import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Loader2, Brain } from "lucide-react";
import { useState } from "react";

interface QuestionControlsProps {
  questionId: string;
  questionText: string;
  onAnalysisComplete?: () => void;
}

export const QuestionControls = ({ questionId, questionText, onAnalysisComplete }: QuestionControlsProps) => {
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async (type: 'solution') => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-question', {
        body: { questionId, analysisType: type }
      });

      if (error) throw error;

      toast({
        title: "Analysis completed",
        description: "The solution has been generated successfully.",
      });

      onAnalysisComplete?.();
    } catch (error) {
      console.error('Error analyzing question:', error);
      toast({
        title: "Analysis failed",
        description: "Failed to generate solution. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAnalyze('solution')}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Brain className="h-4 w-4 mr-2" />
        )}
        Generate Solution
      </Button>
    </div>
  );
};