import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Anchor, Lock } from "lucide-react";
import { Link } from "wouter";

export default function AdminLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Anchor className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-display font-bold">Admin Portal</CardTitle>
          <p className="text-sm text-muted-foreground">
            Access protected management features
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-3">
            <Lock className="h-5 w-5 text-primary mt-0.5" />
            <p className="text-sm text-primary/80">
              This area is restricted to authorized personnel. Please sign in with your administrator account.
            </p>
          </div>
          <Button 
            className="w-full h-11" 
            asChild
            data-testid="button-admin-login"
          >
            <a href="/api/login">Sign in with Replit</a>
          </Button>
          <div className="text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Back to public site
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
