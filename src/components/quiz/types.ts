export interface QuestionFormProps {
  quizId: string;
  onQuestionCreated?: () => void;
  onClose?: () => void;
}

export interface QuestionData {
  questionText: string;
  referenceText: string;
  solutionText: string;
  linkedQuestionId?: string | null;
  options: {
    option_text: string;
    is_correct: boolean;
  }[];
}

export interface QuestionOption {
  option_text: string;
  is_correct: boolean;
}