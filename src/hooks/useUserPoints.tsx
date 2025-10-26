import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserPointsState {
  userPoints: { points: number; total_earned: number } | null;
  loading: boolean;
  pointsPerReal: number;
  fetchUserPoints: () => Promise<void>;
}

export const useUserPoints = create(subscribeWithSelector<UserPointsState>((set, get) => ({
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
      .from('user_points')
      .select('points, total_earned')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Se o erro for 'PGRST116', significa que o usuário ainda não tem uma linha na tabela. Isso é normal.
      if (error.code === 'PGRST116') {
        set({ userPoints: { points: 0, total_earned: 0 }, loading: false });
        return;
      }
      console.error('Error fetching user points:', error);
      set({ userPoints: { points: 0, total_earned: 0 }, loading: false });
    } else {
      set({ userPoints: data, loading: false });
    }
  },
})));

// Ouve mudanças no estado de autenticação para buscar os pontos do usuário.
useAuth.subscribe(
  (state) => state.user,
  () => useUserPoints.getState().fetchUserPoints(),
  { fireImmediately: true }
);
