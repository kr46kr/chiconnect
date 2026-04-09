import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { store } from "@/lib/store";
import { useDataLoader } from "@/hooks/use-data-loader";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import EventsPage from "./pages/EventsPage.tsx";
import EventDetailPage from "./pages/EventDetailPage.tsx";
import GroupsPage from "./pages/GroupsPage.tsx";
import GroupDetailPage from "./pages/GroupDetailPage.tsx";
import PeoplePage from "./pages/PeoplePage.tsx";
import PersonDetailPage from "./pages/PersonDetailPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import OnboardingPage from "./pages/OnboardingPage.tsx";

const queryClient = new QueryClient();

function ProtectedRoute({ children, requireOnboarding = true }: { children: React.ReactNode, requireOnboarding?: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  if (store.isLoaded()) {
    const profile = store.getCurrentUser();
    if (requireOnboarding && profile && !profile.location) {
      if (location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
      }
    }
  }

  return <>{children}</>;
}

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { loading, error } = useDataLoader(user);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading ChiConnect...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/onboarding" element={<ProtectedRoute requireOnboarding={false}><OnboardingPage /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
        <Route path="/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
        <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
        <Route path="/groups/:id" element={<ProtectedRoute><GroupDetailPage /></ProtectedRoute>} />
        <Route path="/people" element={<ProtectedRoute><PeoplePage /></ProtectedRoute>} />
        <Route path="/people/:id" element={<ProtectedRoute><PersonDetailPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

// Documentation update: Sync verification commit
