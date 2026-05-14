import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout';
import Overview from '@/pages/Overview';
import GrantDiscovery from '@/pages/GrantDiscovery';
import Assessment from '@/pages/Assessment';
import Pipeline from '@/pages/Pipeline';
import CoPilot from '@/pages/CoPilot';
import PackExport from '@/pages/PackExport';
import OrgProfile from '@/pages/OrgProfile';
import GrantDossier from '@/pages/GrantDossier';
import ApplicationTracker from '@/pages/ApplicationTracker';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/discovery" element={<GrantDiscovery />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/copilot" element={<CoPilot />} />
        <Route path="/pack" element={<PackExport />} />
        <Route path="/org-profile" element={<OrgProfile />} />
        <Route path="/dossier" element={<GrantDossier />} />
        <Route path="/tracker" element={<ApplicationTracker />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App