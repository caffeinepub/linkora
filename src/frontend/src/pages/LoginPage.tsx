import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { Button } from "@/components/ui/button";
import { Loader2, Network, Shield, Star, Users } from "lucide-react";

export function LoginPage() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background mesh-bg flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-chart-4/5 blur-3xl" />
        <div className="absolute top-3/4 left-1/2 w-48 h-48 rounded-full bg-chart-2/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md w-full space-y-10 animate-slide-up">
        {/* Logo & Brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 mb-4">
            <Network className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-gradient-teal">Link</span>
            <span className="text-foreground">ora</span>
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            Campus Collaboration Intelligence Platform. Discover talent, form optimized teams, and build your execution reputation.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, label: "Skill Matching", desc: "Find ideal teammates" },
            { icon: Star, label: "Reputation", desc: "Execution-based credibility" },
            { icon: Network, label: "Communities", desc: "Interest-based groups" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="glass-card rounded-xl p-3 text-center space-y-1">
              <Icon className="w-5 h-5 text-primary mx-auto" />
              <p className="text-xs font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        {/* Login card */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-primary shrink-0" />
            <span>Secured by Internet Identity — no passwords, no emails</span>
          </div>

          <Button
            onClick={login}
            disabled={isLoggingIn || isInitializing}
            size="lg"
            className="w-full btn-glow font-semibold text-base h-12 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {(isLoggingIn || isInitializing) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Sign in to Linkora"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            New to campus? Your profile is created after your first sign-in.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-12 text-xs text-muted-foreground/60 text-center">
        © 2026. Built with ♥ using{" "}
        <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
