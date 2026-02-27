import { useState, useEffect } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useCallerProfile } from "./hooks/useQueries";
import { LoginPage } from "./pages/LoginPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { CommunitiesPage } from "./pages/CommunitiesPage";
import { EventsPage } from "./pages/EventsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { GlobalFeedPage } from "./pages/GlobalFeedPage";
import { Toaster } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Network,
  LayoutDashboard,
  Zap,
  Hash,
  Calendar,
  Globe,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "./backend.d.ts";

type Page = "dashboard" | "discover" | "communities" | "events" | "feed" | "profile";

const NAV_ITEMS: { id: Page; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "discover", label: "Discover", icon: Zap },
  { id: "communities", label: "Communities", icon: Hash },
  { id: "events", label: "Events", icon: Calendar },
  { id: "feed", label: "Feed", icon: Globe },
  { id: "profile", label: "Profile", icon: User },
];

function AppShell({ children, activePage, onPageChange, onLogout, profileName }: {
  children: React.ReactNode;
  activePage: Page;
  onPageChange: (page: Page) => void;
  onLogout: () => void;
  profileName?: string;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background mesh-bg flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border/50 bg-sidebar/80 backdrop-blur-sm sticky top-0 h-screen">
        {/* Logo */}
        <div className="p-5 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Network className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-lg">
              <span className="text-gradient-teal">Link</span>
              <span className="text-foreground">ora</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => onPageChange(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                activePage === id
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="p-3 border-t border-border/40 space-y-2">
          {profileName && (
            <p className="text-xs text-muted-foreground px-3 truncate">{profileName}</p>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 border-b border-border/50 bg-background/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" />
            <span className="font-bold">
              <span className="text-gradient-teal">Link</span>
              <span className="text-foreground">ora</span>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-20 bg-background/95 backdrop-blur-sm pt-14">
            <nav className="p-4 space-y-1">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => { onPageChange(id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    activePage === id
                      ? "bg-primary/15 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors mt-4"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </nav>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto scrollbar-thin max-w-6xl w-full mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden sticky bottom-0 border-t border-border/50 bg-background/95 backdrop-blur-sm grid grid-cols-6">
          {NAV_ITEMS.map(({ id, icon: Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => onPageChange(id)}
              className={`flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${
                activePage === id ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className={`text-[10px] ${activePage === id ? "opacity-100" : "opacity-60"}`}>
                {id === "dashboard" ? "Home" : id === "communities" ? "Groups" : id.charAt(0).toUpperCase() + id.slice(1)}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const { identity, clear } = useInternetIdentity();
  const profileQuery = useCallerProfile();
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);

  const callerPrincipal = identity?.getPrincipal();

  // When user selects "View Profile" in Discover, navigate to profile page
  const handleViewProfile = (profile: UserProfile) => {
    setViewingProfile(profile);
    setActivePage("profile");
  };

  const handlePageChange = (page: Page) => {
    setActivePage(page);
    if (page !== "profile") setViewingProfile(null);
  };

  // Loading state
  if (profileQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto">
            <Network className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-32 mx-auto" />
            <Skeleton className="h-3 w-24 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Onboarding if no profile
  if (profileQuery.data === null) {
    return <OnboardingPage />;
  }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardPage callerPrincipal={callerPrincipal} />;
      case "discover":
        return <DiscoverPage onViewProfile={handleViewProfile} />;
      case "communities":
        return <CommunitiesPage callerPrincipal={callerPrincipal} />;
      case "events":
        return <EventsPage callerPrincipal={callerPrincipal} />;
      case "feed":
        return <GlobalFeedPage callerPrincipal={callerPrincipal} />;
      case "profile":
        return (
          <ProfilePage
            callerPrincipal={callerPrincipal}
            viewingPrincipal={viewingProfile ? undefined : undefined}
          />
        );
      default:
        return <DashboardPage callerPrincipal={callerPrincipal} />;
    }
  };

  return (
    <AppShell
      activePage={activePage}
      onPageChange={handlePageChange}
      onLogout={clear}
      profileName={profileQuery.data?.name}
    >
      {renderPage()}
    </AppShell>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();

  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Network className="w-10 h-10 text-primary animate-pulse mx-auto" />
          <p className="text-sm text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {identity ? <AuthenticatedApp /> : <LoginPage />}
      <Toaster richColors position="top-right" />
    </>
  );
}
