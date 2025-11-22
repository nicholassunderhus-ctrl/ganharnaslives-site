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
  { points: 10, weight: 40 },  // 40% de chance
  { points: 20, weight: 30 },  // 30% de chance
  { points: 30, weight: 15 },  // 15% de chance
  { points: 50, weight: 10 },  // 10% de chance
  { points: 100, weight: 5 }, // 5% de chance
];
const totalWeight = ROULETTE_PRIZES.reduce((sum, prize) => sum + prize.weight, 0);

// --- Configuração das Missões "Ver Anúncios" ---
const VER_ANUNCIOS_MISSIONS = Array.from({ length: 9 }, (_, i) => ({
  id: 301 + i, // IDs de 301 a 309
  title: `Ver Anúncio ${i + 1}`,
  points: 20,
  // Link externo do anúncio (seu encurtador)
  adLink:
    i === 0 ? 'https://stly.link/missao1' :
    i === 1 ? 'https://fir3.net/missao2' :
    i === 2 ? 'https://tpi.li/missao3' : 
    i === 3 ? 'https://gplinks.co/missao4' :
    i === 4 ? 'https://sox.link/KdV0M8' :
    i === 5 ? 'https://cuty.io/missao6' :
    i === 6 ? 'https://exe.io/missao7' :
    i === 7 ? 'https://fbol.top/missao8' :
    i === 8 ? 'https://encurtandourl.com/missao9' : '#',
  // Links de validação para as missões
  validationLink: 
    i === 0 ? '/recompensa/validar-anuncio-id-va1-a1b2c3' :
    i === 1 ? '/recompensa/validar-anuncio-id-va2-d4e5f6' :
    i === 2 ? '/recompensa/validar-anuncio-id-va3-g7h8i9' :
    i === 3 ? '/recompensa/validar-anuncio-id-va4-j1k2l3' :
    i === 4 ? '/recompensa/validar-anuncio-id-va5-m4n5o6' :
    i === 5 ? '/recompensa/validar-anuncio-id-va6-p7q8r9' :
    i === 6 ? '/recompensa/validar-anuncio-id-va7-s1t2u3' :
    i === 7 ? '/recompensa/validar-anuncio-id-va8-v4w5x6' :
    i === 8 ? '/recompensa/validar-anuncio-id-va9-y7z8a9' : '#',
  localStorageKey: `ver_anuncio_${i + 1}_liberado`,
}));

// Pega os IDs das missões para facilitar o uso
const VER_ANUNCIO_1_MISSION_ID = VER_ANUNCIOS_MISSIONS[0].id;
const VER_ANUNCIO_2_MISSION_ID = VER_ANUNCIOS_MISSIONS[1].id;
const VER_ANUNCIO_3_MISSION_ID = VER_ANUNCIOS_MISSIONS[2].id;
const VER_ANUNCIO_4_MISSION_ID = VER_ANUNCIOS_MISSIONS[3].id;
const VER_ANUNCIO_5_MISSION_ID = VER_ANUNCIOS_MISSIONS[4].id;
const VER_ANUNCIO_6_MISSION_ID = VER_ANUNCIOS_MISSIONS[5].id;
const VER_ANUNCIO_7_MISSION_ID = VER_ANUNCIOS_MISSIONS[6].id;
const VER_ANUNCIO_8_MISSION_ID = VER_ANUNCIOS_MISSIONS[7].id;
const VER_ANUNCIO_9_MISSION_ID = VER_ANUNCIOS_MISSIONS[8].id;


