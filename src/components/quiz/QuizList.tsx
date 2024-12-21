import { FileText, Share2, List, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface Quiz {
  id: string;
  title: string;
  created_at: string;
  questions_per_quiz: number;
  time_duration: number;
}

interface QuizListProps {
  quizzes: Quiz[];
}

const QuizList = ({ quizzes }: QuizListProps) => {
  if (quizzes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No quizzes yet. Create your first quiz to get started!
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {quizzes.map((quiz) => (
        <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg truncate">{quiz.title}</span>
              <FileText className="h-5 w-5 text-gray-400" />
            </CardTitle>
            <div className="text-sm text-gray-500">
              {new Date(quiz.created_at).toLocaleDateString()}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <div>Questions: {quiz.questions_per_quiz}</div>
                <div>Duration: {Math.floor(quiz.time_duration / 60)} minutes</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/quiz/${quiz.id}/config`}>
                    Config
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/quiz/${quiz.id}/questions`}>
                    <List className="h-4 w-4 mr-1" />
                    Questions
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/quiz/${quiz.id}/responses`}>
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Responses
                  </Link>
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuizList;