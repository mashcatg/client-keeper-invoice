import { useParams, useNavigate } from "react-router-dom";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Copy, Share2 } from "lucide-react";

const QuizResponses = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const { data: quiz } = useQuery({
    queryKey: ["quiz", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: responses, isLoading } = useQuery({
    queryKey: ["responses", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("responses")
        .select(`
          *,
          response_details (*)
        `)
        .eq("quiz_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const copyShareLink = async () => {
    if (!quiz?.sharing_link) {
      const shareLink = `${window.location.origin}/quiz/${id}/take`;
      const { error } = await supabase
        .from("quizzes")
        .update({ sharing_link: shareLink })
        .eq("id", id);

      if (error) {
        toast({
          title: "Failed to generate sharing link",
          variant: "destructive",
        });
        return;
      }
    }

    const link = quiz?.sharing_link || `${window.location.origin}/quiz/${id}/take`;
    await navigator.clipboard.writeText(link);
    toast({
      title: "Sharing link copied to clipboard",
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <header className="container py-4">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Quiz Responses</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyShareLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button>
                <Share2 className="h-4 w-4 mr-2" />
                Share Quiz
              </Button>
            </div>
          </div>
        </header>
      </div>

      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          {responses && responses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Time Taken</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.map((response) => (
                  <TableRow key={response.id}>
                    <TableCell>
                      {new Date(response.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{response.score}</TableCell>
                    <TableCell>
                      {response.completed_at
                        ? `${Math.floor(
                            (new Date(response.completed_at).getTime() -
                              new Date(response.started_at).getTime()) /
                              (1000 * 60)
                          )} minutes`
                        : "In Progress"}
                    </TableCell>
                    <TableCell>
                      {response.completed_at ? "Completed" : "In Progress"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No responses yet. Share your quiz to get started!
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default QuizResponses;