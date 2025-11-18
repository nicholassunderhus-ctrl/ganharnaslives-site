import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

// =================================================================================
// ATENÇÃO: Adicione as missões do dia aqui dentro desta lista.
//
// Exemplo:
// { id: 1, text: 'Clique para uma dose de sabedoria diária!', points: 10 },
// { id: 2, text: 'Descubra um fato inútil, mas divertido!', points: 10 },
// =================================================================================
const MISSIONS = [
  // Adicione as missões aqui
];

const DailyMissions: React.FC = () => {
  const [completedMissions, setCompletedMissions] = useState<number[]>([]);
  const [loadingMission, setLoadingMission] = useState<number | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('missionsLastResetDate');

    if (storedDate !== today) {
      localStorage.setItem('completedMissions', '[]');
      localStorage.setItem('missionsLastResetDate', today);
      setCompletedMissions([]);
    } else {
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
      // A lógica abaixo adiciona os pontos ao usuário no banco de dados.
      const { error } = await supabase.rpc('increment_points', { user_id_in: user.id, points_to_add: points });

      if (error) {
        throw error;
      }

      const updatedCompletedMissions = [...completedMissions, missionId];
      setCompletedMissions(updatedCompletedMissions);
      localStorage.setItem('completedMissions', JSON.stringify(updatedCompletedMissions));
      toast.success(`+${points} pontos foram adicionados à sua conta!`);

      // Invalida a query de pontos para forçar a atualização do saldo na UI
      await queryClient.invalidateQueries({ queryKey: ['userPoints', user.id] });

    } catch (error: any) {
      toast.error("Erro ao completar missão.", { description: error.message });
    } finally {
      setLoadingMission(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Missões Diárias</CardTitle>
        <CardDescription>
          Complete tarefas simples para ganhar pontos extras. As missões são renovadas a cada 24 horas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {MISSIONS.length > 0 ? (
          <div className="space-y-4">
            {MISSIONS.map((mission) => {
              const isCompleted = completedMissions.includes(mission.id);
              const isLoading = loadingMission === mission.id;
              return (
                <div
                  key={mission.id}
                  className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <Gift className={`w-6 h-6 ${isCompleted ? 'text-muted-foreground' : 'text-primary'}`} />
                    <div>
                      <p className={`font-semibold ${isCompleted ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {mission.text}
                      </p>
                      <p className={`text-sm ${isCompleted ? 'text-muted-foreground' : 'text-primary'}`}>
                        Recompensa: {mission.points} pontos
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleMissionClick(mission.id, mission.points)}
                    disabled={isCompleted || isLoading}
                    variant={isCompleted ? "secondary" : "default"}
                  >
                    {isLoading ? "Coletando..." : (isCompleted ? "Concluído ✓" : "Coletar")}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhuma missão disponível no momento.</p>
            <p className="text-sm">Volte mais tarde para conferir as novas missões do dia!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyMissions;