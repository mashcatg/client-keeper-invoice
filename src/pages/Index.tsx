import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Users, Clock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <header className="container py-4">
          <nav className="flex items-center justify-between">
            <div className="text-xl font-semibold text-primary">QuizMaster</div>
            <div className="space-x-4">
              <Button variant="ghost" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button variant="default" asChild>
                <Link to="/signup">Sign up</Link>
              </Button>
            </div>
          </nav>
        </header>
      </div>
      
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Create Engaging Quizzes with Ease</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Design, share, and track interactive quizzes for education and assessment. Perfect for teachers, trainers, and education professionals.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
              <Link to="/signup">
                Get Started <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-8">
            <Card className="border-2">
              <CardHeader className="space-y-1">
                <Brain className="h-8 w-8 text-primary" />
                <CardTitle className="text-xl">Smart Question Bank</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Create and manage questions with AI assistance, add references, and solutions for comprehensive learning
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="space-y-1">
                <Clock className="h-8 w-8 text-primary" />
                <CardTitle className="text-xl">Flexible Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Set time limits, scoring rules, and customize quiz settings to match your specific teaching needs
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="space-y-1">
                <Users className="h-8 w-8 text-primary" />
                <CardTitle className="text-xl">Track Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Monitor quiz responses and analyze participant performance with detailed insights
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center pt-8">
            <p className="text-gray-600">
              Join thousands of educators and trainers who trust QuizMaster for their assessment needs
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;