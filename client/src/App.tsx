import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import NotFound from "./pages/NotFound";

// Pages
import SetupPage from "./pages/SetupPage";
import DashboardPage from "./pages/DashboardPage";
import NewProjectPage from "./pages/NewProjectPage";
import KnowledgePage from "./pages/KnowledgePage";
import AssetsPage from "./pages/AssetsPage";
import BriefPage from "./pages/BriefPage";
import StoryboardPage from "./pages/StoryboardPage";
import ModelSettingsPage from "./pages/ModelSettingsPage";
import GenerationPage from "./pages/GenerationPage";
import StitchPage from "./pages/StitchPage";
import PreviewExportPage from "./pages/PreviewExportPage";
import ProjectsPage from "./pages/ProjectsPage";
import MediaLibraryPage from "./pages/MediaLibraryPage";
import SettingsPage from "./pages/SettingsPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/setup" component={SetupPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/projects/new" component={NewProjectPage} />
      <Route path="/projects/:id/knowledge" component={KnowledgePage} />
      <Route path="/projects/:id/assets" component={AssetsPage} />
      <Route path="/projects/:id/brief" component={BriefPage} />
      <Route path="/projects/:id/storyboard" component={StoryboardPage} />
      <Route path="/projects/:id/model-settings" component={ModelSettingsPage} />
      <Route path="/projects/:id/generation" component={GenerationPage} />
      <Route path="/projects/:id/stitch" component={StitchPage} />
      <Route path="/projects/:id/preview" component={PreviewExportPage} />
      <Route path="/media" component={MediaLibraryPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(0.14 0.012 285)",
                border: "1px solid oklch(1 0 0 / 0.1)",
                color: "oklch(0.92 0.005 285)",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
