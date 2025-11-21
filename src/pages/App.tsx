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
import RecompensaAnuncio2Page from './pages/RecompensaAnuncio2'; // Importa a segunda página de recompensa
import NotFoundPage from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <UserPointsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Rota da nova página de recompensa */}
            <Route path="/recompensa-anuncio" element={<RecompensaAnuncioPage />} />
            <Route path="/recompensa-anuncio-2" element={<RecompensaAnuncio2Page />} />

            {/* Rotas do Painel */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/watch" element={<WatchPage />} />
            <Route path="/dashboard/missoes" element={<DailyMissionsPage />} />
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