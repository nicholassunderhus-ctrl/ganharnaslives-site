import React, { useState, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { useUserPoints } from "@/hooks/useUserPoints";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Loader2, Ticket, Clock, Hourglass, Trophy, Eye } from 'lucide-react';
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
  { points: 10, weight: 50 },  // 50% de chance
  { points: 20, weight: 30 },  // 30% de chance
  { points: 30, weight: 18 },  // 18% de chance
  { points: 50, weight: 2 },   // 2% de chance (muito raro)
];
const totalWeight = ROULETTE_PRIZES.reduce((sum, prize) => sum + prize.weight, 0);

// --- Configuração das Missões "Ver Anúncios" ---
const VER_ANUNCIOS_MISSIONS = Array.from({ length: 6 }, (_, i) => ({
  id: 301 + i, // IDs de 301 a 306
  title: `Ver Anúncio ${i + 1}`,
  points: 10,
  // Link externo do anúncio (seu encurtador)
  adLink:
    i === 0 ? 'https://cuty.io/missao1' :
    i === 1 ? 'https://stly.link/missao2' :
    i === 2 ? 'https://encurtandourl.com/missao3' :
    i === 3 ? 'https://4br.me/missao4' :
    i === 4 ? 'https://tpi.li/missao5' :
    i === 5 ? 'https://liink.uk/missao6' : '#',
  // Links de validação para as missões
  validationLink:
    i === 0 ? '/recompensa/validar-anuncio-id-va1-a1b2c3' :
    i === 1 ? '/recompensa/validar-anuncio-id-va2-d4e5f6' :
    i === 2 ? '/recompensa/validar-anuncio-id-va3-g7h8i9' :
    i === 3 ? '/recompensa/validar-anuncio-id-va4-j1k2l3' :
    i === 4 ? '/recompensa/validar-anuncio-id-va5-m4n5o6' :
    i === 5 ? '/recompensa/validar-anuncio-id-va6-p7q8r9' : '#',
  localStorageKey: `ver_anuncio_${i + 1}_liberado`,
}));

