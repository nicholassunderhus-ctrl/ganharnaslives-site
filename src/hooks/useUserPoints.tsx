import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserPointsState {
  userPoints: { points: number; total_earned: number } | null;
  loading: boolean;
  pointsPerReal: number;
  fetchUserPoints: () => Promise<void>;
}

export const useUserPoints = create<UserPointsState>((set, get) => ({
  userPoints: null,
  loading: true,
  pointsPerReal: 600,
  fetchUserPoints: async () => {
    const user = useAuth.getState().user;
    if (!user) {
      set({ userPoints: null, loading: false });
      return;
    }

    set({ loading: true });
    const { data, error } = await supabase
      .from('deposits') // CORREÇÃO: Tabela 'deposits' em vez de 'user_points'
      .select('amount_points, status')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    if (error) {
      console.error('Error fetching user points:', error);
      set({ userPoints: { points: 0, total_earned: 0 }, loading: false });
    } else {
      const totalPoints = data.reduce((acc, deposit) => acc + deposit.amount_points, 0);
      // Nota: A lógica para 'total_earned' pode precisar de ajuste dependendo de como você a calcula.
      // Por agora, vamos focar em fazer os pontos funcionarem.
      set({ userPoints: { points: totalPoints, total_earned: totalPoints }, loading: false });
    }
  },
}));

