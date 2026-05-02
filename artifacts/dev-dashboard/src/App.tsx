import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Portfolio from "@/pages/portfolio";
import Dashboard from "@/pages/dashboard/index";
import Issues from "@/pages/dashboard/issues";
import ActivityPage from "@/pages/dashboard/activity";
import GitHubPage from "@/pages/dashboard/github";
import GitLabPage from "@/pages/dashboard/gitlab";
import BitbucketPage from "@/pages/dashboard/bitbucket";
import SlackPage from "@/pages/dashboard/slack";
import Connections from "@/pages/dashboard/connections";
import Projects from "@/pages/dashboard/projects";
import ProfilePage from "@/pages/dashboard/profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Portfolio} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/issues" component={Issues} />
      <Route path="/dashboard/activity" component={ActivityPage} />
      <Route path="/dashboard/github" component={GitHubPage} />
      <Route path="/dashboard/gitlab" component={GitLabPage} />
      <Route path="/dashboard/bitbucket" component={BitbucketPage} />
      <Route path="/dashboard/slack" component={SlackPage} />
      <Route path="/dashboard/connections" component={Connections} />
      <Route path="/dashboard/projects" component={Projects} />
      <Route path="/dashboard/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