const DailyMissionsPage = () => {
  const { userPoints } = useUserPoints();
  const [completedMissions, setCompletedMissions] = useState<number[]>([]);
  const [loadingMission, setLoadingMission] = useState<number | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // --- Estado para as missões "Ver Anúncios" ---
  const [unlockedVerAnuncios, setUnlockedVerAnuncios] = useState<Record<number, boolean>>({});


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
  }, [completedMissions, user]); // Adicionado completedMissions e user como dependências

  // Efeito para verificar a liberação da missão "Ver Anúncio 1"
  useEffect(() => {
    const checkVerAnuncio1Liberado = () => {
      const liberado = localStorage.getItem(VER_ANUNCIOS_MISSIONS[0].localStorageKey);
      if (liberado === 'true' && !completedMissions.includes(VER_ANUNCIO_1_MISSION_ID)) {
        setUnlockedVerAnuncios(prev => ({ ...prev, [VER_ANUNCIO_1_MISSION_ID]: true }));
        toast.info("Missão 'Ver Anúncio 1' liberada! Clique em 'Coletar' para ganhar seus pontos.");
        localStorage.removeItem(VER_ANUNCIOS_MISSIONS[0].localStorageKey);
      }
    };

    checkVerAnuncio1Liberado();
  }, [completedMissions]);

  // Efeito para verificar a liberação da missão "Ver Anúncio 2"
  useEffect(() => {
    const checkVerAnuncio2Liberado = () => {
      const liberado = localStorage.getItem(VER_ANUNCIOS_MISSIONS[1].localStorageKey);
      if (liberado === 'true' && !completedMissions.includes(VER_ANUNCIO_2_MISSION_ID)) {
        setUnlockedVerAnuncios(prev => ({ ...prev, [VER_ANUNCIO_2_MISSION_ID]: true }));
        toast.info("Missão 'Ver Anúncio 2' liberada! Clique em 'Coletar' para ganhar seus pontos.");
        localStorage.removeItem(VER_ANUNCIOS_MISSIONS[1].localStorageKey);
      }
    };

    checkVerAnuncio2Liberado();
  }, [completedMissions]);

  // Efeito para verificar a liberação da missão "Ver Anúncio 3"
  useEffect(() => {
    const checkVerAnuncio3Liberado = () => {
      const liberado = localStorage.getItem(VER_ANUNCIOS_MISSIONS[2].localStorageKey);
      if (liberado === 'true' && !completedMissions.includes(VER_ANUNCIO_3_MISSION_ID)) {
        setUnlockedVerAnuncios(prev => ({ ...prev, [VER_ANUNCIO_3_MISSION_ID]: true }));
        toast.info("Missão 'Ver Anúncio 3' liberada! Clique em 'Coletar' para ganhar seus pontos.");
        localStorage.removeItem(VER_ANUNCIOS_MISSIONS[2].localStorageKey);
      }
    };

    checkVerAnuncio3Liberado();
  }, [completedMissions]);

  // Efeitos para as missões 4 a 9
  useEffect(() => {
    const checkVerAnuncio4Liberado = () => {
      const liberado = localStorage.getItem(VER_ANUNCIOS_MISSIONS[3].localStorageKey);
      if (liberado === 'true' && !completedMissions.includes(VER_ANUNCIO_4_MISSION_ID)) {
        setUnlockedVerAnuncios(prev => ({ ...prev, [VER_ANUNCIO_4_MISSION_ID]: true }));
        toast.info("Missão 'Ver Anúncio 4' liberada! Clique em 'Coletar' para ganhar seus pontos.");
        localStorage.removeItem(VER_ANUNCIOS_MISSIONS[3].localStorageKey);
      }
    };
    checkVerAnuncio4Liberado();

    const checkVerAnuncio5Liberado = () => {
      const liberado = localStorage.getItem(VER_ANUNCIOS_MISSIONS[4].localStorageKey);
      if (liberado === 'true' && !completedMissions.includes(VER_ANUNCIO_5_MISSION_ID)) {
        setUnlockedVerAnuncios(prev => ({ ...prev, [VER_ANUNCIO_5_MISSION_ID]: true }));
        toast.info("Missão 'Ver Anúncio 5' liberada! Clique em 'Coletar' para ganhar seus pontos.");
        localStorage.removeItem(VER_ANUNCIOS_MISSIONS[4].localStorageKey);
      }
    };
    checkVerAnuncio5Liberado();

    const checkVerAnuncio6Liberado = () => {
      const liberado = localStorage.getItem(VER_ANUNCIOS_MISSIONS[5].localStorageKey);
      if (liberado === 'true' && !completedMissions.includes(VER_ANUNCIO_6_MISSION_ID)) {
        setUnlockedVerAnuncios(prev => ({ ...prev, [VER_ANUNCIO_6_MISSION_ID]: true }));
        toast.info("Missão 'Ver Anúncio 6' liberada! Clique em 'Coletar' para ganhar seus pontos.");
        localStorage.removeItem(VER_ANUNCIOS_MISSIONS[5].localStorageKey);
      }
    };
    checkVerAnuncio6Liberado();

    const checkVerAnuncio7Liberado = () => {
      const liberado = localStorage.getItem(VER_ANUNCIOS_MISSIONS[6].localStorageKey);
      if (liberado === 'true' && !completedMissions.includes(VER_ANUNCIO_7_MISSION_ID)) {
        setUnlockedVerAnuncios(prev => ({ ...prev, [VER_ANUNCIO_7_MISSION_ID]: true }));
        toast.info("Missão 'Ver Anúncio 7' liberada! Clique em 'Coletar' para ganhar seus pontos.");
        localStorage.removeItem(VER_ANUNCIOS_MISSIONS[6].localStorageKey);
      }
    };
    checkVerAnuncio7Liberado();

    const checkVerAnuncio8Liberado = () => {
      const liberado = localStorage.getItem(VER_ANUNCIOS_MISSIONS[7].localStorageKey);
      if (liberado === 'true' && !completedMissions.includes(VER_ANUNCIO_8_MISSION_ID)) {
        setUnlockedVerAnuncios(prev => ({ ...prev, [VER_ANUNCIO_8_MISSION_ID]: true }));
        toast.info("Missão 'Ver Anúncio 8' liberada! Clique em 'Coletar' para ganhar seus pontos.");
        localStorage.removeItem(VER_ANUNCIOS_MISSIONS[7].localStorageKey);
      }
    };
    checkVerAnuncio8Liberado();

    const checkVerAnuncio9Liberado = () => {
      const liberado = localStorage.getItem(VER_ANUNCIOS_MISSIONS[8].localStorageKey);
      if (liberado === 'true' && !completedMissions.includes(VER_ANUNCIO_9_MISSION_ID)) {
        setUnlockedVerAnuncios(prev => ({ ...prev, [VER_ANUNCIO_9_MISSION_ID]: true }));
        toast.info("Missão 'Ver Anúncio 9' liberada! Clique em 'Coletar' para ganhar seus pontos.");
        localStorage.removeItem(VER_ANUNCIOS_MISSIONS[8].localStorageKey);
      }
    };
    checkVerAnuncio9Liberado();
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
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Missões Diárias</h1>
            <p className="text-muted-foreground">Complete tarefas e ganhe pontos todos os dias.</p>
          </div>

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

          {/* --- Grid de Missões de Tempo e Vídeo --- */}
          <Card>
            <CardHeader className="items-center text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold uppercase md:text-2xl">
                <Clock className="w-6 h-6 text-primary" />Maratona de Lives
              </CardTitle>
              <CardDescription>Ganhe pontos por assistir lives por um tempo acumulado hoje.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Missão de 1 Hora */}
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

              {/* Missão de 3 Horas */}
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

              {/* Missão de 6 Horas */}
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
      </main>
    </div>
  );
};

export default DailyMissionsPage;