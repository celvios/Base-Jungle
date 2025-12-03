import { Switch, Route, useLocation, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ReferralsPage from "@/pages/referrals";
import BlueprintsPage from "@/pages/blueprints";
import LeaderboardPage from "@/pages/leaderboard";
import EcosystemPage from "@/pages/ecosystem";
import WhitepaperPage from "@/pages/whitepaper";
import AnalyticsPage from "@/pages/analytics";
import GovernancePage from "@/pages/governance";
import SecurityPage from "@/pages/security";
import StrategiesPage from "@/pages/strategies";
import NotFound from "@/pages/not-found";
import { ThemeProvider } from "@/contexts/theme-context";
import { ModalProvider } from "@/contexts/modal-context";
import { WalletProvider } from "@/contexts/wallet-context";
import { ModalRenderer } from "@/components/modal-renderer";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/contexts/theme-context";
import { Home as HomeIcon, LayoutDashboard, Users, Trophy, Landmark, Shield, Layers } from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/referrals">
        <ProtectedRoute>
          <ReferralsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/strategies" component={StrategiesPage} />
      <Route path="/blueprints" component={BlueprintsPage} />
      <Route path="/leaderboard">
        <ProtectedRoute>
          <LeaderboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/ecosystem" component={EcosystemPage} />
      <Route path="/whitepaper" component={WhitepaperPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/governance" component={GovernancePage} />
      <Route path="/security" component={SecurityPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

const mobileMenuItems = [
  { title: "Home", url: "/", icon: HomeIcon },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Strategies", url: "/strategies", icon: Layers },
  { title: "Referrals", url: "/referrals", icon: Users },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Governance", url: "/governance", icon: Landmark },
  { title: "Security", url: "/security", icon: Shield },
];

function MobileBottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16">
        {mobileMenuItems.map((item) => {
          const isActive = location === item.url;
          return (
            <Link
              key={item.title}
              href={item.url}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"
                }`}
              data-testid={`mobile-link-${item.title.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function AppContent() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDashboardRoute = location === "/dashboard" || location === "/referrals" || location === "/leaderboard";

  if (!isDashboardRoute) {
    // Marketing pages - no sidebar
    return <Router />;
  }

  // Dashboard pages - with sidebar on desktop, bottom nav on mobile
  return (
    <div className="flex h-screen w-full">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between p-2 border-b shrink-0">
          {/* Only show sidebar trigger on desktop */}
          <div className="hidden md:block">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </div>
          <div className="md:hidden" />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </header>
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <Router />
        </main>
      </div>
      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}

function App() {
  const style = {
    "--sidebar-width": "10rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <ThemeProvider>
      <WalletProvider>
        <ModalProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <SidebarProvider style={style as React.CSSProperties}>
                <ModalRenderer />
                <Toaster />
                <AppContent />
              </SidebarProvider>
            </TooltipProvider>
          </QueryClientProvider>
        </ModalProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;
