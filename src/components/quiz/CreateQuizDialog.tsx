import { useState } from "react";
import { useSupabaseClient, useSession } from "@supabase/auth-helpers-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const CreateQuizDialog = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useSupabaseClient();
  const session = useSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !session?.user?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("quizzes").insert([
        { 
          title,
          user_id: session.user.id 
        }
      ]);
      
      if (error) throw error;
      
      toast({
        title: "Quiz created successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      setOpen(false);
      setTitle("");
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast({
        title: "Failed to create quiz",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Quiz</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Quiz</DialogTitle>
          <DialogDescription>
            Enter a title for your new quiz. You can configure other settings after creation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Quiz Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Quiz"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuizDialog;