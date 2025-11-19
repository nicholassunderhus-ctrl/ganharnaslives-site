import React, { useState, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { useUserPoints } from "@/hooks/useUserPoints";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Gift, Loader2, Ticket, Clock, Hourglass, Youtube, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { YouTubeMissionPlayer } from '@/components/YouTubeMissionPlayer';

// =================================================================================
// ATENÇÃO: Adicione as missões do dia aqui dentro desta lista (máximo 10).
// A roleta diária já está configurada e não precisa ser adicionada aqui.
// =================================================================================
const MISSIONS: { id: number; text: string; points: number }[] = [
  // Exemplo: { id: 1, text: 'Resgate seu bônus de login!', points: 50 },
];

// --- Configuração da Roleta ---
const ROULETTE_PRIZES = [
  { points: 10, weight: 40 },  // 40% de chance
  { points: 20, weight: 30 },  // 30% de chance
  { points: 30, weight: 15 },  // 15% de chance
  { points: 50, weight: 10 },  // 10% de chance
  { points: 100, weight: 5 }, // 5% de chance
];
const totalWeight = ROULETTE_PRIZES.reduce((sum, prize) => sum + prize.weight, 0);

const DailyMissionsPage = () => {
  const { userPoints } = useUserPoints();
  const [completedMissions, setCompletedMissions] = useState<number[]>([]);
  const [loadingMission, setLoadingMission] = useState<number | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // --- Estados da Roleta ---
  const [rouletteSpun, setRouletteSpun] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<number | null>(null);

  // --- Estados da Missão de Tempo ---
  const [watchTime, setWatchTime] = useState(0); // Em segundos
  const WATCH_TIME_GOAL_1_HOUR = 3600; // 60 minutos em segundos
  const WATCH_TIME_GOAL_3_HOURS = 10800; // 180 minutos em segundos
  const WATCH_TIME_GOAL_6_HOURS = 21600; // 360 minutos em segundos

  // --- Estados da Missão de Vídeo ---
  const [showYoutubePlayer, setShowYoutubePlayer] = useState(false);
  const [youtubeMissionWatched, setYoutubeMissionWatched] = useState(false);
  const YOUTUBE_MISSION_ID = 104;

  useEffect(() => {
    const today = new Date().toDateString();
    
    // Lógica para as missões normais
    const missionsStoredDate = localStorage.getItem('missionsLastResetDate');
    if (missionsStoredDate !== today) {
      localStorage.setItem('completedMissions', '[]');
      localStorage.setItem('missionsLastResetDate', today);
      setCompletedMissions([]);
    } else {
      const storedCompleted = JSON.parse(localStorage.getItem('completedMissions') || '[]');
      setCompletedMissions(storedCompleted);
    }

    // Lógica para a roleta
    const rouletteStoredDate = localStorage.getItem('rouletteLastSpinDate');
    if (rouletteStoredDate !== today) {
      localStorage.removeItem('rouletteResult');
      setRouletteSpun(false);
      setRouletteResult(null);
    } else {
      const storedResult = localStorage.getItem('rouletteResult');
      if (storedResult) {
        setRouletteSpun(true);
        setRouletteResult(Number(storedResult));
      }
    }

    // Lógica para o tempo assistido
    const watchTimeStoredDate = localStorage.getItem('watchTimeDate');
    if (watchTimeStoredDate === today) {
      setWatchTime(Number(localStorage.getItem('totalWatchTimeToday') || '0'));
    }

    // Lógica para a missão do YouTube
    const youtubeMissionStoredDate = localStorage.getItem('youtubeMissionWatchedDate');
    if (youtubeMissionStoredDate === today) {
      setYoutubeMissionWatched(true);
    } else {
      // Se for um novo dia, reseta o status de "assistido"
      setYoutubeMissionWatched(false);
    }

    // Atualiza o tempo assistido a cada 5 segundos para manter a UI sincronizada
    const watchTimePoller = setInterval(() => {
      setWatchTime(Number(localStorage.getItem('totalWatchTimeToday') || '0'));
    }, 5000);

    return () => clearInterval(watchTimePoller);
  }, []);

  const handleSpinRoulette = async () => {
    if (rouletteSpun || !user) return;

    setIsSpinning(true);

    // Simula a animação da roleta
    const spinDuration = 3000; // 3 segundos
    const spinInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * ROULETTE_PRIZES.length);
      setRouletteResult(ROULETTE_PRIZES[randomIndex].points);
    }, 100);

    // Determina o prêmio final
    let random = Math.random() * totalWeight;
    let finalPrize = 0;
    for (const prize of ROULETTE_PRIZES) {
      if (random < prize.weight) {
        finalPrize = prize.points;
        break;
      }
      random -= prize.weight;
    }

    // Aguarda a animação terminar
    setTimeout(async () => {
      clearInterval(spinInterval);
      setRouletteResult(finalPrize);
      setIsSpinning(false);
      setRouletteSpun(true);

      // Salva o resultado e a data
      const today = new Date().toDateString();
      localStorage.setItem('rouletteLastSpinDate', today);
      localStorage.setItem('rouletteResult', String(finalPrize));

      // Adiciona os pontos ao usuário
      try {
        const { error } = await supabase.rpc('increment_points', { user_id_in: user.id, points_to_add: finalPrize });
        if (error) throw error;
        toast.success(`Você ganhou ${finalPrize} pontos na roleta!`);
        await queryClient.invalidateQueries({ queryKey: ['userPoints', user.id] });
      } catch (error: any) {
        toast.error("Erro ao creditar pontos da roleta.", { description: error.message });
      }
    }, spinDuration);
  };

  const handleMissionClick = async (missionId: number, points: number) => {
    if (completedMissions.includes(missionId) || !user) return;

    setLoadingMission(missionId);

    try {
      const { error } = await supabase.rpc('increment_points', { user_id_in: user.id, points_to_add: points });
      if (error) throw error;

      const updatedCompletedMissions = [...completedMissions, missionId];
      setCompletedMissions(updatedCompletedMissions);
      localStorage.setItem('completedMissions', JSON.stringify(updatedCompletedMissions));
      toast.success(`+${points} pontos foram adicionados à sua conta!`);
      await queryClient.invalidateQueries({ queryKey: ['userPoints', user.id] });
    } catch (error: any) {
      toast.error("Erro ao completar missão.", { description: error.message });
    } finally {
      setLoadingMission(null);
    }
  };

  const handleVideoEnd = () => {
    toast.info("Vídeo concluído! Você já pode coletar sua recompensa.");
    setYoutubeMissionWatched(true);
    localStorage.setItem('youtubeMissionWatchedDate', new Date().toDateString());
    setShowYoutubePlayer(false); // Fecha o player automaticamente
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

          {/* Card da Roleta Diária */}
          <Card className="bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-6 h-6 text-primary" />
                Roleta Diária da Sorte
              </CardTitle>
              <CardDescription>Gire uma vez por dia e teste sua sorte para ganhar pontos extras!</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6 text-center">
              <div className="w-48 h-48 bg-background/50 rounded-full flex items-center justify-center border-4 border-primary/20 shadow-lg">
                <span className={cn("text-5xl font-bold transition-all duration-100", isSpinning ? "text-muted-foreground" : "text-primary")}>
                  {rouletteResult ?? '?'}
                </span>
              </div>
              {rouletteSpun ? (
                <p className="font-semibold text-lg">Você ganhou {rouletteResult} pontos hoje! Volte amanhã.</p>
              ) : (
                <Button onClick={handleSpinRoulette} disabled={isSpinning} size="lg" variant="gradient">
                  {isSpinning ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  {isSpinning ? 'Girando...' : 'Girar a Roleta!'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Card da Missão de Tempo Assistido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-primary" />
                Maratona de Lives
              </CardTitle>
              <CardDescription>Acumule 1 hora de tempo assistido hoje para ganhar uma recompensa.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border">
                <div className="flex items-center gap-4">
                  <Gift className={`w-6 h-6 ${watchTime >= WATCH_TIME_GOAL_1_HOUR ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-semibold">Assista 60 minutos de lives</p>
                    <p className="text-sm text-primary">Recompensa: 20 pontos</p>
                  </div>
                </div>
                <Button onClick={() => handleMissionClick(101, 20)} disabled={watchTime < WATCH_TIME_GOAL_1_HOUR || completedMissions.includes(101)} variant={completedMissions.includes(101) ? "secondary" : "default"}>
                  {completedMissions.includes(101) ? "Concluído ✓" : `Coletar (${Math.floor(watchTime / 60)}/60 min)`}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card da Missão de Tempo Assistido (3 Horas) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hourglass className="w-6 h-6 text-primary" />
                Maratona de Lives II
              </CardTitle>
              <CardDescription>Acumule 3 horas de tempo assistido hoje para ganhar uma recompensa extra.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border">
                <div className="flex items-center gap-4">
                  <Gift className={`w-6 h-6 ${watchTime >= WATCH_TIME_GOAL_3_HOURS ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-semibold">Assista 180 minutos de lives</p>
                    <p className="text-sm text-primary">Recompensa: 40 pontos</p>
                  </div>
                </div>
                <Button onClick={() => handleMissionClick(102, 40)} disabled={watchTime < WATCH_TIME_GOAL_3_HOURS || completedMissions.includes(102)} variant={completedMissions.includes(102) ? "secondary" : "default"}>
                  {completedMissions.includes(102) ? "Concluído ✓" : `Coletar (${Math.floor(watchTime / 60)}/180 min)`}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card da Missão de Tempo Assistido (6 Horas) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-primary" />
                Maratona de Lives III
              </CardTitle>
              <CardDescription>Acumule 6 horas de tempo assistido hoje para a recompensa máxima.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border">
                <div className="flex items-center gap-4">
                  <Gift className={`w-6 h-6 ${watchTime >= WATCH_TIME_GOAL_6_HOURS ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-semibold">Assista 360 minutos de lives</p>
                    <p className="text-sm text-primary">Recompensa: 60 pontos</p>
                  </div>
                </div>
                <Button onClick={() => handleMissionClick(103, 60)} disabled={watchTime < WATCH_TIME_GOAL_6_HOURS || completedMissions.includes(103)} variant={completedMissions.includes(103) ? "secondary" : "default"}>
                  {completedMissions.includes(103) ? "Concluído ✓" : `Coletar (${Math.floor(watchTime / 60)}/360 min)`}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card da Missão de Vídeo do YouTube */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="w-6 h-6 text-primary" />
                Vídeo Premiado
              </CardTitle>
              <CardDescription>Assista ao vídeo completo para desbloquear sua recompensa.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border">
                <div className="flex items-center gap-4">
                  <Gift className={`w-6 h-6 ${youtubeMissionWatched ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-semibold">Assista ao vídeo do dia</p>
                    <p className="text-sm text-primary">Recompensa: 20 pontos</p>
                  </div>
                </div>
                {completedMissions.includes(YOUTUBE_MISSION_ID) ? (
                  <Button variant="secondary" disabled>Concluído ✓</Button>
                ) : youtubeMissionWatched ? (
                  <Button onClick={() => handleMissionClick(YOUTUBE_MISSION_ID, 20)}>Coletar</Button>
                ) : (
                  <Button onClick={() => setShowYoutubePlayer(true)}>Assistir Vídeo</Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Missões Manuais */}
          <Card>
            <CardHeader>
              <CardTitle>Outras Missões</CardTitle>
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

      {showYoutubePlayer && (
        <YouTubeMissionPlayer
          videoId="ZKNy0BRxe84"
          onVideoEnd={handleVideoEnd}
          onClose={() => setShowYoutubePlayer(false)}
        />
      )}
    </div>
  );
};

export default DailyMissionsPage;