import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, DollarSign, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <header className="container py-4">
          <nav className="flex items-center justify-between">
            <div className="text-xl font-semibold text-primary">InvoiceApp</div>
            <Button variant="ghost" onClick={() => window.location.href = "/login"}>
              Sign in
            </Button>
          </nav>
        </header>
      </div>
      
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8 animate-in">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Professional Invoicing Made Simple</h1>
            <p className="text-lg text-gray-600">Create, send, and manage invoices with ease</p>
            <Button size="lg" className="bg-primary hover:bg-primary-600" asChild>
              <Link to="/signup">
                Get Started <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-8">
            <Card>
              <CardHeader className="space-y-1">
                <FileText className="h-8 w-8 text-primary" />
                <CardTitle className="text-xl">Easy Invoice Creation</CardTitle>
              </CardHeader>
              <CardContent>
                Create professional invoices with our drag-and-drop builder
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <Users className="h-8 w-8 text-primary" />
                <CardTitle className="text-xl">Client Management</CardTitle>
              </CardHeader>
              <CardContent>
                Manage your clients and their information in one place
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <DollarSign className="h-8 w-8 text-primary" />
                <CardTitle className="text-xl">Payment Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                Track payments and mark invoices as paid with one click
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;