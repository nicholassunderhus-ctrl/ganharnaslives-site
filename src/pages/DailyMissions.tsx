import React, { useState, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { useUserPoints } from "@/hooks/useUserPoints";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Loader2, Ticket, Clock, Hourglass, Youtube, Trophy, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { YouTubeMissionPlayer } from '@/components/YouTubeMissionPlayer';
import { ExternalLink } from 'lucide-react';

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

// --- Configuração da Missão Shrtfly ---
const SHRTFLY_MISSION_ID = 201;
const SHRTFLY_MISSION_POINTS = 20;

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
  const WATCH_TIME_GOAL_12_HOURS = 43200; // 720 minutos em segundos

  // --- Estados da Missão de Vídeo ---
  const [showYoutubePlayer, setShowYoutubePlayer] = useState(false);
  const [youtubeMissionWatched, setYoutubeMissionWatched] = useState(false);
  const YOUTUBE_MISSION_ID = 104;

  // --- Estados da Missão de Vídeo 2 ---
  const [showYoutubePlayer2, setShowYoutubePlayer2] = useState(false);
  const [youtubeMission2Watched, setYoutubeMission2Watched] = useState(false);
  const YOUTUBE_MISSION_2_ID = 105;

  // --- Estados da Missão de Vídeo 3 ---
  const [showYoutubePlayer3, setShowYoutubePlayer3] = useState(false);
  const [youtubeMission3Watched, setYoutubeMission3Watched] = useState(false);
  const YOUTUBE_MISSION_3_ID = 106;

  // --- Estados da Missão de Vídeo 4 ---
  const [showYoutubePlayer4, setShowYoutubePlayer4] = useState(false);
  const [youtubeMission4Watched, setYoutubeMission4Watched] = useState(false);
  const YOUTUBE_MISSION_4_ID = 107;

  // --- Estados da Missão de Vídeo 5 ---
  const [showYoutubePlayer5, setShowYoutubePlayer5] = useState(false);
  const [youtubeMission5Watched, setYoutubeMission5Watched] = useState(false);
  const YOUTUBE_MISSION_5_ID = 108;

  // --- Estados da Missão de Vídeo 6 ---
  const [showYoutubePlayer6, setShowYoutubePlayer6] = useState(false);
  const [youtubeMission6Watched, setYoutubeMission6Watched] = useState(false);
  const YOUTUBE_MISSION_6_ID = 109; // ID da sexta missão de vídeo

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
      // Verifica se o vídeo foi assistido E se a missão ainda não foi completada
      const missions = JSON.parse(localStorage.getItem('completedMissions') || '[]');
      setYoutubeMissionWatched(!missions.includes(YOUTUBE_MISSION_ID));
    } else {
      // Se for um novo dia, reseta o status de "assistido"
      setYoutubeMissionWatched(false);
    }

    // Lógica para a missão do YouTube 2
    const youtubeMission2StoredDate = localStorage.getItem('youtubeMission2WatchedDate');
    if (youtubeMission2StoredDate === today) {
      const missions = JSON.parse(localStorage.getItem('completedMissions') || '[]');
      setYoutubeMission2Watched(!missions.includes(YOUTUBE_MISSION_2_ID));
    } else {
      setYoutubeMission2Watched(false);
    }

    // Lógica para a missão do YouTube 3
    const youtubeMission3StoredDate = localStorage.getItem('youtubeMission3WatchedDate');
    if (youtubeMission3StoredDate === today) {
      const missions = JSON.parse(localStorage.getItem('completedMissions') || '[]');
      setYoutubeMission3Watched(!missions.includes(YOUTUBE_MISSION_3_ID));
    } else {
      setYoutubeMission3Watched(false);
    }

    // Lógica para a missão do YouTube 4
    const youtubeMission4StoredDate = localStorage.getItem('youtubeMission4WatchedDate');
    if (youtubeMission4StoredDate === today) {
      const missions = JSON.parse(localStorage.getItem('completedMissions') || '[]');
      setYoutubeMission4Watched(!missions.includes(YOUTUBE_MISSION_4_ID));
    } else {
      setYoutubeMission4Watched(false);
    }

    // Lógica para a missão do YouTube 5
    const youtubeMission5StoredDate = localStorage.getItem('youtubeMission5WatchedDate');
    if (youtubeMission5StoredDate === today) {
      const missions = JSON.parse(localStorage.getItem('completedMissions') || '[]');
      setYoutubeMission5Watched(!missions.includes(YOUTUBE_MISSION_5_ID));
    } else {
      setYoutubeMission5Watched(false);
    }

    // Lógica para a missão do YouTube 6
    const youtubeMission6StoredDate = localStorage.getItem('youtubeMission6WatchedDate');
    if (youtubeMission6StoredDate === today) {
      const missions = JSON.parse(localStorage.getItem('completedMissions') || '[]');
      setYoutubeMission6Watched(!missions.includes(YOUTUBE_MISSION_6_ID));
    } else {
      setYoutubeMission6Watched(false);
    }

    // Atualiza o tempo assistido a cada 5 segundos para manter a UI sincronizada
    const watchTimePoller = setInterval(() => {
      setWatchTime(Number(localStorage.getItem('totalWatchTimeToday') || '0'));
    }, 5000);

    return () => clearInterval(watchTimePoller);
  }, []);

  // Efeito para lidar com a recompensa da missão do Shrtfly
  useEffect(() => {
    const handleShrtflyReward = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('recompensa') === 'missao_diaria_shrtfly' && user) {
        // Remove o parâmetro da URL para evitar reprocessamento
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        // Verifica se a missão já foi completada hoje para não creditar duas vezes
        if (!completedMissions.includes(SHRTFLY_MISSION_ID)) {
          await handleMissionClick(SHRTFLY_MISSION_ID, SHRTFLY_MISSION_POINTS);
        } else {
          toast.info("Você já completou esta missão hoje!");
        }
      }
    };

    // Atraso para garantir que o estado `user` e `completedMissions` esteja carregado
    if (user) {
      handleShrtflyReward();
    }
  });

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

  const handleVideo2End = () => {
    toast.info("Vídeo 2 concluído! Você já pode coletar sua recompensa.");
    setYoutubeMission2Watched(true);
    localStorage.setItem('youtubeMission2WatchedDate', new Date().toDateString());
    setShowYoutubePlayer2(false); // Fecha o player 2 automaticamente
  };

  const handleVideo3End = () => {
    toast.info("Vídeo 3 concluído! Você já pode coletar sua recompensa.");
    setYoutubeMission3Watched(true);
    localStorage.setItem('youtubeMission3WatchedDate', new Date().toDateString());
    setShowYoutubePlayer3(false); // Fecha o player 3 automaticamente
  };

  const handleVideo4End = () => {
    toast.info("Vídeo 4 concluído! Você já pode coletar sua recompensa.");
    setYoutubeMission4Watched(true);
    localStorage.setItem('youtubeMission4WatchedDate', new Date().toDateString());
    setShowYoutubePlayer4(false); // Fecha o player 4 automaticamente
  };

  const handleVideo5End = () => {
    toast.info("Vídeo 5 concluído! Você já pode coletar sua recompensa.");
    setYoutubeMission5Watched(true);
    localStorage.setItem('youtubeMission5WatchedDate', new Date().toDateString());
    setShowYoutubePlayer5(false); // Fecha o player 5 automaticamente
  };

  const handleVideo6End = () => {
    toast.info("Vídeo 6 concluído! Você já pode coletar sua recompensa.");
    setYoutubeMission6Watched(true);
    localStorage.setItem('youtubeMission6WatchedDate', new Date().toDateString());
    setShowYoutubePlayer6(false); // Fecha o player 6 automaticamente
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

          {/* --- Roleta Diária --- */}
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

          {/* --- Missão Diária: Assistir Anúncio --- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-6 h-6 text-primary" />
                Missão Diária: Assistir Anúncio
              </CardTitle>
              <CardDescription>Ganhe {SHRTFLY_MISSION_POINTS} pontos por assistir aos anúncios do nosso parceiro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Clique no botão abaixo para acessar o site parceiro. Você precisará visualizar os anúncios até o final para ser redirecionado de volta e receber sua recompensa.
              </p>
              <Button 
                asChild 
                className="w-full md:w-auto"
                disabled={completedMissions.includes(SHRTFLY_MISSION_ID)}
              >
                <a href="https://stly.link/recompensadiaria" target="_blank" rel="noopener noreferrer">
                  {completedMissions.includes(SHRTFLY_MISSION_ID) ? 'Missão Concluída ✓' : 'Coletar Recompensa'}
                  {!completedMissions.includes(SHRTFLY_MISSION_ID) && <ExternalLink className="w-4 h-4 ml-2" />}
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* --- Grid de Missões de Tempo e Vídeo --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card da Missão de Tempo Assistido (1 Hora) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-6 h-6 text-primary" />
                  Maratona de Lives
                </CardTitle>
                <CardDescription>Acumule 1 hora de tempo assistido hoje.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <Gift className={`w-6 h-6 ${watchTime >= WATCH_TIME_GOAL_1_HOUR ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-semibold">Assista 60 min</p>
                      <p className="text-sm text-primary">Recompensa: 20 pts</p>
                    </div>
                  </div>
                  <Button onClick={() => handleMissionClick(101, 20)} disabled={watchTime < WATCH_TIME_GOAL_1_HOUR || completedMissions.includes(101)} variant={completedMissions.includes(101) ? "secondary" : "default"}>
                    {completedMissions.includes(101) ? "✓" : `(${Math.floor(watchTime / 60)}/60)`}
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
                <CardDescription>Acumule 3 horas de tempo assistido hoje.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <Gift className={`w-6 h-6 ${watchTime >= WATCH_TIME_GOAL_3_HOURS ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-semibold">Assista 180 min</p>
                      <p className="text-sm text-primary">Recompensa: 40 pts</p>
                    </div>
                  </div>
                  <Button onClick={() => handleMissionClick(102, 40)} disabled={watchTime < WATCH_TIME_GOAL_3_HOURS || completedMissions.includes(102)} variant={completedMissions.includes(102) ? "secondary" : "default"}>
                    {completedMissions.includes(102) ? "✓" : `(${Math.floor(watchTime / 60)}/180)`}
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
                <CardDescription>Acumule 6 horas de tempo assistido hoje.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <Gift className={`w-6 h-6 ${watchTime >= WATCH_TIME_GOAL_6_HOURS ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-semibold">Assista 360 min</p>
                      <p className="text-sm text-primary">Recompensa: 60 pts</p>
                    </div>
                  </div>
                  <Button onClick={() => handleMissionClick(103, 60)} disabled={watchTime < WATCH_TIME_GOAL_6_HOURS || completedMissions.includes(103)} variant={completedMissions.includes(103) ? "secondary" : "default"}>
                    {completedMissions.includes(103) ? "✓" : `(${Math.floor(watchTime / 60)}/360)`}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Card da Missão de Tempo Assistido (12 Horas) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-6 h-6 text-primary" />
                  Maratona Lendária
                </CardTitle>
                <CardDescription>Acumule 12 horas de tempo assistido hoje.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <Gift className={`w-6 h-6 ${watchTime >= WATCH_TIME_GOAL_12_HOURS ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-semibold">Assista 720 min</p>
                      <p className="text-sm text-primary">Recompensa: 120 pts</p>
                    </div>
                  </div>
                  <Button onClick={() => handleMissionClick(104, 120)} disabled={watchTime < WATCH_TIME_GOAL_12_HOURS || completedMissions.includes(104)} variant={completedMissions.includes(104) ? "secondary" : "default"}>
                    {completedMissions.includes(104) ? "✓" : `(${Math.floor(watchTime / 60)}/720)`}
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
                <CardDescription>Assista ao vídeo completo.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <Gift className={`w-6 h-6 ${youtubeMissionWatched ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-semibold">Vídeo do dia</p>
                      <p className="text-sm text-primary">Recompensa: 20 pts</p>
                    </div>
                  </div>
                  {completedMissions.includes(YOUTUBE_MISSION_ID) ? (
                    <Button variant="secondary" disabled>✓</Button>
                  ) : youtubeMissionWatched ? (
                    <Button onClick={() => handleMissionClick(YOUTUBE_MISSION_ID, 20)}>Coletar</Button>
                  ) : (
                    <Button onClick={() => setShowYoutubePlayer(true)}>Assistir</Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Card da Missão de Vídeo do YouTube 2 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="w-6 h-6 text-primary" />
                  Vídeo Premiado 2
                </CardTitle>
                <CardDescription>Assista a outro vídeo completo.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <Gift className={`w-6 h-6 ${youtubeMission2Watched ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-semibold">Vídeo do dia 2</p>
                      <p className="text-sm text-primary">Recompensa: 20 pts</p>
                    </div>
                  </div>
                  {completedMissions.includes(YOUTUBE_MISSION_2_ID) ? (
                    <Button variant="secondary" disabled>✓</Button>
                  ) : youtubeMission2Watched ? (
                    <Button onClick={() => handleMissionClick(YOUTUBE_MISSION_2_ID, 20)}>Coletar</Button>
                  ) : (
                    <Button onClick={() => setShowYoutubePlayer2(true)}>Assistir</Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card da Missão de Vídeo do YouTube 3 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="w-6 h-6 text-primary" />
                  Vídeo Premiado 3
                </CardTitle>
                <CardDescription>Assista a este vídeo especial.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <Gift className={`w-6 h-6 ${youtubeMission3Watched ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-semibold">Vídeo do dia 3</p>
                      <p className="text-sm text-primary">Recompensa: 20 pts</p>
                    </div>
                  </div>
                  {completedMissions.includes(YOUTUBE_MISSION_3_ID) ? (
                    <Button variant="secondary" disabled>✓</Button>
                  ) : youtubeMission3Watched ? (
                    <Button onClick={() => handleMissionClick(YOUTUBE_MISSION_3_ID, 20)}>Coletar</Button>
                  ) : (
                    <Button onClick={() => setShowYoutubePlayer3(true)}>Assistir</Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card da Missão de Vídeo do YouTube 4 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="w-6 h-6 text-primary" />
                  Vídeo Premiado 4
                </CardTitle>
                <CardDescription>Assista a este vídeo para uma recompensa.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <Gift className={`w-6 h-6 ${youtubeMission4Watched ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-semibold">Vídeo do dia 4</p>
                      <p className="text-sm text-primary">Recompensa: 20 pts</p>
                    </div>
                  </div>
                  {completedMissions.includes(YOUTUBE_MISSION_4_ID) ? (
                    <Button variant="secondary" disabled>✓</Button>
                  ) : youtubeMission4Watched ? (
                    <Button onClick={() => handleMissionClick(YOUTUBE_MISSION_4_ID, 20)}>Coletar</Button>
                  ) : (
                    <Button onClick={() => setShowYoutubePlayer4(true)}>Assistir</Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card da Missão de Vídeo do YouTube 5 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="w-6 h-6 text-primary" />
                  Vídeo Premiado 5
                </CardTitle>
                <CardDescription>Assista a este vídeo para uma recompensa.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <Gift className={`w-6 h-6 ${youtubeMission5Watched ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-semibold">Vídeo do dia 5</p>
                      <p className="text-sm text-primary">Recompensa: 20 pts</p>
                    </div>
                  </div>
                  {completedMissions.includes(YOUTUBE_MISSION_5_ID) ? (
                    <Button variant="secondary" disabled>✓</Button>
                  ) : youtubeMission5Watched ? (
                    <Button onClick={() => handleMissionClick(YOUTUBE_MISSION_5_ID, 20)}>Coletar</Button>
                  ) : (
                    <Button onClick={() => setShowYoutubePlayer5(true)}>Assistir</Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card da Missão de Vídeo do YouTube 6 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="w-6 h-6 text-primary" />
                  Vídeo Premiado 6
                </CardTitle>
                <CardDescription>Assista a este vídeo para uma recompensa.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <Gift className={`w-6 h-6 ${youtubeMission6Watched ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-semibold">Vídeo do dia 6</p>
                      <p className="text-sm text-primary">Recompensa: 20 pts</p>
                    </div>
                  </div>
                  {completedMissions.includes(YOUTUBE_MISSION_6_ID) ? (
                    <Button variant="secondary" disabled>✓</Button>
                  ) : youtubeMission6Watched ? (
                    <Button onClick={() => handleMissionClick(YOUTUBE_MISSION_6_ID, 20)}>Coletar</Button>
                  ) : (
                    <Button onClick={() => setShowYoutubePlayer6(true)}>Assistir</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="pt-6">
            <h3 className="text-xl font-bold mb-2">Outras Missões</h3>
            <p className="text-sm text-muted-foreground">As missões são renovadas a cada 24 horas.</p>
            {MISSIONS.length > 0 && (
              <div className="mt-4 space-y-4">
                {MISSIONS.map((mission) => {
                  const isCompleted = completedMissions.includes(mission.id);
                  const isLoading = loadingMission === mission.id;
                  return (
                    <div key={mission.id} className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border">
                      {/* ... (código para renderizar missões manuais) ... */}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {showYoutubePlayer && (
        <YouTubeMissionPlayer
          videoId="ZKNy0BRxe84"
          onVideoEnd={handleVideoEnd}
          onClose={() => setShowYoutubePlayer(false)}
        />
      )}

      {showYoutubePlayer2 && (
        <YouTubeMissionPlayer
          videoId="2hHEJ2asvY8"
          onVideoEnd={handleVideo2End}
          onClose={() => setShowYoutubePlayer2(false)}
        />
      )}

      {showYoutubePlayer3 && (
        <YouTubeMissionPlayer
          videoId="-frPxUMQnhE"
          onVideoEnd={handleVideo3End}
          onClose={() => setShowYoutubePlayer3(false)}
        />
      )}

      {showYoutubePlayer4 && (
        <YouTubeMissionPlayer
          videoId="Sck3A-XewOY"
          onVideoEnd={handleVideo4End}
          onClose={() => setShowYoutubePlayer4(false)}
        />
      )}

      {showYoutubePlayer5 && (
        <YouTubeMissionPlayer
          videoId="irJbA0QvMUg"
          onVideoEnd={handleVideo5End}
          onClose={() => setShowYoutubePlayer5(false)}
        />
      )}

      {showYoutubePlayer6 && (
        <YouTubeMissionPlayer
          videoId="7KVNNS-vQog"
          onVideoEnd={handleVideo6End}
          onClose={() => setShowYoutubePlayer6(false)}
        />
      )}
    </div>
  );
};

export default DailyMissionsPage;