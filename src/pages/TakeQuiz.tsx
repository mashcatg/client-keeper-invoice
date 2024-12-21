import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const TakeQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [started, setStarted] = useState(false);

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ["public-quiz", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select(`
          *,
          questions (
            *,
            options (*)
          )
        `)
        .eq("id", id)
        .eq("is_available", true)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create anonymous response
      const { data: response, error } = await supabase
        .from("responses")
        .insert({
          quiz_id: id!,
          user_email: email,
          user_name: name,
          user_id: crypto.randomUUID(), // Generate a random UUID for anonymous users
        })
        .select()
        .single();

      if (error) throw error;

      setStarted(true);
      toast({
        title: "Quiz started successfully",
      });
    } catch (error) {
      console.error("Error starting quiz:", error);
      toast({
        title: "Failed to start quiz",
        variant: "destructive",
      });
    }
  };

  if (quizLoading) {
    return <div>Loading...</div>;
  }

  if (!quiz) {
    return <div>Quiz not found or not available</div>;
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <h1 className="text-2xl font-bold mb-6">{quiz.title}</h1>
          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Your Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Start Quiz
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Quiz taking interface will be implemented here */}
      Quiz Started
    </div>
  );
};

export default TakeQuiz;