import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * All content in this page are only for example, replace with your own feature implementation
 * When building pages, remember your instructions in Frontend Workflow, Frontend Best Practices, Design Guide and Common Pitfalls
 */
export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && user?.role === "client") {
      setLocation("/client");
    }
  }, [isAuthenticated, user, setLocation]);

  // If theme is switchable in App.tsx, we can implement theme toggling like this:
  // const { theme, toggleTheme } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <main className="text-center space-y-6 px-4">
        <h1 className="text-5xl font-bold text-primary">Vehiclee</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Transform your vehicle into a mobile billboard. Connect advertisers with drivers for e-paper advertising campaigns.
        </p>
        {!isAuthenticated ? (
          <div className="flex gap-4 justify-center pt-4">
            <Button asChild size="lg">
              <a href={getLoginUrl()}>Get Started</a>
            </Button>
          </div>
        ) : (
          <div className="flex gap-4 justify-center pt-4">
            <Button asChild size="lg">
              <a href="/client">Go to Dashboard</a>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
