import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/useAuth';
import { UserPointsProvider } from '@/hooks/useUserPoints';

import IndexPage from './pages/Index';
import AuthPage from './pages/Auth';
import DashboardPage from './pages/Dashboard';
import WatchPage from './pages/Watch';
import DailyMissionsPage from './pages/DailyMissions';
import MyStreamsPage from './pages/MyStreams';
import WithdrawPage from './pages/Withdraw';
import DepositPage from './pages/Deposit';
import VpnPage from './pages/Vpn';
import AdminPage from './pages/Admin';
import RecompensaAnuncioPage from './pages/RecompensaAnuncio'; // Importa a nova página
import RecompensaVerAnunciosPage from './pages/RecompensaVerAnuncios'; // Importa a página para "Ver Anuncios"
function App() {
  return (
    <AuthProvider>
      <UserPointsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Rota da nova página de recompensa */}
            <Route path="/recompensa/validar-anuncio-id-8491-a3b2" element={<RecompensaAnuncioPage />} /> {/* Rota para a primeira missão */}
            <Route path="/recompensa/validar-anuncio-id-2957-c8d4" element={<RecompensaVerAnunciosPage />} /> {/* Rota para a missão "Ver Anuncios" */}

            {/* Rotas para as 10 novas missões */}
            <Route path="/recompensa/validar-anuncio-id-2957-c8d4" element={<RecompensaAnuncio2Page />} />
            <Route path="/recompensa-anuncio-3" element={<RecompensaAnuncio3Page />} />
            <Route path="/recompensa-anuncio-4" element={<RecompensaAnuncio4Page />} />
            <Route path="/recompensa-anuncio-5" element={<RecompensaAnuncio5Page />} />
            <Route path="/recompensa-anuncio-6" element={<RecompensaAnuncio6Page />} />
            <Route path="/recompensa-anuncio-7" element={<RecompensaAnuncio7Page />} />
            <Route path="/recompensa-anuncio-8" element={<RecompensaAnuncio8Page />} />
            <Route path="/recompensa-anuncio-9" element={<RecompensaAnuncio9Page />} />
            <Route path="/recompensa-anuncio-10" element={<RecompensaAnuncio10Page />} />
            <Route path="/recompensa-anuncio-11" element={<RecompensaAnuncio11Page />} />

            {/* Rotas do Painel */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/watch" element={<WatchPage />} />
            <Route path="/dashboard/missions" element={<DailyMissionsPage />} />
            <Route path="/dashboard/stream" element={<MyStreamsPage />} />
            <Route path="/dashboard/sacar" element={<WithdrawPage />} />
            <Route path="/dashboard/depositar" element={<DepositPage />} />
            <Route path="/dashboard/vpn" element={<VpnPage />} />
            <Route path="/dashboard/admin" element={<AdminPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </UserPointsProvider>
    </AuthProvider>
  );
}

export default App;