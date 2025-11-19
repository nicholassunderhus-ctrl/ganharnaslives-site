import React, { useState, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { useUserPoints } from "@/hooks/useUserPoints";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Gift, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

// =================================================================================
// ATENÇÃO: Adicione as missões do dia aqui dentro desta lista (máximo 10).
//
// Exemplo:
// { id: 1, text: 'Resgate seu bônus de login!', points: 50 },
// { id: 2, text: 'Clique para um prêmio surpresa!', points: 20 },
// =================================================================================
const MISSIONS: { id: number; text: string; points: number }[] = [
  // Adicione as missões do dia aqui.
];

const DailyMissionsPage = () => {
  const { userPoints } = useUserPoints();
  const [completedMissions, setCompletedMissions] = useState<number[]>([]);
  const [loadingMission, setLoadingMission] = useState<number | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('missionsLastResetDate');

    if (storedDate !== today) {
      // É um novo dia, reseta as missões completadas
      localStorage.setItem('completedMissions', '[]');
      localStorage.setItem('missionsLastResetDate', today);
      setCompletedMissions([]);
    } else {
      // Mesmo dia, carrega o progresso salvo
      const storedCompleted = JSON.parse(localStorage.getItem('completedMissions') || '[]');
      setCompletedMissions(storedCompleted);
    }
  }, []);

  const handleMissionClick = async (missionId: number, points: number) => {
    if (completedMissions.includes(missionId) || !user) {
      return;
    }

    setLoadingMission(missionId);

    try {
      // O clique no botão acionará os anúncios "onclick" que você já tem no index.html.
      const { error } = await supabase.rpc('increment_points', { user_id_in: user.id, points_to_add: points });

      if (error) throw error;

      const updatedCompletedMissions = [...completedMissions, missionId];
      setCompletedMissions(updatedCompletedMissions);
      localStorage.setItem('completedMissions', JSON.stringify(updatedCompletedMissions));
      toast.success(`+${points} pontos foram adicionados à sua conta!`);

      // Força a atualização do saldo de pontos na UI
      await queryClient.invalidateQueries({ queryKey: ['userPoints', user.id] });

    } catch (error: any) {
      toast.error("Erro ao completar missão.", { description: error.message });
    } finally {
      setLoadingMission(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar points={userPoints?.points ?? 0} />

      <main className="md:ml-64 ml-0 pt-20 pb-24 md:pb-8 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Missões Diárias</h1>
            <p className="text-muted-foreground">Complete tarefas e ganhe pontos todos os dias.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Suas Missões</CardTitle>
              <CardDescription>As missões são renovadas a cada 24 horas.</CardDescription>
            </CardHeader>
            <CardContent>
              {MISSIONS.length > 0 ? (
                <div className="space-y-4">
                  {MISSIONS.map((mission) => {
                    const isCompleted = completedMissions.includes(mission.id);
                    const isLoading = loadingMission === mission.id;
                    return (
                      <div key={mission.id} className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border">
                        <div className="flex items-center gap-4">
                          <Gift className={`w-6 h-6 ${isCompleted ? 'text-muted-foreground' : 'text-primary'}`} />
                          <div>
                            <p className={`font-semibold ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{mission.text}</p>
                            <p className={`text-sm ${isCompleted ? 'text-muted-foreground' : 'text-primary'}`}>Recompensa: {mission.points} pontos</p>
                          </div>
                        </div>
                        <Button onClick={() => handleMissionClick(mission.id, mission.points)} disabled={isCompleted || isLoading} variant={isCompleted ? "secondary" : "default"}>
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isCompleted ? "Concluído ✓" : "Coletar")}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  <p>Nenhuma missão disponível no momento.</p>
                  <p className="text-sm">Volte mais tarde para conferir as novas missões do dia!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DailyMissionsPage;