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
import RecompensaVerAnuncio2Page from "./pages/RecompensaVerAnuncio2"; // Importa a página de validação para a missão 2
import RecompensaVerAnuncio1Page from "./pages/RecompensaVerAnuncio1"; // Importa a página de validação
import RecompensaVerAnuncio3Page from "./pages/RecompensaVerAnuncio3"; // Importa a página de validação para a missão 3
import RecompensaVerAnuncio4Page from "./pages/RecompensaVerAnuncio4";
import RecompensaVerAnuncio5Page from "./pages/RecompensaVerAnuncio5";
import RecompensaVerAnuncio6Page from "./pages/RecompensaVerAnuncio6";
import RecompensaVerAnuncio7Page from "./pages/RecompensaVerAnuncio7";
import RecompensaVerAnuncio8Page from "./pages/RecompensaVerAnuncio8";
import RecompensaVerAnuncio9Page from "./pages/RecompensaVerAnuncio9";
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

          {/* Rota de validação para a missão "Ver Anúncio 1" */}
          <Route path="/recompensa/validar-anuncio-id-va1-a1b2c3" element={<RecompensaVerAnuncio1Page />} />

          {/* Rota de validação para a missão "Ver Anúncio 2" */}
          <Route path="/recompensa/validar-anuncio-id-va2-d4e5f6" element={<RecompensaVerAnuncio2Page />} />

          {/* Rota de validação para a missão "Ver Anúncio 3" */}
          <Route path="/recompensa/validar-anuncio-id-va3-g7h8i9" element={<RecompensaVerAnuncio3Page />} />

          {/* Rotas de validação para as missões 4 a 9 */}
          <Route path="/recompensa/validar-anuncio-id-va4-j1k2l3" element={<RecompensaVerAnuncio4Page />} />
          <Route path="/recompensa/validar-anuncio-id-va5-m4n5o6" element={<RecompensaVerAnuncio5Page />} />
          <Route path="/recompensa/validar-anuncio-id-va6-p7q8r9" element={<RecompensaVerAnuncio6Page />} />
          <Route path="/recompensa/validar-anuncio-id-va7-s1t2u3" element={<RecompensaVerAnuncio7Page />} />
          <Route path="/recompensa/validar-anuncio-id-va8-v4w5x6" element={<RecompensaVerAnuncio8Page />} />
          <Route path="/recompensa/validar-anuncio-id-va9-y7z8a9" element={<RecompensaVerAnuncio9Page />} />


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