// Pega os IDs das missões para facilitar o uso
const VER_ANUNCIO_1_MISSION_ID = VER_ANUNCIOS_MISSIONS[0].id;
const VER_ANUNCIO_2_MISSION_ID = VER_ANUNCIOS_MISSIONS[1].id;
const VER_ANUNCIO_3_MISSION_ID = VER_ANUNCIOS_MISSIONS[2].id;
const VER_ANUNCIO_4_MISSION_ID = VER_ANUNCIOS_MISSIONS[3].id;
const VER_ANUNCIO_5_MISSION_ID = VER_ANUNCIOS_MISSIONS[4].id;
const VER_ANUNCIO_6_MISSION_ID = VER_ANUNCIOS_MISSIONS[5].id;

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
  const WATCH_TIME_GOAL_1 = 10800; // 180 minutos em segundos
  const WATCH_TIME_GOAL_2 = 21600; // 360 minutos em segundos
  const WATCH_TIME_GOAL_3 = 43200; // 720 minutos em segundos

  // --- Estado para as missões "Ver Anúncios" ---
  const [unlockedVerAnuncios, setUnlockedVerAnuncios] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const today = new Date().toDateString();
    
    // Lógica para as missões normais
    const missionsStoredDate = localStorage.getItem('missionsLastResetDate');
    if (missionsStoredDate !== today) {
      localStorage.setItem('completedMissions', '[]');
      localStorage.setItem('missionsLastResetDate', today);
      // Limpa também as missões liberadas no novo dia
      localStorage.setItem('unlockedMissions', '{}');
      setCompletedMissions([]);
      setUnlockedVerAnuncios({});
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
  }, [completedMissions, user]); // Adicionado completedMissions e user como dependências

  // Efeito para verificar a liberação de TODAS as missões "Ver Anúncio"
  useEffect(() => {
    // Carrega as missões já liberadas do localStorage ao iniciar
    const storedUnlocked = JSON.parse(localStorage.getItem('unlockedMissions') || '{}');
    setUnlockedVerAnuncios(storedUnlocked);

    const checkUnlockedMissions = () => {
      let newUnlocked: Record<number, boolean> = { ...storedUnlocked };
      let hasNewUnlock = false;

      VER_ANUNCIOS_MISSIONS.forEach(mission => {
        const liberado = localStorage.getItem(mission.localStorageKey);
        if (liberado === 'true' && !completedMissions.includes(mission.id) && !newUnlocked[mission.id]) {
          newUnlocked[mission.id] = true;
          hasNewUnlock = true;
          toast.info(`Missão '${mission.title}' liberada! Clique em 'Coletar' para ganhar seus pontos.`);
          localStorage.removeItem(mission.localStorageKey); // Remove a chave de liberação individual
        }
      });

      if (hasNewUnlock) {
        localStorage.setItem('unlockedMissions', JSON.stringify(newUnlocked));
        setUnlockedVerAnuncios(newUnlocked);
      }
    };

    checkUnlockedMissions();
  }, [completedMissions]);

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
    } finally {
      setLoadingMission(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar points={userPoints?.points ?? 0} />
      <main className="md:ml-64 ml-0 pt-20 pb-24 md:pb-8 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8 pt-4 md:pt-0">
          {/* --- Roleta Diária --- */}
          <Card className="bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="items-center text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold uppercase md:text-2xl">
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
          <Card>
            <CardHeader className="items-center text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold uppercase md:text-2xl">
                <Clock className="w-6 h-6 text-primary" />Maratona de Lives
              </CardTitle>
              <CardDescription>Ganhe pontos por assistir lives por um tempo acumulado hoje.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Missão 1: 180 min */}
              <div className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border">
                <div className="flex items-center gap-4">
                  <Gift className={`w-6 h-6 ${watchTime >= WATCH_TIME_GOAL_1 ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-semibold">Assista 180 min</p>
                    <p className="text-sm text-primary">Recompensa: 70 pts</p>
                  </div>
                </div>
                <Button onClick={() => handleMissionClick(101, 70)} disabled={watchTime < WATCH_TIME_GOAL_1 || completedMissions.includes(101) || loadingMission === 101} variant={completedMissions.includes(101) ? "secondary" : "default"}>
                  {completedMissions.includes(101) ? "✓" : `(${Math.floor(watchTime / 60)}/180)`}
                </Button>
              </div>

              {/* Missão 2: 360 min */}
              <div className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border">
                <div className="flex items-center gap-4">
                  <Gift className={`w-6 h-6 ${watchTime >= WATCH_TIME_GOAL_2 ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-semibold">Assista 360 min</p>
                    <p className="text-sm text-primary">Recompensa: 80 pts</p>
                  </div>
                </div>
                <Button onClick={() => handleMissionClick(102, 80)} disabled={watchTime < WATCH_TIME_GOAL_2 || completedMissions.includes(102) || loadingMission === 102} variant={completedMissions.includes(102) ? "secondary" : "default"}>
                  {completedMissions.includes(102) ? "✓" : `(${Math.floor(watchTime / 60)}/360)`}
                </Button>
              </div>

              {/* Missão 3: 720 min */}
              <div className="flex items-center justify-between p-4 bg-card-foreground/5 rounded-lg border">
                <div className="flex items-center gap-4">
                  <Gift className={`w-6 h-6 ${watchTime >= WATCH_TIME_GOAL_3 ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-semibold">Assista 720 min</p>
                    <p className="text-sm text-primary">Recompensa: 150 pts</p>
                  </div>
                </div>
                <Button onClick={() => handleMissionClick(103, 150)} disabled={watchTime < WATCH_TIME_GOAL_3 || completedMissions.includes(103) || loadingMission === 103} variant={completedMissions.includes(103) ? "secondary" : "default"}>
                  {completedMissions.includes(103) ? "✓" : `(${Math.floor(watchTime / 60)}/720)`}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* --- Categoria Missão: Ver Anúncios --- */}
          <Card>
            <CardHeader className="items-center text-center">
              <CardTitle className="text-xl font-bold md:text-2xl">
                GANHAR VENDO ANÚNCIOS
              </CardTitle>
              <CardDescription>Você assiste em média 10 anúncios / Média 1min</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {VER_ANUNCIOS_MISSIONS.map((mission, i) => {
                  const isCompleted = completedMissions.includes(mission.id);
                  const isUnlocked = unlockedVerAnuncios[mission.id];
                  const isLoadingThis = loadingMission === mission.id;
                  // Define quais missões são funcionais (todas as 9)
                  const isFunctional = i <= 8;

                  return (
                    <div key={mission.id} className={`p-4 bg-card-foreground/5 rounded-lg border flex flex-col items-center text-center space-y-3 ${!isFunctional && 'opacity-50'}`}>
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                        <Gift className={`w-6 h-6 ${isCompleted ? 'text-green-500' : (isUnlocked ? 'text-primary' : 'text-muted-foreground')}`} />
                      </div>
                      <div>
                        <p className="font-semibold">{mission.title}</p>
                        <p className="text-sm text-primary">Recompensa: {mission.points} pts</p>
                      </div>
                      {isCompleted ? (
                        <Button variant="secondary" disabled className="w-full">✓ Concluído</Button>
                      ) : isUnlocked ? (
                        <Button onClick={() => handleMissionClick(mission.id, mission.points)} className="w-full" disabled={isLoadingThis}>
                          {isLoadingThis ? <Loader2 className="w-4 h-4 animate-spin" /> : "Coletar"}
                        </Button>
                      ) : (
                        <a href={isFunctional ? mission.adLink : '#'} target="_blank" rel="noopener noreferrer" className="w-full">
                           <Button variant="outline" size="sm" className="w-full" disabled={!isFunctional}>Ver Anúncio</Button>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DailyMissionsPage;