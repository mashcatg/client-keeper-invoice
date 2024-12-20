import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const session = useSession();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out successfully",
    });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <header className="container py-4">
          <nav className="flex items-center justify-between">
            <div className="text-xl font-semibold text-primary">InvoiceApp</div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session?.user.email}
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          </nav>
        </header>
      </div>
      
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Welcome to your Dashboard</h1>
          <p className="text-gray-600">
            Start managing your invoices and clients from here.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;