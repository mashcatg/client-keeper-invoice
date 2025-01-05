import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Loader2, Brain, VolumeX, Volume2 } from "lucide-react";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioInstance, setAudioInstance] = useState<SpeechSynthesisUtterance | null>(null);

  const handleAnalyze = async (type: 'importance' | 'solution') => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-question', {
        body: { questionId, analysisType: type }
      });

      if (error) throw error;

      toast({
        title: "Analysis completed",
        description: "The analysis has been saved successfully.",
      });

      onAnalysisComplete?.();
    } catch (error) {
      console.error('Error analyzing question:', error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze the question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSpeech = () => {
    if (isPlaying && audioInstance) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setAudioInstance(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(questionText);
    utterance.rate = 0.9;
    utterance.onend = () => {
      setIsPlaying(false);
      setAudioInstance(null);
    };

    setAudioInstance(utterance);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAnalyze('importance')}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Brain className="h-4 w-4 mr-2" />
        )}
        Analyze Importance
      </Button>
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
      <Button
        variant="outline"
        size="sm"
        onClick={toggleSpeech}
      >
        {isPlaying ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};