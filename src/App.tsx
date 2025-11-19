import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Watch from "./pages/Watch";
import MyStreams from "./pages/MyStreams";
import Withdraw from "./pages/Withdraw";
import Deposit from "./pages/Deposit";
import Admin from "./pages/Admin";
import { AdminRoute } from "./components/AdminRoute";
import DailyMissionsPage from "./pages/DailyMissions"; // Importa a nova página
import VpnPage from "./pages/Vpn";
import RecompensaAnuncioPage from "./pages/RecompensaAnuncio"; // Importa a página de recompensa
import { MobileHeader } from "@/components/MobileHeader";
import { MobileNav } from "@/components/MobileNav";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* Mobile header and nav are mounted here so they are visible across all routes (they are md:hidden so only show on mobile). */}
        <MobileHeader />
        <MobileNav />

        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Rota da nova página de recompensa */}
          <Route path="/recompensa-anuncio" element={<RecompensaAnuncioPage />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/watch" element={<Watch />} />
          <Route path="/dashboard/my-streams" element={<MyStreams />} />
          <Route path="/dashboard/withdraw" element={<Withdraw />} />
          <Route path="/dashboard/deposit" element={<Deposit />} />
          <Route path="/dashboard/missions" element={<DailyMissionsPage />} /> {/* Adiciona a nova rota */}
          <Route path="/dashboard/vpn" element={<VpnPage />} />
          <Route 
            path="/dashboard/admin" 
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
