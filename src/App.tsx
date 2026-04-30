import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthGate, RequireSupportSession } from "@/auth/AuthGate";
import { SupportShell } from "@/components/SupportShell";
import AuthPage from "@/pages/Auth";
import DashboardPage from "@/pages/Dashboard";
import TicketDetailPage from "@/pages/TicketDetail";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthGate>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<RequireSupportSession />}>
              <Route element={<SupportShell />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/tickets/:requestID" element={<TicketDetailPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthGate>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
