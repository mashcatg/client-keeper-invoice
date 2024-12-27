import { SupabaseClient } from "@supabase/supabase-js";
import { QuestionData } from "./types";

interface HandleQuestionSubmitParams {
  questionState: QuestionData;
  quizId: string;
  supabase: SupabaseClient;
  toast: any;
  onSuccess?: () => void;
}

export const handleQuestionSubmit = async ({
  questionState,
  quizId,
  supabase,
  toast,
  onSuccess,
}: HandleQuestionSubmitParams) => {
  if (!questionState.questionText.trim()) return;

  try {
    // Insert question
    const { data: questionData, error: questionError } = await supabase
      .from("questions")
      .insert([
        {
          quiz_id: quizId,
          question_text: questionState.questionText,
          reference_text: questionState.referenceText,
          solution_text: questionState.solutionText,
        },
      ])
      .select()
      .single();

    if (questionError) throw questionError;

    // Insert options
    const { error: optionsError } = await supabase.from("options").insert(
      questionState.options.map((option) => ({
        question_id: questionData.id,
        option_text: option.option_text,
        is_correct: option.is_correct,
      }))
    );

    if (optionsError) throw optionsError;

    toast({
      title: "Question created successfully",
    });

    onSuccess?.();
  } catch (error) {
    console.error("Error creating question:", error);
    toast({
      title: "Failed to create question",
      variant: "destructive",
    });
  }
};