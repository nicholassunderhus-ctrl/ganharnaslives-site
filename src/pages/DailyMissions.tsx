import React, { useState, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { useUserPoints } from "@/hooks/useUserPoints";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Loader2, Ticket, Clock, Hourglass, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

import { AdMissionCard } from '@/components/AdMissionCard';
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
  const [anuncioAssistido, setAnuncioAssistido] = useState(false);
  const queryClient = useQueryClient();

  // --- Estados para as 10 novas missões de anúncio ---
  const [unlockedAdMissions, setUnlockedAdMissions] = useState<Record<number, boolean>>({});

  // --- Configuração Unificada das Missões de Anúncio (1 a 11) ---
  const AD_MISSIONS_CONFIG = Array.from({ length: 11 }, (_, i) => { // Gerar 11 missões (1 a 11)
    const missionNumber = i + 1; // Começa em 1
    return {
      missionId: 200 + missionNumber, // missionId 201 para a missão 1, 202 para a 2, etc.
      missionPoints: 20,
      title: `Missão Diária: Assistir Anúncio ${missionNumber === 1 ? '' : missionNumber}`, // Título para "Missão Diária: Assistir Anúncio" e "Missão Diária: Assistir Anúncio 2", etc.
      description: `Assista anúncios para ganhar 20 pontos.`,
      adLink: `https://stly.link/recompensadiaria${missionNumber}`, // Link de exemplo
      localStorageKey: `anuncio_bonus_${missionNumber}_liberado`,
      collectLink: `/recompensa-anuncio-${missionNumber}`,
    };
  });


  // --- Estados da Roleta ---
  const [rouletteSpun, setRouletteSpun] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<number | null>(null);

  // --- Estados da Missão de Tempo ---
  const [watchTime, setWatchTime] = useState(0); // Em segundos
  const WATCH_TIME_GOAL_1_HOUR = 3600; // 60 minutos em segundos
  const WATCH_TIME_GOAL_3_HOURS = 10800; // 180 minutos em segundos
  const WATCH_TIME_GOAL_6_HOURS = 21600; // 360 minutos em segundos

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
    } else {
      // É um novo dia, então o tempo assistido deve ser zerado tanto no estado quanto no localStorage.
      localStorage.setItem('totalWatchTimeToday', '0');
      setWatchTime(0);
    }

    localStorage.setItem('watchTimeDate', today); // Always update the date

    // Atualiza o tempo assistido a cada 5 segundos para manter a UI sincronizada
    const watchTimePoller = setInterval(() => {
      setWatchTime(Number(localStorage.getItem('totalWatchTimeToday') || '0'));
    }, 5000);

    return () => clearInterval(watchTimePoller);
  }, [user]); // Removida a dependência de completedMissions

  // Efeito para verificar se a missão de anúncio foi liberada
  useEffect(() => {
    const newUnlocked: Record<number, boolean> = {};
    AD_MISSIONS_CONFIG.forEach(config => {
      const isCompleted = JSON.parse(localStorage.getItem('completedMissions') || '[]').includes(config.missionId);
      if (localStorage.getItem(config.localStorageKey) === 'true' && !isCompleted) {
        newUnlocked[config.missionId] = true;
        toast.info(`${config.title.replace(' 1', '')} liberada! Clique em 'Coletar' para ganhar seus pontos.`); // Ajuste no toast para a missão 1
        localStorage.removeItem(config.localStorageKey);
      }
    });
    setUnlockedAdMissions(prev => ({ ...prev, ...newUnlocked }));
  }, [user, AD_MISSIONS_CONFIG]); // Removida a dependência de completedMissions

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
    // Otimisticamente atualiza a UI para prevenir cliques duplos
    setCompletedMissions(prev => [...prev, missionId]);

    try {
      const { error } = await supabase.rpc('increment_points', { user_id_in: user.id, points_to_add: points });
      if (error) throw error;

      // Apenas confirma a gravação no localStorage após o sucesso
      localStorage.setItem('completedMissions', JSON.stringify([...completedMissions, missionId]));
      toast.success(`+${points} pontos foram adicionados à sua conta!`);
      await queryClient.invalidateQueries({ queryKey: ['userPoints', user.id] });
    } catch (error: any) {
      toast.error("Erro ao completar missão.", { description: error.message });
      // Se der erro, reverte o estado da UI para permitir nova tentativa
      setCompletedMissions(prev => prev.filter(id => id !== missionId));
      localStorage.setItem('completedMissions', JSON.stringify(completedMissions.filter(id => id !== missionId)));
    } finally {
      setLoadingMission(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar points={userPoints?.points ?? 0} />
      <main className="md:ml-64 ml-0 pt-20 pb-24 md:pb-8 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
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

          {/* --- Grid de Missões de Tempo e Vídeo --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* --- Missões de Anúncio (1 a 11) --- */}
            {AD_MISSIONS_CONFIG.map((config) => (
              <Card key={config.missionId}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Gift className="w-6 h-6 text-primary" />{config.title.replace(' 1', '')}</CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card-foreground/5 rounded-lg border">
                    <div className="flex items-center gap-4 w-full">
                      <Gift className={`w-6 h-6 ${completedMissions.includes(config.missionId) ? 'text-green-500' : (unlockedAdMissions[config.missionId] ? 'text-primary' : 'text-muted-foreground')}`} />
                      <div>
                        <p className="font-semibold">Veja os anúncios para liberar a coleta.</p>
                        <p className="text-sm text-primary">Recompensa: {config.missionPoints} pts</p>
                      </div>
                    </div>
                    <div className="w-full sm:w-auto flex-shrink-0">
                      {completedMissions.includes(config.missionId) ? (<Button variant="secondary" disabled className="w-full">✓ Concluído</Button>) : unlockedAdMissions[config.missionId] ? (<Button onClick={() => handleMissionClick(config.missionId, config.missionPoints)} className="w-full" disabled={loadingMission === config.missionId}>{loadingMission === config.missionId ? <Loader2 className="w-4 h-4 animate-spin" /> : "Coletar"}</Button>) : (<a href={config.adLink} target="_blank" rel="noopener noreferrer" className="w-full"><Button className="w-full">Liberar Coleta</Button></a>)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Cards de Missão de Tempo Assistido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="w-6 h-6 text-primary" />Maratona de Lives</CardTitle>
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
                  <Button onClick={() => handleMissionClick(101, 20)} disabled={watchTime < WATCH_TIME_GOAL_1_HOUR || completedMissions.includes(101) || loadingMission === 101} variant={completedMissions.includes(101) ? "secondary" : "default"}>
                    {completedMissions.includes(101) ? "✓" : `(${Math.floor(watchTime / 60)}/60)`}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Card da Missão de Tempo Assistido (3 Horas) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Hourglass className="w-6 h-6 text-primary" />Maratona de Lives II</CardTitle>
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
                  <Button onClick={() => handleMissionClick(102, 40)} disabled={watchTime < WATCH_TIME_GOAL_3_HOURS || completedMissions.includes(102) || loadingMission === 102} variant={completedMissions.includes(102) ? "secondary" : "default"}>
                    {completedMissions.includes(102) ? "✓" : `(${Math.floor(watchTime / 60)}/180)`}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Card da Missão de Tempo Assistido (6 Horas) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Trophy className="w-6 h-6 text-primary" />Maratona de Lives III</CardTitle>
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
                  <Button onClick={() => handleMissionClick(103, 60)} disabled={watchTime < WATCH_TIME_GOAL_6_HOURS || completedMissions.includes(103) || loadingMission === 103} variant={completedMissions.includes(103) ? "secondary" : "default"}>
                    {completedMissions.includes(103) ? "✓" : `(${Math.floor(watchTime / 60)}/360)`}
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
};

export default DailyMissionsPage;