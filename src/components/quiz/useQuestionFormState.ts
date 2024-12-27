import { useState } from "react";
import { QuestionData, QuestionOption } from "./types";

const initialState: QuestionData = {
  questionText: "",
  referenceText: "",
  solutionText: "",
  options: [
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
  ],
};

export const useQuestionFormState = () => {
  const [questionState, setQuestionState] = useState<QuestionData>(initialState);

  const updateQuestionState = (updates: Partial<QuestionData>) => {
    setQuestionState((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const resetForm = () => {
    setQuestionState(initialState);
  };

  return {
    questionState,
    updateQuestionState,
    resetForm,
  };
};